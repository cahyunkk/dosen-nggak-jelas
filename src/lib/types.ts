export type UUID = string;

export type Variable = {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type Respondent = {
  id: UUID;
  name: string;
  age: number | null;
  gaming_experience: string | null;
  gpu_knowledge: string | null;
  source: "manual" | "csv" | "public";
  notes: string | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
};

export type RespondentAssessment = {
  id: UUID;
  respondent_id: UUID;
  variable_id: UUID;
  score: number;
  created_at: string;
  updated_at: string;
};

export type SelectedTopVariable = {
  id: UUID;
  batch_id: UUID;
  variable_id: UUID;
  rank: number;
  average_score: number;
  weight: number;
  respondent_count: number;
  is_active: boolean;
  selected_at: string;
};

export type VariableAnalysisRow = {
  id: UUID;
  batch_id: UUID;
  variable_id: UUID;
  total_score: number;
  respondent_count: number;
  average_score: number;
  rank: number;
  computed_at: string;
};

export type Gpu = {
  id: UUID;
  name: string;
  brand: string;
  series: string | null;
  vram_gb: number | null;
  release_year: number | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type GpuAssessment = {
  id: UUID;
  gpu_id: UUID;
  variable_id: UUID;
  score: number;
  created_at: string;
  updated_at: string;
};

export type RankingResult = {
  id: UUID;
  batch_id: UUID;
  top_variable_batch: UUID | null;
  gpu_id: UUID;
  final_score: number;
  rank: number;
  breakdown: RankingBreakdownItem[];
  is_active: boolean;
  computed_at: string;
};

export type RankingBreakdownItem = {
  variable_id: UUID;
  variable_name: string;
  score: number;
  weight: number;
  contribution: number;
};

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T; errors?: undefined }
  | { ok: false; message: string; errors?: Record<string, string>; data?: undefined };
