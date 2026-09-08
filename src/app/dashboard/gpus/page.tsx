/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Cpu, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getGpuAssessments, getGpus, getWorkflowState } from "@/lib/data";
import { formatCurrency, formatInteger } from "@/lib/format";
import { deleteGpuAction } from "./actions";

export const metadata = { title: "Kandidat GPU" };

export default async function GpusPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const [gpus, assessments, workflow] = await Promise.all([
    getGpus(),
    getGpuAssessments(),
    getWorkflowState(),
  ]);

  const topIds = new Set(workflow.topVariables.map((item) => item.variable_id));
  const assessedCount = new Map<string, number>();
  for (const row of assessments) {
    if (!topIds.has(row.variable_id)) continue;
    assessedCount.set(row.gpu_id, (assessedCount.get(row.gpu_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        step="Tahap 3 · Kandidat"
        title="Kandidat GPU"
        description="Daftar GPU yang akan dibandingkan. Seluruh kandidat dimasukkan manual oleh admin — tidak ada GPU bawaan."
        action={
          <Link href="/dashboard/gpus/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Tambah GPU
          </Link>
        }
      />

      {params.saved === "created" ? (
        <Alert tone="success" className="mb-5">
          Kandidat GPU berhasil ditambahkan.
        </Alert>
      ) : null}
      {params.saved === "updated" ? (
        <Alert tone="success" className="mb-5">
          Data GPU berhasil diperbarui.
        </Alert>
      ) : null}

      {gpus.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-6 w-6" />}
          title="Belum ada kandidat GPU"
          description="Tambahkan minimal satu kandidat GPU untuk dapat melakukan assessment dan perankingan."
          action={{ href: "/dashboard/gpus/new", label: "Tambah GPU" }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gpus.map((gpu) => {
              const done = assessedCount.get(gpu.id) ?? 0;
              const total = workflow.topVariables.length;
              return (
                <div key={gpu.id} className="card card-hover flex flex-col p-5">
                  <div className="flex items-start gap-4">
                    {gpu.image_url ? (
                      <img
                        src={gpu.image_url}
                        alt={gpu.name}
                        className="h-16 w-16 shrink-0 rounded-xl border border-slate-800 object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/50 text-slate-500">
                        <Cpu className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-white">{gpu.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {[gpu.brand, gpu.series].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-emerald-300">
                        {formatCurrency(gpu.price)}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                      <dt className="text-slate-500">VRAM</dt>
                      <dd className="mt-0.5 font-medium text-slate-200">
                        {gpu.vram_gb === null ? "—" : `${formatInteger(gpu.vram_gb)} GB`}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                      <dt className="text-slate-500">Tahun Rilis</dt>
                      <dd className="mt-0.5 font-medium text-slate-200">
                        {gpu.release_year ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {gpu.description ? (
                    <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-400">
                      {gpu.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-800 pt-4">
                    {total === 0 ? (
                      <Badge tone="slate">TOP 5 belum ada</Badge>
                    ) : done === total ? (
                      <Badge tone="emerald">Assessment lengkap</Badge>
                    ) : (
                      <Badge tone="amber">
                        Assessment {done}/{total}
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/gpus/${gpu.id}`} className="btn-secondary btn-sm">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                      <form action={deleteGpuAction}>
                        <input type="hidden" name="id" value={gpu.id} />
                        <ConfirmSubmit
                          message={`Hapus kandidat "${gpu.name}" beserta assessment dan hasil rankingnya?`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {workflow.hasTopVariables ? (
              <Link href="/dashboard/assessment" className="btn-primary">
                <ListChecks className="h-4 w-4" /> Lanjut: Assessment GPU
              </Link>
            ) : (
              <Alert tone="warning" className="w-full">
                Assessment belum dapat dimulai karena TOP 5 variabel belum ditetapkan. Selesaikan{" "}
                <Link href="/dashboard/analysis" className="underline underline-offset-4">
                  analisis kuesioner
                </Link>{" "}
                terlebih dahulu.
              </Alert>
            )}
          </div>
        </>
      )}
    </>
  );
}
