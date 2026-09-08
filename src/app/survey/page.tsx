import Link from "next/link";
import { notFound } from "next/navigation";
import { Cpu } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { getVariables } from "@/lib/data";
import { enablePublicSurvey, isSupabaseConfigured } from "@/lib/supabase/config";
import { SurveyForm } from "./survey-form";

export const metadata = {
  title: "Kuesioner Preferensi GPU",
  description: "Kuesioner Skala Likert preferensi pemilihan GPU untuk kebutuhan gaming.",
};

export const dynamic = "force-dynamic";

export default async function SurveyPage() {
  if (!enablePublicSurvey || !isSupabaseConfigured) notFound();

  let variables: Awaited<ReturnType<typeof getVariables>> = [];
  let loadError: string | null = null;
  try {
    variables = await getVariables();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Gagal menghubungi database.";
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          <Cpu className="h-4 w-4" />
        </span>
        <span className="text-sm font-bold text-white">GPU Preference Ranking System</span>
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Kuesioner Preferensi Pemilihan GPU
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-slate-400">
        Isi penilaian Anda terhadap 10 faktor pemilihan GPU untuk kebutuhan gaming. Jawaban
        digunakan untuk menghitung faktor paling berpengaruh dalam penelitian ini.
      </p>

      {loadError ? (
        <Alert tone="error" title="Kuesioner sedang tidak dapat diakses">
          {loadError}
        </Alert>
      ) : variables.length === 0 ? (
        <Alert tone="error" title="Kuesioner belum siap">
          Daftar variabel belum tersedia di database. Hubungi admin penelitian.
        </Alert>
      ) : (
        <SurveyForm variables={variables} />
      )}
    </main>
  );
}
