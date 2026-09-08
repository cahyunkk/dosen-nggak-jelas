import { TOP_N } from "./constants";
import type { RankingBreakdownItem, UUID } from "./types";

/**
 * Modul perhitungan murni (pure functions).
 * Tidak ada data yang di-hardcode di sini — semua input berasal dari
 * baris nyata yang tersimpan di Supabase.
 */

export type VariableRef = {
  id: UUID;
  code: string;
  name: string;
  order_index: number;
};

export type ScoreRow = {
  variable_id: UUID;
  score: number;
};

export type VariableStat = {
  variable_id: UUID;
  code: string;
  name: string;
  order_index: number;
  total: number;
  respondentCount: number;
  average: number;
  rank: number;
};

export type TopVariable = VariableStat & {
  weight: number;
};

/**
 * Rata-rata Variabel = Total Nilai Seluruh Responden / Jumlah Responden
 * Variabel tanpa satu pun jawaban tidak diberi nilai (average = null-safe 0
 * tetapi respondentCount = 0 sehingga pemanggil dapat menyembunyikannya).
 */
export function computeVariableAnalysis(
  variables: VariableRef[],
  rows: ScoreRow[],
): VariableStat[] {
  const totals = new Map<UUID, { total: number; count: number }>();

  for (const row of rows) {
    if (!Number.isFinite(row.score)) continue;
    const bucket = totals.get(row.variable_id) ?? { total: 0, count: 0 };
    bucket.total += row.score;
    bucket.count += 1;
    totals.set(row.variable_id, bucket);
  }

  const stats: Omit<VariableStat, "rank">[] = variables.map((variable) => {
    const bucket = totals.get(variable.id) ?? { total: 0, count: 0 };
    return {
      variable_id: variable.id,
      code: variable.code,
      name: variable.name,
      order_index: variable.order_index,
      total: bucket.total,
      respondentCount: bucket.count,
      average: bucket.count > 0 ? bucket.total / bucket.count : 0,
    };
  });

  return rankAggregatedStats(stats);
}

/**
 * Memberi peringkat pada hasil agregasi (mis. dari view SQL
 * `variable_analysis_live`) memakai aturan tiebreak yang sama.
 */
export function rankAggregatedStats(stats: Omit<VariableStat, "rank">[]): VariableStat[] {
  const sorted = [...stats].sort(compareStats);
  return sorted.map((stat, index) => ({ ...stat, rank: index + 1 }));
}

function compareStats(
  a: Omit<VariableStat, "rank">,
  b: Omit<VariableStat, "rank">,
): number {
  if (b.average !== a.average) return b.average - a.average;
  if (b.total !== a.total) return b.total - a.total;
  return a.order_index - b.order_index;
}

/**
 * Bobot = Rata-rata Variabel / Total Rata-rata Seluruh TOP 5
 * Total bobot selalu = 1.
 */
export function selectTopVariables(
  stats: VariableStat[],
  topN: number = TOP_N,
): TopVariable[] {
  const eligible = stats.filter((stat) => stat.respondentCount > 0 && stat.average > 0);
  const top = eligible.slice(0, topN);
  const sumAverage = top.reduce((acc, stat) => acc + stat.average, 0);

  if (top.length === 0 || sumAverage <= 0) return [];

  return top.map((stat, index) => ({
    ...stat,
    rank: index + 1,
    weight: stat.average / sumAverage,
  }));
}

export type GpuRef = { id: UUID; name: string };

export type RankedGpu = {
  gpu_id: UUID;
  name: string;
  finalScore: number;
  rank: number;
  breakdown: RankingBreakdownItem[];
};

export type RankingOutcome = {
  ranked: RankedGpu[];
  incomplete: { gpu_id: UUID; name: string; missing: string[] }[];
};

/**
 * Skor GPU = Σ (Nilai Assessment × Bobot Variabel)
 * Hanya GPU dengan assessment lengkap pada seluruh variabel TOP N
 * yang masuk ke ranking.
 */
export function computeRanking(
  gpus: GpuRef[],
  assessments: { gpu_id: UUID; variable_id: UUID; score: number }[],
  topVariables: TopVariable[],
): RankingOutcome {
  if (topVariables.length === 0) return { ranked: [], incomplete: [] };

  const byGpu = new Map<UUID, Map<UUID, number>>();
  for (const item of assessments) {
    const map = byGpu.get(item.gpu_id) ?? new Map<UUID, number>();
    map.set(item.variable_id, item.score);
    byGpu.set(item.gpu_id, map);
  }

  const complete: Omit<RankedGpu, "rank">[] = [];
  const incomplete: RankingOutcome["incomplete"] = [];

  for (const gpu of gpus) {
    const scores = byGpu.get(gpu.id) ?? new Map<UUID, number>();
    const missing = topVariables
      .filter((variable) => !isValidScore(scores.get(variable.variable_id)))
      .map((variable) => variable.name);

    if (missing.length > 0) {
      incomplete.push({ gpu_id: gpu.id, name: gpu.name, missing });
      continue;
    }

    const breakdown: RankingBreakdownItem[] = topVariables.map((variable) => {
      const score = scores.get(variable.variable_id) as number;
      return {
        variable_id: variable.variable_id,
        variable_name: variable.name,
        score,
        weight: variable.weight,
        contribution: score * variable.weight,
      };
    });

    complete.push({
      gpu_id: gpu.id,
      name: gpu.name,
      finalScore: breakdown.reduce((acc, item) => acc + item.contribution, 0),
      breakdown,
    });
  }

  const sorted = complete.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return a.name.localeCompare(b.name);
  });

  // Competition ranking: skor identik mendapat peringkat yang sama.
  const ranked: RankedGpu[] = [];
  sorted.forEach((gpu, index) => {
    const previous = ranked[index - 1];
    const sameAsPrevious =
      previous !== undefined && roundTo(previous.finalScore, 6) === roundTo(gpu.finalScore, 6);
    ranked.push({ ...gpu, rank: sameAsPrevious ? previous.rank : index + 1 });
  });

  return { ranked, incomplete };
}

function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 5;
}

export function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}
