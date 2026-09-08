"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTopVariables, getGpus } from "@/lib/data";
import type { ActionResult } from "@/lib/types";

export type AssessmentInput = {
  gpu_id: string;
  variable_id: string;
  score: number;
};

/** Menyimpan nilai assessment GPU (1–5) untuk variabel TOP 5. */
export async function saveGpuAssessmentsAction(
  values: AssessmentInput[],
): Promise<ActionResult<{ saved: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const [topVariables, gpus] = await Promise.all([getActiveTopVariables(), getGpus()]);

  if (topVariables.length === 0) {
    return {
      ok: false,
      message: "TOP 5 variabel belum ditetapkan. Assessment belum dapat dilakukan.",
    };
  }
  if (gpus.length === 0) {
    return { ok: false, message: "Belum ada kandidat GPU." };
  }

  const validVariables = new Set(topVariables.map((item) => item.variable_id));
  const validGpus = new Set(gpus.map((gpu) => gpu.id));

  const rows: AssessmentInput[] = [];
  for (const value of values ?? []) {
    if (!validGpus.has(value.gpu_id) || !validVariables.has(value.variable_id)) continue;
    const score = Number(value.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      return { ok: false, message: "Nilai assessment harus bilangan bulat 1–5." };
    }
    rows.push({ gpu_id: value.gpu_id, variable_id: value.variable_id, score });
  }

  if (rows.length === 0) {
    return { ok: false, message: "Belum ada nilai yang diisi." };
  }

  const { error } = await supabase.from("gpu_assessments").upsert(
    rows.map((row) => ({ ...row, assessed_by: user.id })),
    { onConflict: "gpu_id,variable_id" },
  );
  if (error) return { ok: false, message: `Gagal menyimpan assessment: ${error.message}` };

  // Ranking aktif menjadi kedaluwarsa setelah nilai assessment berubah.
  await supabase.from("ranking_results").update({ is_active: false }).eq("is_active", true);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: `${rows.length} nilai assessment tersimpan.`, data: { saved: rows.length } };
}

export async function resetGpuAssessmentAction(
  gpuId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const { error } = await supabase.from("gpu_assessments").delete().eq("gpu_id", gpuId);
  if (error) return { ok: false, message: `Gagal menghapus assessment: ${error.message}` };

  await supabase.from("ranking_results").update({ is_active: false }).eq("is_active", true);
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Assessment GPU dihapus." };
}
