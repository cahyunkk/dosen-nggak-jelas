"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { LIKERT_SCALE } from "@/lib/constants";
import type { Variable } from "@/lib/types";

export function SurveyForm({ variables }: { variables: Variable[] }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [experience, setExperience] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const filled = variables.filter((variable) => scores[variable.id] !== undefined).length;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (name.trim().length === 0) {
      setError("Nama atau ID responden wajib diisi.");
      return;
    }
    if (filled !== variables.length) {
      setError(`Seluruh ${variables.length} variabel wajib dinilai (baru ${filled} terisi).`);
      return;
    }

    let parsedAge: number | null = null;
    if (age.trim().length > 0) {
      const value = Number(age);
      if (!Number.isInteger(value) || value < 5 || value > 120) {
        setError("Usia harus bilangan bulat 5–120.");
        return;
      }
      parsedAge = value;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const respondentId = crypto.randomUUID();

      const { error: respondentError } = await supabase.from("respondents").insert({
        id: respondentId,
        name: name.trim(),
        age: parsedAge,
        gaming_experience: experience.trim() || null,
        gpu_knowledge: knowledge.trim() || null,
        source: "public",
      });
      if (respondentError) {
        setError(`Gagal mengirim jawaban: ${respondentError.message}`);
        return;
      }

      const { error: assessmentError } = await supabase.from("respondent_assessments").insert(
        variables.map((variable) => ({
          respondent_id: respondentId,
          variable_id: variable.id,
          score: scores[variable.id],
        })),
      );
      if (assessmentError) {
        setError(`Gagal menyimpan nilai: ${assessmentError.message}`);
        return;
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="text-lg font-semibold text-white">Terima kasih!</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Jawaban Anda sudah tersimpan dan akan langsung diperhitungkan dalam analisis rata-rata
          variabel.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setDone(false);
              setName("");
              setAge("");
              setExperience("");
              setKnowledge("");
              setScores({});
            }}
          >
            Isi lagi untuk responden lain
          </button>
          <Link href="/" className="btn-ghost">
            Kembali
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Identitas Responden</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Nama atau ID Responden <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              className="input"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="age">
              Usia <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="age"
              type="number"
              min={5}
              max={120}
              className="input"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="experience">
              Pengalaman Bermain Game <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="experience"
              className="input"
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="knowledge">
              Pengetahuan mengenai GPU <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="knowledge"
              className="input"
              value={knowledge}
              onChange={(event) => setKnowledge(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Seberapa penting faktor berikut saat Anda memilih GPU?
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              1 = Sangat Tidak Penting · 5 = Sangat Penting
            </p>
          </div>
          <span
            className={`badge ${
              filled === variables.length
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-slate-700 bg-slate-800 text-slate-400"
            }`}
          >
            {filled}/{variables.length}
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {variables.map((variable, index) => (
            <div
              key={variable.id}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100">
                  <span className="mr-2 font-mono text-xs text-slate-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {variable.name}
                </p>
                {variable.description ? (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {variable.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex shrink-0 gap-1.5 sm:mt-0">
                {LIKERT_SCALE.map((option) => {
                  const active = scores[variable.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      title={option.label}
                      onClick={() =>
                        setScores((prev) => ({ ...prev, [variable.id]: option.value }))
                      }
                      className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-colors ${
                        active
                          ? "border-indigo-400 bg-indigo-500 text-white"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Mengirim…" : "Kirim Jawaban"}
      </button>
    </form>
  );
}
