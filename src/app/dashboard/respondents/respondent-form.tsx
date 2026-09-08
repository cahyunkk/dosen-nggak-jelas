"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Save } from "lucide-react";
import { saveRespondentAction } from "./actions";
import { LIKERT_SCALE } from "@/lib/constants";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionResult, Variable } from "@/lib/types";

export type RespondentFormInitial = {
  id: string;
  name: string;
  age: number | null;
  gaming_experience: string | null;
  gpu_knowledge: string | null;
  notes: string | null;
  scores: Record<string, number>;
};

export function RespondentForm({
  variables,
  initial,
}: {
  variables: Variable[];
  initial?: RespondentFormInitial;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    saveRespondentAction,
    null,
  );
  const [scores, setScores] = useState<Record<string, number>>(initial?.scores ?? {});
  const filled = variables.filter((variable) => scores[variable.id] !== undefined).length;

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      {state && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <div className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold text-white">Identitas Responden</h2>
        <p className="mt-1 text-sm text-slate-400">
          Hanya nama/ID yang wajib. Field lain bersifat opsional.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Nama atau ID Responden <span className="text-rose-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              defaultValue={initial?.name ?? ""}
              placeholder="mis. R-001 atau nama responden"
            />
            {state?.errors?.name ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="age">
              Usia <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min={5}
              max={120}
              className="input"
              defaultValue={initial?.age ?? ""}
              placeholder="mis. 21"
            />
            {state?.errors?.age ? (
              <p className="mt-1 text-xs text-rose-400">{state.errors.age}</p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="gaming_experience">
              Pengalaman Bermain Game <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="gaming_experience"
              name="gaming_experience"
              className="input"
              defaultValue={initial?.gaming_experience ?? ""}
              placeholder="mis. 5 tahun / Casual / Kompetitif"
            />
          </div>
          <div>
            <label className="label" htmlFor="gpu_knowledge">
              Pengetahuan mengenai GPU <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="gpu_knowledge"
              name="gpu_knowledge"
              className="input"
              defaultValue={initial?.gpu_knowledge ?? ""}
              placeholder="mis. Pemula / Menengah / Mahir"
            />
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Catatan <span className="text-slate-500">(opsional)</span>
            </label>
            <input
              id="notes"
              name="notes"
              className="input"
              defaultValue={initial?.notes ?? ""}
              placeholder="Catatan tambahan"
            />
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Penilaian Skala Likert</h2>
            <p className="mt-1 text-sm text-slate-400">
              Seluruh 10 variabel wajib diisi dengan nilai 1–5.
            </p>
          </div>
          <span
            className={`badge ${
              filled === variables.length
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-slate-700 bg-slate-800 text-slate-400"
            }`}
          >
            {filled}/{variables.length} terisi
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
                {state?.errors?.[`score_${variable.id}`] ? (
                  <p className="mt-1 text-xs text-rose-400">
                    {state.errors[`score_${variable.id}`]}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex shrink-0 gap-1.5 sm:mt-0">
                {LIKERT_SCALE.map((option) => {
                  const active = scores[variable.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      title={option.label}
                      className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                        active
                          ? "border-indigo-400 bg-indigo-500 text-white"
                          : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`score_${variable.id}`}
                        value={option.value}
                        className="sr-only"
                        checked={active}
                        onChange={() =>
                          setScores((prev) => ({ ...prev, [variable.id]: option.value }))
                        }
                      />
                      {option.value}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          {LIKERT_SCALE.map((option) => (
            <span key={option.value}>
              <strong className="text-slate-400">{option.value}</strong> = {option.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Menyimpan…">
          <Save className="h-4 w-4" /> {initial ? "Simpan Perubahan" : "Simpan Responden"}
        </SubmitButton>
        <Link href="/dashboard/respondents" className="btn-secondary">
          Batal
        </Link>
      </div>
    </form>
  );
}
