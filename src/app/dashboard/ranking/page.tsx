import Link from "next/link";
import { Calculator, ClipboardList, Cpu, Lock, Sparkles, Trophy } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { ActionButton } from "@/components/ui/action-button";
import { GpuRadarChart, RankingChart } from "@/components/charts";
import {
  getActiveRanking,
  getActiveTopVariables,
  getGpuAssessments,
  getGpus,
  getRespondentCount,
} from "@/lib/data";
import { computeRanking } from "@/lib/analysis";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { TOP_N } from "@/lib/constants";
import { computeRankingAction } from "./actions";
import type { RankingBreakdownItem } from "@/lib/types";

export const metadata = { title: "Ranking & Rekomendasi" };

export default async function RankingPage() {
  const [respondentCount, topVariables, gpus, assessments, activeRanking] = await Promise.all([
    getRespondentCount(),
    getActiveTopVariables(),
    getGpus(),
    getGpuAssessments(),
    getActiveRanking(),
  ]);

  const header = (
    <PageHeader
      step="Tahap 5 · Ranking"
      title="Ranking GPU & Rekomendasi"
      description="Skor GPU = Σ (Nilai Assessment × Bobot Variabel). Seluruh angka berasal dari assessment yang benar-benar dimasukkan."
    />
  );

  if (respondentCount === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          tone="locked"
          title="Ranking belum tersedia — belum ada data responden"
          description="Rekomendasi hanya muncul setelah data kuesioner, TOP 5 variabel, kandidat GPU, dan assessment tersedia."
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
          title={`Ranking terkunci — TOP ${TOP_N} belum tersedia`}
          description="Tetapkan TOP 5 variabel beserta bobotnya terlebih dahulu pada halaman analisis."
          action={{ href: "/dashboard/analysis", label: "Buka Analisis" }}
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
          title="Ranking terkunci — belum ada kandidat GPU"
          description="Tambahkan kandidat GPU lalu lakukan assessment sebelum menghitung ranking."
          action={{ href: "/dashboard/gpus/new", label: "Tambah Kandidat GPU" }}
        />
      </>
    );
  }

  const preview = computeRanking(
    gpus.map((gpu) => ({ id: gpu.id, name: gpu.name })),
    assessments.map((row) => ({
      gpu_id: row.gpu_id,
      variable_id: row.variable_id,
      score: row.score,
    })),
    topVariables,
  );

  if (activeRanking.length === 0) {
    return (
      <>
        {header}
        {preview.ranked.length === 0 ? (
          <EmptyState
            icon={<Lock className="h-6 w-6" />}
            tone="locked"
            title="Ranking belum dapat dihitung"
            description={`Belum ada kandidat GPU dengan assessment lengkap pada seluruh ${topVariables.length} variabel TOP ${TOP_N}. Lengkapi penilaian terlebih dahulu.`}
            action={{ href: "/dashboard/assessment", label: "Lakukan Assessment" }}
          />
        ) : (
          <div className="space-y-5">
            <EmptyState
              icon={<Calculator className="h-6 w-6" />}
              title="Ranking belum dihitung"
              description={`${preview.ranked.length} kandidat GPU sudah memiliki assessment lengkap. Jalankan perhitungan Weighted Average untuk menghasilkan ranking dan rekomendasi.`}
            />
            <div className="flex justify-center">
              <ActionButton action={computeRankingAction}>
                <Calculator className="h-4 w-4" /> Hitung Ranking Sekarang
              </ActionButton>
            </div>
          </div>
        )}
        {preview.incomplete.length > 0 ? (
          <Alert tone="warning" className="mt-5" title="Kandidat dengan assessment belum lengkap">
            <ul className="mt-1 list-inside list-disc">
              {preview.incomplete.map((item) => (
                <li key={item.gpu_id}>
                  {item.name} — belum dinilai: {item.missing.join(", ")}
                </li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </>
    );
  }

  const winner = activeRanking[0];
  const winnerBreakdown = (winner.breakdown ?? []) as RankingBreakdownItem[];
  const strongest = [...winnerBreakdown].sort((a, b) => b.contribution - a.contribution)[0];
  const weakest = [...winnerBreakdown].sort((a, b) => a.score - b.score)[0];
  const runnerUp = activeRanking[1];
  const gap = runnerUp ? Number(winner.final_score) - Number(runnerUp.final_score) : null;

  const radarSeries = activeRanking.slice(0, 4).map((item) => ({
    name: item.gpu?.name ?? "GPU",
    values: topVariables.map((variable) => {
      const found = ((item.breakdown ?? []) as RankingBreakdownItem[]).find(
        (entry) => entry.variable_id === variable.variable_id,
      );
      return found?.score ?? 0;
    }),
  }));

  return (
    <>
      {header}

      <Card className="border-emerald-800/40 bg-emerald-950/10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
                Rekomendasi Utama
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                {winner.gpu?.name ?? "(GPU dihapus)"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                Memperoleh skor tertinggi{" "}
                <strong className="font-mono text-emerald-300">
                  {formatNumber(Number(winner.final_score), 4)}
                </strong>{" "}
                dari skala 1–5 berdasarkan {topVariables.length} variabel prioritas hasil kuesioner{" "}
                {formatNumber(respondentCount, 0)} responden.
                {strongest ? (
                  <>
                    {" "}
                    Kontribusi terbesar berasal dari variabel{" "}
                    <strong className="text-slate-100">{strongest.variable_name}</strong> (nilai{" "}
                    {strongest.score} × bobot {formatNumber(strongest.weight, 4)} ={" "}
                    {formatNumber(strongest.contribution, 4)}).
                  </>
                ) : null}
                {weakest && weakest.score <= 3 ? (
                  <>
                    {" "}
                    Aspek terlemahnya adalah{" "}
                    <strong className="text-slate-100">{weakest.variable_name}</strong> dengan nilai{" "}
                    {weakest.score}.
                  </>
                ) : null}
                {gap !== null && runnerUp ? (
                  <>
                    {" "}
                    Selisih dengan peringkat kedua ({runnerUp.gpu?.name}) sebesar{" "}
                    <strong className="font-mono">{formatNumber(gap, 4)}</strong> poin.
                  </>
                ) : null}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {winner.gpu?.price !== null && winner.gpu?.price !== undefined ? (
                  <Badge tone="emerald">Harga {formatCurrency(Number(winner.gpu.price))}</Badge>
                ) : null}
                {winner.gpu?.vram_gb ? <Badge tone="cyan">VRAM {winner.gpu.vram_gb} GB</Badge> : null}
                {winner.gpu?.brand ? <Badge tone="indigo">{winner.gpu.brand}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Dihitung</p>
            <p className="text-sm text-slate-300">{formatDateTime(winner.computed_at)}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" padded={false}>
          <div className="p-5 sm:p-6">
            <CardHeader
              icon={<Trophy className="h-4 w-4" />}
              title="Tabel Ranking GPU"
              description="Rincian kontribusi tiap variabel terhadap skor akhir."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th className="w-16">Rank</th>
                  <th>GPU</th>
                  {topVariables.map((variable) => (
                    <th key={variable.variable_id} className="text-center whitespace-nowrap">
                      {variable.name.length > 14 ? `${variable.name.slice(0, 13)}…` : variable.name}
                      <span className="mt-0.5 block font-mono text-[10px] text-slate-600">
                        w={formatNumber(variable.weight, 3)}
                      </span>
                    </th>
                  ))}
                  <th className="text-right">Skor Akhir</th>
                </tr>
              </thead>
              <tbody>
                {activeRanking.map((item) => {
                  const breakdown = (item.breakdown ?? []) as RankingBreakdownItem[];
                  return (
                    <tr key={item.id}>
                      <td>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                            item.rank === 1
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="font-medium whitespace-nowrap text-slate-100">
                        {item.gpu?.name ?? "(dihapus)"}
                      </td>
                      {topVariables.map((variable) => {
                        const cell = breakdown.find(
                          (entry) => entry.variable_id === variable.variable_id,
                        );
                        return (
                          <td key={variable.variable_id} className="text-center">
                            <span className="font-mono text-slate-200">{cell?.score ?? "—"}</span>
                            {cell ? (
                              <span className="mt-0.5 block font-mono text-[10px] text-slate-500">
                                {formatNumber(cell.contribution, 3)}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                      <td className="text-right font-mono font-bold text-white">
                        {formatNumber(Number(item.final_score), 4)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Perbandingan Skor Akhir" />
            <RankingChart
              data={activeRanking.map((item) => ({
                name: item.gpu?.name ?? "(dihapus)",
                score: Number(Number(item.final_score).toFixed(4)),
              }))}
            />
          </Card>
          {radarSeries.length > 0 ? (
            <Card>
              <CardHeader
                title="Profil Nilai Assessment"
                description="Maksimal 4 GPU peringkat teratas."
              />
              <GpuRadarChart
                variables={topVariables.map((variable) =>
                  variable.name.length > 18 ? `${variable.name.slice(0, 17)}…` : variable.name,
                )}
                series={radarSeries}
              />
            </Card>
          ) : null}
        </div>
      </div>

      {preview.incomplete.length > 0 ? (
        <Alert tone="warning" className="mt-6" title="Kandidat belum masuk ranking">
          <ul className="mt-1 list-inside list-disc">
            {preview.incomplete.map((item) => (
              <li key={item.gpu_id}>
                {item.name} — belum dinilai: {item.missing.join(", ")}
              </li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <div className="mt-6 flex flex-wrap items-start gap-3">
        <ActionButton
          action={computeRankingAction}
          className="btn-secondary"
          confirmMessage="Hitung ulang ranking memakai assessment dan bobot terbaru?"
        >
          <Calculator className="h-4 w-4" /> Hitung Ulang Ranking
        </ActionButton>
        <Link href="/dashboard/assessment" className="btn-secondary">
          Ubah Assessment
        </Link>
      </div>
    </>
  );
}
