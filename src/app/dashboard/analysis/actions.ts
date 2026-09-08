"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getLiveAnalysis } from "@/lib/data";
import { selectTopVariables } from "@/lib/analysis";
import { TOP_N } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

/**
 * Menghitung ulang analisis variabel dari data responden nyata,
 * menyimpan snapshot ke `variable_analysis`, lalu menetapkan TOP 5
 * beserta bobotnya ke `selected_top_variables`.
 */
export async function computeTopVariablesAction(): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const { stats, respondentCount } = await getLiveAnalysis();

  if (respondentCount === 0) {
    return {
      ok: false,
      message: "Belum ada data responden. TOP 5 belum dapat dihitung.",
    };
  }

  const answered = stats.filter((stat) => stat.respondentCount > 0);
  if (answered.length < TOP_N) {
    return {
      ok: false,
      message: `Data belum cukup: baru ${answered.length} variabel memiliki jawaban, minimal ${TOP_N} variabel diperlukan.`,
    };
  }

  const top = selectTopVariables(stats, TOP_N);
  if (top.length < TOP_N) {
    return { ok: false, message: "Perhitungan TOP 5 gagal: rata-rata variabel tidak valid." };
  }

  const batchId = randomUUID();

  const { error: analysisError } = await supabase.from("variable_analysis").insert(
    stats.map((stat) => ({
      batch_id: batchId,
      variable_id: stat.variable_id,
      total_score: stat.total,
      respondent_count: stat.respondentCount,
      average_score: stat.average,
      rank: stat.rank,
      computed_by: user.id,
    })),
  );
  if (analysisError) {
    return { ok: false, message: `Gagal menyimpan analisis: ${analysisError.message}` };
  }

  const { error: deactivateError } = await supabase
    .from("selected_top_variables")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) {
    return { ok: false, message: `Gagal memperbarui TOP variabel: ${deactivateError.message}` };
  }

  const { error: insertError } = await supabase.from("selected_top_variables").insert(
    top.map((item) => ({
      batch_id: batchId,
      variable_id: item.variable_id,
      rank: item.rank,
      average_score: item.average,
      weight: item.weight,
      respondent_count: item.respondentCount,
      is_active: true,
      selected_by: user.id,
    })),
  );
  if (insertError) {
    return { ok: false, message: `Gagal menyimpan TOP ${TOP_N}: ${insertError.message}` };
  }

  // Ranking lama menjadi tidak valid karena bobot berubah.
  await supabase.from("ranking_results").update({ is_active: false }).eq("is_active", true);

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: `TOP ${TOP_N} variabel berhasil ditetapkan dari ${respondentCount} responden.`,
    data: { count: top.length },
  };
}
