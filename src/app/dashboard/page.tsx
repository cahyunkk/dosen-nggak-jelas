import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Circle,
  ClipboardList,
  Cpu,
  Crown,
  ListChecks,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { Card, CardHeader, PageHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { RankingChart, VariableAverageChart } from "@/components/charts";
import { getActiveRanking, getLiveAnalysis, getWorkflowState } from "@/lib/data";
import { formatInteger, formatNumber } from "@/lib/format";
import { TOP_N } from "@/lib/constants";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [workflow, analysis, ranking] = await Promise.all([
    getWorkflowState(),
    getLiveAnalysis(),
    getActiveRanking(),
  ]);

  const topVariable = workflow.topVariables[0] ?? null;
  const winner = ranking[0] ?? null;
  const hasAnyData = workflow.respondentCount > 0 || workflow.gpuCount > 0;

  const steps = [
    {
      label: "Data responden tersedia",
      done: workflow.respondentCount > 0,
      href: "/dashboard/respondents",
      detail:
        workflow.respondentCount > 0
          ? `${formatInteger(workflow.respondentCount)} responden tersimpan`
          : "Belum ada data responden",
    },
    {
      label: `TOP ${TOP_N} variabel ditetapkan`,
      done: workflow.hasTopVariables,
      href: "/dashboard/analysis",
      detail: workflow.hasTopVariables
        ? `${workflow.topVariables.length} variabel aktif dengan total bobot 1`
        : "Belum tersedia — jalankan analisis",
    },
    {
      label: "Kandidat GPU dimasukkan",
      done: workflow.gpuCount > 0,
      href: "/dashboard/gpus",
      detail:
        workflow.gpuCount > 0
          ? `${formatInteger(workflow.gpuCount)} kandidat GPU`
          : "Belum ada kandidat GPU",
    },
    {
      label: "Assessment GPU lengkap",
      done: workflow.assessedGpuCount > 0,
      href: "/dashboard/assessment",
      detail: workflow.canAssess
        ? workflow.assessedGpuCount > 0
          ? `${workflow.assessedGpuCount} dari ${workflow.gpuCount} GPU dinilai lengkap`
          : "Belum ada GPU yang dinilai lengkap"
        : "Terkunci sampai responden, TOP 5, dan GPU tersedia",
    },
    {
      label: "Ranking dihitung",
      done: workflow.rankingCount > 0,
      href: "/dashboard/ranking",
      detail:
        workflow.rankingCount > 0
          ? `${workflow.rankingCount} GPU masuk ranking aktif`
          : "Belum tersedia",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan status penelitian. Seluruh angka dihitung dari data nyata yang tersimpan di database."
        action={
          <>
            <Link href="/dashboard/import" className="btn-secondary">
              <Upload className="h-4 w-4" /> Import CSV
            </Link>
            <Link href="/dashboard/respondents/new" className="btn-primary">
              <Users className="h-4 w-4" /> Tambah Responden
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Responden"
          value={workflow.respondentCount > 0 ? formatInteger(workflow.respondentCount) : null}
          hint="Data kuesioner tersimpan"
          icon={<Users className="h-4 w-4" />}
          href="/dashboard/respondents"
        />
        <StatCard
          label="TOP Variabel"
          value={topVariable ? topVariable.name : null}
          emptyLabel="Belum tersedia"
          hint={topVariable ? `Rata-rata ${formatNumber(topVariable.average, 3)}` : undefined}
          icon={<Crown className="h-4 w-4" />}
          accent="amber"
          href="/dashboard/analysis"
        />
        <StatCard
          label="Kandidat GPU"
          value={workflow.gpuCount > 0 ? formatInteger(workflow.gpuCount) : null}
          hint={`${workflow.assessedGpuCount} sudah dinilai lengkap`}
          icon={<Cpu className="h-4 w-4" />}
          accent="cyan"
          href="/dashboard/gpus"
        />
        <StatCard
          label="Ranking #1"
          value={winner?.gpu?.name ?? null}
          emptyLabel="Belum tersedia"
          hint={winner ? `Skor ${formatNumber(Number(winner.final_score), 4)}` : undefined}
          icon={<Trophy className="h-4 w-4" />}
          accent="emerald"
          href="/dashboard/ranking"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<ListChecks className="h-4 w-4" />}
            title="Alur Penelitian"
            description="Setiap tahap terbuka setelah tahap sebelumnya memiliki data."
          />
          <ol className="space-y-2">
            {steps.map((step, index) => (
              <li key={step.label}>
                <Link
                  href={step.href}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900/60"
                >
                  {step.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">
                      <span className="mr-1.5 font-mono text-xs text-slate-500">{index + 1}.</span>
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
                  </div>
                  <ArrowRight className="mt-1 ml-auto h-3.5 w-3.5 shrink-0 text-slate-600" />
                </Link>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Rata-rata Variabel"
            description="Dihitung real-time dari jawaban responden."
          />
          {workflow.respondentCount === 0 ? (
            <EmptyState
              icon={<ClipboardList className="h-6 w-6" />}
              title="Belum ada data responden"
              description="Tambahkan data responden secara manual atau import hasil kuesioner untuk memulai analisis."
              action={{ href: "/dashboard/respondents/new", label: "Tambah Responden" }}
              secondaryAction={{ href: "/dashboard/import", label: "Import CSV" }}
            />
          ) : (
            <VariableAverageChart
              data={analysis.stats
                .filter((stat) => stat.respondentCount > 0)
                .map((stat) => ({
                  name: stat.name,
                  average: Number(stat.average.toFixed(3)),
                  isTop: stat.rank <= TOP_N,
                }))}
            />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          icon={<Trophy className="h-4 w-4" />}
          title="Hasil Ranking GPU"
          description="Weighted Average dari assessment yang tersimpan."
        />
        {ranking.length === 0 ? (
          <EmptyState
            icon={<Trophy className="h-6 w-6" />}
            tone="locked"
            title="Ranking belum tersedia"
            description={
              hasAnyData
                ? "Lengkapi tahap analisis, kandidat GPU, dan assessment agar ranking beserta rekomendasi dapat dihitung."
                : "Ranking baru dapat dihitung setelah data responden, TOP 5 variabel, kandidat GPU, dan assessment tersedia."
            }
            action={{ href: "/dashboard/ranking", label: "Buka Halaman Ranking" }}
          />
        ) : (
          <RankingChart
            data={ranking.map((item) => ({
              name: item.gpu?.name ?? "(dihapus)",
              score: Number(Number(item.final_score).toFixed(4)),
            }))}
          />
        )}
      </Card>
    </>
  );
}
