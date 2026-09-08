import Link from "next/link";
import { ClipboardList, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { PageHeader, Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { getRespondents, getVariables } from "@/lib/data";
import { formatDateTime, formatNumber } from "@/lib/format";
import { deleteRespondentAction } from "./actions";

export const metadata = { title: "Data Responden" };

const PAGE_SIZE = 25;

const SOURCE_LABEL: Record<string, { label: string; tone: "indigo" | "cyan" | "emerald" }> = {
  manual: { label: "Input manual", tone: "indigo" },
  csv: { label: "Import CSV", tone: "cyan" },
  public: { label: "Kuesioner publik", tone: "emerald" },
};

export default async function RespondentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const search = params.q ?? "";

  const [{ rows, total }, variables] = await Promise.all([
    getRespondents(page, PAGE_SIZE, search),
    getVariables(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        step="Tahap 1 · Pengambilan Data"
        title="Data Responden"
        description="Seluruh jawaban Skala Likert 1–5 dari responden nyata. Tidak ada data contoh yang dibuat sistem."
        action={
          <>
            <Link href="/dashboard/import" className="btn-secondary">
              <Upload className="h-4 w-4" /> Import CSV
            </Link>
            <Link href="/dashboard/respondents/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Tambah Responden
            </Link>
          </>
        }
      />

      {params.saved === "created" ? (
        <Alert tone="success" className="mb-5">
          Responden baru berhasil disimpan ke database.
        </Alert>
      ) : null}
      {params.saved === "updated" ? (
        <Alert tone="success" className="mb-5">
          Perubahan data responden berhasil disimpan.
        </Alert>
      ) : null}
      {params.saved === "imported" ? (
        <Alert tone="success" className="mb-5">
          Data hasil import CSV berhasil disimpan.
        </Alert>
      ) : null}

      {total === 0 && search.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Belum ada data responden"
          description="Tambahkan data responden secara manual atau import hasil kuesioner untuk memulai analisis."
          action={{ href: "/dashboard/respondents/new", label: "Tambah Responden" }}
          secondaryAction={{ href: "/dashboard/import", label: "Import CSV" }}
        />
      ) : (
        <div className="card" >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 p-4">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-100">{total}</span> responden tersimpan
            </p>
            <form className="relative" action="/dashboard/respondents">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Cari nama / ID responden…"
                className="input w-64 pl-9"
              />
            </form>
          </div>

          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Tidak ada hasil"
                description={`Tidak ditemukan responden dengan kata kunci "${search}".`}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Responden</th>
                    <th>Usia</th>
                    <th>Sumber</th>
                    <th className="text-center">Jawaban</th>
                    <th className="text-right">Rata-rata</th>
                    <th>Dibuat</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const answers = row.respondent_assessments ?? [];
                    const totalScore = answers.reduce((acc, item) => acc + item.score, 0);
                    const average = answers.length > 0 ? totalScore / answers.length : null;
                    const complete = answers.length === variables.length;
                    const source = SOURCE_LABEL[row.source] ?? SOURCE_LABEL.manual;
                    return (
                      <tr key={row.id}>
                        <td>
                          <p className="font-medium text-slate-100">{row.name}</p>
                          {row.gaming_experience || row.gpu_knowledge ? (
                            <p className="mt-0.5 text-xs text-slate-500">
                              {[row.gaming_experience, row.gpu_knowledge]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          ) : null}
                        </td>
                        <td>{row.age ?? "—"}</td>
                        <td>
                          <Badge tone={source.tone}>{source.label}</Badge>
                        </td>
                        <td className="text-center">
                          <Badge tone={complete ? "emerald" : "amber"}>
                            {answers.length}/{variables.length}
                          </Badge>
                        </td>
                        <td className="text-right font-mono text-slate-200">
                          {average === null ? "—" : formatNumber(average, 2)}
                        </td>
                        <td className="text-xs text-slate-500">{formatDateTime(row.created_at)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/respondents/${row.id}`}
                              className="btn-secondary btn-sm"
                              title="Edit responden"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <form action={deleteRespondentAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <ConfirmSubmit
                                message={`Hapus responden "${row.name}" beserta seluruh jawabannya? Tindakan ini tidak dapat dibatalkan.`}
                                title="Hapus responden"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 p-4 text-sm">
              <p className="text-slate-500">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/dashboard/respondents?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className={`btn-secondary btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
                >
                  Sebelumnya
                </Link>
                <Link
                  href={`/dashboard/respondents?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
                  className={`btn-secondary btn-sm ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
                >
                  Berikutnya
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
