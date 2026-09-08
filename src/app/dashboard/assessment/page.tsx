import Link from "next/link";
import { ClipboardList, Cpu, Lock, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { getActiveTopVariables, getGpuAssessments, getGpus, getRespondentCount } from "@/lib/data";
import { TOP_N } from "@/lib/constants";
import { AssessmentMatrix } from "./assessment-matrix";

export const metadata = { title: "Assessment GPU" };

export default async function AssessmentPage() {
  const [respondentCount, topVariables, gpus, assessments] = await Promise.all([
    getRespondentCount(),
    getActiveTopVariables(),
    getGpus(),
    getGpuAssessments(),
  ]);

  const header = (
    <PageHeader
      step="Tahap 4 · Assessment"
      title="Assessment GPU"
      description={`Beri nilai 1–5 untuk setiap kandidat GPU pada masing-masing variabel TOP ${TOP_N}. Tidak ada nilai otomatis — seluruh penilaian diisi admin.`}
    />
  );

  if (respondentCount === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          tone="locked"
          title="Assessment terkunci — belum ada data responden"
          description="Assessment hanya dapat dimulai setelah data responden tersedia dan TOP 5 variabel berhasil dihitung."
          action={{ href: "/dashboard/respondents/new", label: "Tambah Responden" }}
          secondaryAction={{ href: "/dashboard/import", label: "Import CSV" }}
        />
      </>
    );
  }

  if (topVariables.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          tone="locked"
          title={`Assessment terkunci — TOP ${TOP_N} belum tersedia`}
          description={`Data responden sudah ada, tetapi TOP ${TOP_N} variabel belum ditetapkan. Jalankan perhitungan analisis terlebih dahulu.`}
          action={{ href: "/dashboard/analysis", label: "Buka Analisis & Hitung TOP 5" }}
        />
      </>
    );
  }

  if (gpus.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<Cpu className="h-6 w-6" />}
          tone="locked"
          title="Assessment terkunci — belum ada kandidat GPU"
          description="Tambahkan minimal satu kandidat GPU agar penilaian dapat dilakukan."
          action={{ href: "/dashboard/gpus/new", label: "Tambah Kandidat GPU" }}
        />
      </>
    );
  }

  const topIds = new Set(topVariables.map((item) => item.variable_id));
  const initialScores: Record<string, number> = {};
  for (const row of assessments) {
    if (!topIds.has(row.variable_id)) continue;
    initialScores[`${row.gpu_id}:${row.variable_id}`] = row.score;
  }

  const completeGpus = gpus.filter((gpu) =>
    topVariables.every((variable) => initialScores[`${gpu.id}:${variable.variable_id}`] !== undefined),
  ).length;

  return (
    <>
      {header}
      <Alert tone="info" className="mb-5" title="Variabel penilaian mengikuti hasil analisis">
        Sistem otomatis memakai {topVariables.length} variabel dengan rata-rata tertinggi beserta
        bobotnya. Mengubah nilai di sini akan menonaktifkan hasil ranking yang tersimpan sampai
        Anda menghitung ulang.
      </Alert>

      <AssessmentMatrix
        gpus={gpus}
        topVariables={topVariables.map((item) => ({
          variable_id: item.variable_id,
          name: item.name,
          rank: item.rank,
          weight: item.weight,
        }))}
        initialScores={initialScores}
      />

      {completeGpus > 0 ? (
        <div className="mt-6">
          <Link href="/dashboard/ranking" className="btn-secondary">
            <Trophy className="h-4 w-4" /> Lanjut: Hitung Ranking ({completeGpus} GPU siap)
          </Link>
        </div>
      ) : null}
    </>
  );
}
