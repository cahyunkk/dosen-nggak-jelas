"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/card";
import { GPU_LIKERT_SCALE } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { saveGpuAssessmentsAction, type AssessmentInput } from "./actions";
import type { Gpu } from "@/lib/types";

type TopVariableView = {
  variable_id: string;
  name: string;
  rank: number;
  weight: number;
};

export function AssessmentMatrix({
  gpus,
  topVariables,
  initialScores,
}: {
  gpus: Gpu[];
  topVariables: TopVariableView[];
  /** key: `${gpu_id}:${variable_id}` */
  initialScores: Record<string, number>;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const dirty = useMemo(() => {
    const keys = new Set([...Object.keys(scores), ...Object.keys(initialScores)]);
    for (const key of keys) {
      if (scores[key] !== initialScores[key]) return true;
    }
    return false;
  }, [scores, initialScores]);

  const totalCells = gpus.length * topVariables.length;
  const filledCells = gpus.reduce(
    (acc, gpu) =>
      acc +
      topVariables.filter((variable) => scores[`${gpu.id}:${variable.variable_id}`] !== undefined)
        .length,
    0,
  );

  function setScore(gpuId: string, variableId: string, value: number) {
    setScores((prev) => ({ ...prev, [`${gpuId}:${variableId}`]: value }));
  }

  function save() {
    setMessage(null);
    const values: AssessmentInput[] = [];
    for (const gpu of gpus) {
      for (const variable of topVariables) {
        const score = scores[`${gpu.id}:${variable.variable_id}`];
        if (score === undefined) continue;
        values.push({ gpu_id: gpu.id, variable_id: variable.variable_id, score });
      }
    }
    if (values.length === 0) {
      setMessage({ tone: "error", text: "Isi minimal satu nilai sebelum menyimpan." });
      return;
    }
    startTransition(async () => {
      const result = await saveGpuAssessmentsAction(values);
      setMessage({
        tone: result.ok ? "success" : "error",
        text: result.message ?? "Selesai.",
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={filledCells === totalCells ? "emerald" : "amber"}>
            {filledCells}/{totalCells} sel terisi
          </Badge>
          <span className="text-xs text-slate-500">
            Skala: {GPU_LIKERT_SCALE.map((item) => `${item.value}=${item.label}`).join(" · ")}
          </span>
        </div>
        <button type="button" className="btn-primary" onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Menyimpan…" : dirty ? "Simpan Assessment" : "Tersimpan"}
        </button>
      </div>

      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <div className="space-y-4">
        {gpus.map((gpu) => {
          const filled = topVariables.filter(
            (variable) => scores[`${gpu.id}:${variable.variable_id}`] !== undefined,
          ).length;
          const complete = filled === topVariables.length;
          const previewScore = complete
            ? topVariables.reduce(
                (acc, variable) =>
                  acc + (scores[`${gpu.id}:${variable.variable_id}`] ?? 0) * variable.weight,
                0,
              )
            : null;

          return (
            <div key={gpu.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{gpu.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[gpu.brand, gpu.series].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {previewScore !== null ? (
                    <span className="text-xs text-slate-400">
                      Skor sementara:{" "}
                      <strong className="font-mono text-emerald-300">
                        {formatNumber(previewScore, 4)}
                      </strong>
                    </span>
                  ) : null}
                  <Badge tone={complete ? "emerald" : "amber"}>
                    {filled}/{topVariables.length}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {topVariables.map((variable) => {
                  const key = `${gpu.id}:${variable.variable_id}`;
                  const current = scores[key];
                  return (
                    <div
                      key={variable.variable_id}
                      className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 sm:flex sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200">
                          <span className="mr-2 font-mono text-xs text-indigo-300">
                            #{variable.rank}
                          </span>
                          {variable.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Bobot {formatNumber(variable.weight, 4)} (
                          {formatNumber(variable.weight * 100, 2)}%)
                        </p>
                      </div>
                      <div className="mt-2.5 flex shrink-0 gap-1.5 sm:mt-0">
                        {GPU_LIKERT_SCALE.map((option) => {
                          const active = current === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              title={option.label}
                              onClick={() => setScore(gpu.id, variable.variable_id, option.value)}
                              className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn-primary" onClick={save} disabled={pending || !dirty}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? "Menyimpan…" : dirty ? "Simpan Assessment" : "Tersimpan"}
        </button>
      </div>
    </div>
  );
}
