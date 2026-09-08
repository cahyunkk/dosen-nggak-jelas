import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/card";
import { getVariables } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { RespondentForm, type RespondentFormInitial } from "../respondent-form";

export const metadata = { title: "Edit Responden" };

export default async function EditRespondentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [variables, { data }] = await Promise.all([
    getVariables(),
    supabase
      .from("respondents")
      .select("*, respondent_assessments(variable_id, score)")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!data) notFound();

  const scores: Record<string, number> = {};
  for (const item of (data.respondent_assessments ?? []) as {
    variable_id: string;
    score: number;
  }[]) {
    scores[item.variable_id] = item.score;
  }

  const initial: RespondentFormInitial = {
    id: data.id,
    name: data.name,
    age: data.age,
    gaming_experience: data.gaming_experience,
    gpu_knowledge: data.gpu_knowledge,
    notes: data.notes,
    scores,
  };

  return (
    <>
      <PageHeader
        step="Tahap 1 · Edit Data"
        title={`Edit: ${data.name}`}
        description="Perubahan nilai akan langsung memengaruhi perhitungan rata-rata variabel."
      />
      <RespondentForm variables={variables} initial={initial} />
    </>
  );
}
