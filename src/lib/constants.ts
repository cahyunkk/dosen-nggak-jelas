export const TOP_N = 5;

export const LIKERT_SCALE = [
  { value: 1, label: "Sangat Tidak Penting", short: "STP" },
  { value: 2, label: "Tidak Penting", short: "TP" },
  { value: 3, label: "Cukup Penting", short: "CP" },
  { value: 4, label: "Penting", short: "P" },
  { value: 5, label: "Sangat Penting", short: "SP" },
] as const;

export const GPU_LIKERT_SCALE = [
  { value: 1, label: "Sangat Kurang", short: "SK" },
  { value: 2, label: "Kurang", short: "K" },
  { value: 3, label: "Cukup", short: "C" },
  { value: 4, label: "Baik", short: "B" },
  { value: 5, label: "Sangat Baik", short: "SB" },
] as const;

/**
 * Urutan & kode variabel instrumen penelitian.
 * Ini definisi struktur kuesioner (master data), bukan data hasil pengukuran.
 * Sumber kebenaran tetap tabel `variables` di Supabase.
 */
export const VARIABLE_CODES = [
  "performa_gaming",
  "harga_gpu",
  "value_for_money",
  "kapasitas_vram",
  "ray_tracing",
  "efisiensi_daya",
  "suhu_operasional",
  "teknologi_fitur",
  "future_proof",
  "kompatibilitas_pc",
] as const;

export type VariableCode = (typeof VARIABLE_CODES)[number];

export const CHART_COLORS = [
  "#6366f1",
  "#22d3ee",
  "#34d399",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#38bdf8",
  "#4ade80",
  "#fb923c",
  "#f87171",
];
