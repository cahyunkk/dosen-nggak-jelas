"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTopVariables, getGpuAssessments, getGpus } from "@/lib/data";
import { computeRanking } from "@/lib/analysis";
import type { ActionResult } from "@/lib/types";

/**
 * Menghitung ranking GPU dengan Weighted Average:
 *   Skor GPU = Σ (Nilai Assessment × Bobot Variabel)
 * Hanya GPU dengan assessment lengkap pada seluruh variabel TOP 5 yang diranking.
 */
export async function computeRankingAction(): Promise<ActionResult<{ ranked: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const [topVariables, gpus, assessments] = await Promise.all([
    getActiveTopVariables(),
    getGpus(),
    getGpuAssessments(),
  ]);

  if (topVariables.length === 0) {
    return { ok: false, message: "TOP 5 variabel belum ditetapkan. Ranking belum dapat dihitung." };
  }
  if (gpus.length === 0) {
    return { ok: false, message: "Belum ada kandidat GPU." };
  }

  const { ranked } = computeRanking(
    gpus.map((gpu) => ({ id: gpu.id, name: gpu.name })),
    assessments.map((row) => ({
      gpu_id: row.gpu_id,
      variable_id: row.variable_id,
      score: row.score,
    })),
    topVariables,
  );

  if (ranked.length === 0) {
    return {
      ok: false,
      message:
        "Belum ada GPU dengan assessment lengkap. Lengkapi penilaian seluruh variabel TOP 5 terlebih dahulu.",
    };
  }

  const batchId = randomUUID();

  const { error: deactivateError } = await supabase
    .from("ranking_results")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return { ok: false, message: `Gagal memperbarui ranking: ${deactivateError.message}` };
  }

  const { error } = await supabase.from("ranking_results").insert(
    ranked.map((item) => ({
      batch_id: batchId,
      top_variable_batch: topVariables[0]?.batch_id ?? null,
      gpu_id: item.gpu_id,
      final_score: item.finalScore,
      rank: item.rank,
      breakdown: item.breakdown,
      is_active: true,
      computed_by: user.id,
    })),
  );
  if (error) return { ok: false, message: `Gagal menyimpan ranking: ${error.message}` };

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: `Ranking berhasil dihitung untuk ${ranked.length} GPU.`,
    data: { ranked: ranked.length },
  };
}
