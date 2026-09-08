import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { rankAggregatedStats, type TopVariable, type VariableStat } from "@/lib/analysis";
import type { Gpu, GpuAssessment, RankingResult, Respondent, Variable } from "@/lib/types";

/**
 * Lapisan akses data. Semua fungsi membaca baris nyata dari Supabase.
 * Tidak ada nilai default/fiktif yang dikembalikan — koleksi kosong
 * berarti memang belum ada data dan UI wajib menampilkan empty state.
 */

export const getVariables = cache(async (): Promise<Variable[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("variables")
    .select("*")
    .order("order_index", { ascending: true });
  if (error) throw new Error(`Gagal memuat variabel: ${error.message}`);
  return data ?? [];
});

export const getRespondentCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("respondents")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(`Gagal menghitung responden: ${error.message}`);
  return count ?? 0;
});

export type LiveAnalysis = {
  stats: VariableStat[];
  respondentCount: number;
  answeredCount: number;
};

/** Analisis real-time dari view SQL `variable_analysis_live`. */
export const getLiveAnalysis = cache(async (): Promise<LiveAnalysis> => {
  const supabase = await createClient();
  const [{ data, error }, respondentCount] = await Promise.all([
    supabase.from("variable_analysis_live").select("*"),
    getRespondentCount(),
  ]);
  if (error) throw new Error(`Gagal memuat analisis variabel: ${error.message}`);

  const rows = (data ?? []).map((row) => ({
    variable_id: row.variable_id as string,
    code: row.code as string,
    name: row.name as string,
    order_index: row.order_index as number,
    total: Number(row.total_score ?? 0),
    respondentCount: Number(row.respondent_count ?? 0),
    average: Number(row.average_score ?? 0),
  }));

  return {
    stats: rankAggregatedStats(rows),
    respondentCount,
    answeredCount: rows.reduce((acc, row) => acc + row.respondentCount, 0),
  };
});

export type StoredTopVariable = TopVariable & {
  batch_id: string;
  selected_at: string;
};

/** TOP 5 yang sudah ditetapkan & tersimpan (is_active = true). */
export const getActiveTopVariables = cache(async (): Promise<StoredTopVariable[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("selected_top_variables")
    .select(
      "batch_id, variable_id, rank, average_score, weight, respondent_count, selected_at, variables(code, name, order_index)",
    )
    .eq("is_active", true)
    .order("rank", { ascending: true });
  if (error) throw new Error(`Gagal memuat TOP variabel: ${error.message}`);

  return (data ?? []).map((row) => {
    const variable = row.variables as unknown as {
      code: string;
      name: string;
      order_index: number;
    } | null;
    return {
      batch_id: row.batch_id as string,
      variable_id: row.variable_id as string,
      code: variable?.code ?? "",
      name: variable?.name ?? "(variabel dihapus)",
      order_index: variable?.order_index ?? 0,
      rank: row.rank as number,
      average: Number(row.average_score),
      weight: Number(row.weight),
      total: 0,
      respondentCount: Number(row.respondent_count),
      selected_at: row.selected_at as string,
    };
  });
});

export const getGpus = cache(async (): Promise<Gpu[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gpus")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Gagal memuat kandidat GPU: ${error.message}`);
  return data ?? [];
});

export const getGpuAssessments = cache(async (): Promise<GpuAssessment[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gpu_assessments").select("*");
  if (error) throw new Error(`Gagal memuat assessment GPU: ${error.message}`);
  return data ?? [];
});

export type ActiveRanking = (RankingResult & { gpu: Gpu | null })[];

export const getActiveRanking = cache(async (): Promise<ActiveRanking> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ranking_results")
    .select("*, gpu:gpus(*)")
    .eq("is_active", true)
    .order("rank", { ascending: true });
  if (error) throw new Error(`Gagal memuat hasil ranking: ${error.message}`);
  return (data ?? []) as unknown as ActiveRanking;
});

export type RespondentWithScores = Respondent & {
  respondent_assessments: { variable_id: string; score: number }[];
};

export async function getRespondents(page = 1, pageSize = 25, search = "") {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("respondents")
    .select("*, respondent_assessments(variable_id, score)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (search.trim().length > 0) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(`Gagal memuat responden: ${error.message}`);
  return { rows: (data ?? []) as unknown as RespondentWithScores[], total: count ?? 0 };
}

export const getLikertDistribution = cache(async (): Promise<{ score: number; total: number }[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("likert_distribution_live").select("*");
  if (error) throw new Error(`Gagal memuat distribusi Likert: ${error.message}`);
  return (data ?? []).map((row) => ({
    score: Number(row.score),
    total: Number(row.total),
  }));
});

export type WorkflowState = {
  respondentCount: number;
  variableCount: number;
  topVariables: StoredTopVariable[];
  hasTopVariables: boolean;
  gpuCount: number;
  assessedGpuCount: number;
  rankingCount: number;
  canAssess: boolean;
  canRank: boolean;
};

/** Status alur kerja dipakai untuk mengunci tahap yang belum boleh dijalankan. */
export const getWorkflowState = cache(async (): Promise<WorkflowState> => {
  const supabase = await createClient();
  const [respondentCount, topVariables, variables] = await Promise.all([
    getRespondentCount(),
    getActiveTopVariables(),
    getVariables(),
  ]);

  const [{ count: gpuCount }, { data: assessments }, { count: rankingCount }] = await Promise.all([
    supabase.from("gpus").select("id", { count: "exact", head: true }),
    supabase.from("gpu_assessments").select("gpu_id, variable_id"),
    supabase.from("ranking_results").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const topIds = new Set(topVariables.map((item) => item.variable_id));
  const perGpu = new Map<string, Set<string>>();
  for (const row of assessments ?? []) {
    if (!topIds.has(row.variable_id as string)) continue;
    const set = perGpu.get(row.gpu_id as string) ?? new Set<string>();
    set.add(row.variable_id as string);
    perGpu.set(row.gpu_id as string, set);
  }
  const assessedGpuCount = [...perGpu.values()].filter(
    (set) => topVariables.length > 0 && set.size === topVariables.length,
  ).length;

  return {
    respondentCount,
    variableCount: variables.length,
    topVariables,
    hasTopVariables: topVariables.length > 0,
    gpuCount: gpuCount ?? 0,
    assessedGpuCount,
    rankingCount: rankingCount ?? 0,
    canAssess: respondentCount > 0 && topVariables.length > 0 && (gpuCount ?? 0) > 0,
    canRank: assessedGpuCount > 0,
  };
});
