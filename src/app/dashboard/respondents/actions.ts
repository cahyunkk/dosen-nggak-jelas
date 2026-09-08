"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getVariables } from "@/lib/data";
import type { ActionResult } from "@/lib/types";

function parseScore(raw: FormDataEntryValue | null): number | null {
  if (raw === null) return null;
  const value = Number(String(raw).trim());
  if (!Number.isInteger(value) || value < 1 || value > 5) return null;
  return value;
}

export async function saveRespondentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login ulang." };

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const gamingExperience = String(formData.get("gaming_experience") ?? "").trim();
  const gpuKnowledge = String(formData.get("gpu_knowledge") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const errors: Record<string, string> = {};
  if (name.length === 0) errors.name = "Nama atau ID responden wajib diisi.";

  let age: number | null = null;
  if (ageRaw.length > 0) {
    const parsed = Number(ageRaw);
    if (!Number.isInteger(parsed) || parsed < 5 || parsed > 120) {
      errors.age = "Usia harus bilangan bulat 5–120.";
    } else {
      age = parsed;
    }
  }

  const variables = await getVariables();
  if (variables.length === 0) {
    return {
      ok: false,
      message:
        "Tabel variabel kosong. Jalankan SQL migration terlebih dahulu agar 10 variabel penelitian tersedia.",
    };
  }

  const scores: { variable_id: string; score: number }[] = [];
  for (const variable of variables) {
    const score = parseScore(formData.get(`score_${variable.id}`));
    if (score === null) {
      errors[`score_${variable.id}`] = "Wajib dipilih (1–5).";
      continue;
    }
    scores.push({ variable_id: variable.id, score });
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Periksa kembali isian: seluruh 10 variabel wajib dinilai 1–5.",
      errors,
    };
  }

  let respondentId = id;

  if (id.length > 0) {
    const { error } = await supabase
      .from("respondents")
      .update({
        name,
        age,
        gaming_experience: gamingExperience || null,
        gpu_knowledge: gpuKnowledge || null,
        notes: notes || null,
      })
      .eq("id", id);
    if (error) return { ok: false, message: `Gagal memperbarui responden: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("respondents")
      .insert({
        name,
        age,
        gaming_experience: gamingExperience || null,
        gpu_knowledge: gpuKnowledge || null,
        notes: notes || null,
        source: "manual",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { ok: false, message: `Gagal menyimpan responden: ${error?.message ?? "unknown"}` };
    }
    respondentId = data.id;
  }

  const { error: assessmentError } = await supabase.from("respondent_assessments").upsert(
    scores.map((row) => ({
      respondent_id: respondentId,
      variable_id: row.variable_id,
      score: row.score,
    })),
    { onConflict: "respondent_id,variable_id" },
  );

  if (assessmentError) {
    return { ok: false, message: `Gagal menyimpan nilai Likert: ${assessmentError.message}` };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/respondents?saved=${id.length > 0 ? "updated" : "created"}`);
}

export async function deleteRespondentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (id.length === 0) return;
  const supabase = await createClient();
  await supabase.from("respondents").delete().eq("id", id);
  revalidatePath("/dashboard", "layout");
}
