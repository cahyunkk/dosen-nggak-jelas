"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getVariables } from "@/lib/data";
import type { ActionResult } from "@/lib/types";

export type ImportPayloadRow = {
  name: string;
  age: number | null;
  gaming_experience: string | null;
  gpu_knowledge: string | null;
  scores: Record<string, number>;
};

/**
 * Menyimpan hasil import CSV. Hanya baris valid yang dikirim client,
 * namun seluruhnya divalidasi ulang di server sebelum masuk database.
 */
export async function importRespondentsAction(
  rows: ImportPayloadRow[],
): Promise<ActionResult<{ imported: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, message: "Tidak ada baris valid untuk diimport." };
  }

  const variables = await getVariables();
  if (variables.length === 0) {
    return { ok: false, message: "Tabel variabel kosong. Jalankan SQL migration terlebih dahulu." };
  }
  const variableIds = new Set(variables.map((variable) => variable.id));

  const respondentRows: Record<string, unknown>[] = [];
  const assessmentRows: { respondent_id: string; variable_id: string; score: number }[] = [];

  for (const [index, row] of rows.entries()) {
    const name = String(row.name ?? "").trim();
    if (name.length === 0) {
      return { ok: false, message: `Baris ${index + 1}: nama/ID responden kosong.` };
    }

    const scoreEntries = Object.entries(row.scores ?? {});
    if (scoreEntries.length !== variables.length) {
      return {
        ok: false,
        message: `Baris ${index + 1} (${name}): jumlah nilai variabel tidak lengkap (${scoreEntries.length}/${variables.length}).`,
      };
    }

    const respondentId = randomUUID();
    for (const [variableId, rawScore] of scoreEntries) {
      const score = Number(rawScore);
      if (!variableIds.has(variableId)) {
        return { ok: false, message: `Baris ${index + 1}: variabel tidak dikenal.` };
      }
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        return {
          ok: false,
          message: `Baris ${index + 1} (${name}): nilai Likert harus bilangan bulat 1–5.`,
        };
      }
      assessmentRows.push({ respondent_id: respondentId, variable_id: variableId, score });
    }

    const age = row.age === null || row.age === undefined ? null : Number(row.age);
    respondentRows.push({
      id: respondentId,
      name,
      age: age !== null && Number.isInteger(age) && age >= 5 && age <= 120 ? age : null,
      gaming_experience: row.gaming_experience?.toString().trim() || null,
      gpu_knowledge: row.gpu_knowledge?.toString().trim() || null,
      source: "csv",
      created_by: user.id,
    });
  }

  for (const chunk of chunked(respondentRows, 500)) {
    const { error } = await supabase.from("respondents").insert(chunk);
    if (error) return { ok: false, message: `Gagal menyimpan responden: ${error.message}` };
  }

  for (const chunk of chunked(assessmentRows, 1000)) {
    const { error } = await supabase.from("respondent_assessments").insert(chunk);
    if (error) return { ok: false, message: `Gagal menyimpan nilai Likert: ${error.message}` };
  }

  revalidatePath("/dashboard", "layout");
  return {
    ok: true,
    message: `${respondentRows.length} responden berhasil diimport.`,
    data: { imported: respondentRows.length },
  };
}

function chunked<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
