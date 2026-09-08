import Link from "next/link";
import { BarChart3, Calculator, ClipboardList, Crown, Sigma, Users } from "lucide-react";
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/ui/stat-card";
import { ActionButton } from "@/components/ui/action-button";
import {
  LikertDistributionChart,
  VariableAverageChart,
  WeightPieChart,
} from "@/components/charts";
import { getActiveTopVariables, getLikertDistribution, getLiveAnalysis } from "@/lib/data";
import { selectTopVariables } from "@/lib/analysis";
import { formatDateTime, formatInteger, formatNumber } from "@/lib/format";
import { LIKERT_SCALE, TOP_N } from "@/lib/constants";
import { computeTopVariablesAction } from "./actions";

export const metadata = { title: "Analisis & TOP 5" };

export default async function AnalysisPage() {
  const [{ stats, respondentCount, answeredCount }, savedTop, distribution] = await Promise.all([
    getLiveAnalysis(),
    getActiveTopVariables(),
    getLikertDistribution(),
  ]);

  if (respondentCount === 0) {
    return (
      <>
        <PageHeader
          step="Tahap 2 · Analisis"
          title="Analisis Variabel & Seleksi TOP 5"
          description="Rata-rata setiap variabel dihitung langsung dari jawaban responden yang tersimpan."
        />
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title="Belum ada data responden"
          description="Tambahkan data responden secara manual atau import hasil kuesioner untuk memulai analisis. Rata-rata variabel, TOP 5, dan bobot belum dapat dihitung."
          action={{ href: "/dashboard/respondents/new", label: "Tambah Responden" }}
          secondaryAction={{ href: "/dashboard/import", label: "Import CSV" }}
        />
      </>
    );
  }

  const liveTop = selectTopVariables(stats, TOP_N);
  const savedIds = savedTop.map((item) => item.variable_id).join("|");
  const liveIds = liveTop.map((item) => item.variable_id).join("|");
  const savedAverages = savedTop.map((item) => item.average.toFixed(4)).join("|");
  const liveAverages = liveTop.map((item) => item.average.toFixed(4)).join("|");
  const isStale = savedTop.length > 0 && (savedIds !== liveIds || savedAverages !== liveAverages);

  const topIds = new Set(liveTop.map((item) => item.variable_id));
  const highest = stats[0];
  const totalWeight = savedTop.reduce((acc, item) => acc + item.weight, 0);

  return (
    <>
      <PageHeader
        step="Tahap 2 · Analisis"
        title="Analisis Variabel & Seleksi TOP 5"
        description="Rata-rata Variabel = Total Nilai Seluruh Responden ÷ Jumlah Responden."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Responden"
          value={formatInteger(respondentCount)}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Total Jawaban Likert"
          value={formatInteger(answeredCount)}
          icon={<Sigma className="h-4 w-4" />}
          accent="cyan"
        />
        <StatCard
          label="Rata-rata Tertinggi"
          value={highest ? formatNumber(highest.average, 3) : null}
          hint={highest?.name}
          icon={<Crown className="h-4 w-4" />}
          accent="amber"
        />
        <StatCard
          label="Status TOP 5"
          value={savedTop.length > 0 ? `${savedTop.length} variabel aktif` : null}
          emptyLabel="Belum ditetapkan"
          hint={savedTop[0] ? `Ditetapkan ${formatDateTime(savedTop[0].selected_at)}` : undefined}
          icon={<Crown className="h-4 w-4" />}
          accent="emerald"
        />
      </div>

      <Card className="mt-6" padded={false}>
        <div className="p-5 sm:p-6">
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Hasil Analisis 10 Variabel"
            description={`Diurutkan dari rata-rata tertinggi. Dihitung real-time dari ${respondentCount} responden.`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th className="w-20">Ranking</th>
                <th>Variabel</th>
                <th className="text-right">Total Nilai</th>
                <th className="text-right">Jumlah Responden</th>
                <th className="text-right">Rata-rata</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.variable_id}>
                  <td>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                        stat.rank <= TOP_N
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {stat.rank}
                    </span>
                  </td>
                  <td className="font-medium text-slate-100">{stat.name}</td>
                  <td className="text-right font-mono">
                    {stat.respondentCount > 0 ? formatInteger(stat.total) : "—"}
                  </td>
                  <td className="text-right font-mono">{formatInteger(stat.respondentCount)}</td>
                  <td className="text-right font-mono font-semibold text-white">
                    {stat.respondentCount > 0 ? formatNumber(stat.average, 3) : "—"}
                  </td>
                  <td className="text-center">
                    {stat.respondentCount === 0 ? (
                      <Badge tone="slate">Belum ada jawaban</Badge>
                    ) : topIds.has(stat.variable_id) ? (
                      <Badge tone="indigo">TOP {TOP_N}</Badge>
                    ) : (
                      <Badge tone="slate">—</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader
            icon={<BarChart3 className="h-4 w-4" />}
            title="Rata-rata per Variabel"
            description="Batang berwarna indigo menandai kandidat TOP 5."
          />
          <VariableAverageChart
            data={stats
              .filter((stat) => stat.respondentCount > 0)
              .map((stat) => ({
                name: stat.name,
                average: Number(stat.average.toFixed(3)),
                isTop: topIds.has(stat.variable_id),
              }))}
          />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<Sigma className="h-4 w-4" />}
            title="Distribusi Jawaban Likert"
            description="Sebaran seluruh jawaban 1–5 dari responden."
          />
          {distribution.length === 0 ? (
            <EmptyState title="Belum ada jawaban" description="Distribusi muncul setelah ada jawaban responden." />
          ) : (
            <LikertDistributionChart
              data={LIKERT_SCALE.map((option) => ({
                label: `${option.value} · ${option.short}`,
                jumlah: distribution.find((item) => item.score === option.value)?.total ?? 0,
              }))}
            />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          icon={<Crown className="h-4 w-4" />}
          title={`TOP ${TOP_N} Variabel & Bobot`}
          description="Bobot = Rata-rata Variabel ÷ Total Rata-rata Seluruh TOP 5. Total bobot selalu 1."
        />

        {savedTop.length === 0 ? (
          <div className="space-y-5">
            <EmptyState
              icon={<Calculator className="h-6 w-6" />}
              tone="locked"
              title={`TOP ${TOP_N} belum ditetapkan`}
              description={`Data ${respondentCount} responden sudah tersedia. Jalankan perhitungan untuk menetapkan ${TOP_N} variabel dengan rata-rata tertinggi beserta bobotnya. Hasil disimpan sebagai snapshot di database.`}
            />
            <div className="flex justify-center">
              <ActionButton action={computeTopVariablesAction}>
                <Calculator className="h-4 w-4" /> Hitung & Tetapkan TOP {TOP_N}
              </ActionButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {isStale ? (
              <Alert tone="warning" title="Data responden berubah sejak TOP 5 ditetapkan">
                Rata-rata terbaru berbeda dengan snapshot yang tersimpan. Jalankan ulang perhitungan
                agar bobot dan ranking memakai data terkini.
              </Alert>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="overflow-x-auto">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th className="w-16">Rank</th>
                        <th>Variabel</th>
                        <th className="text-right">Rata-rata</th>
                        <th className="text-right">Bobot</th>
                        <th className="text-right">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedTop.map((item) => (
                        <tr key={item.variable_id}>
                          <td>
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">
                              {item.rank}
                            </span>
                          </td>
                          <td className="font-medium text-slate-100">{item.name}</td>
                          <td className="text-right font-mono">{formatNumber(item.average, 3)}</td>
                          <td className="text-right font-mono text-white">
                            {formatNumber(item.weight, 4)}
                          </td>
                          <td className="text-right font-mono text-slate-400">
                            {formatNumber(item.weight * 100, 2)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-800/30">
                        <td colSpan={3} className="font-semibold text-slate-200">
                          Total Bobot
                        </td>
                        <td className="text-right font-mono font-bold text-emerald-300">
                          {formatNumber(totalWeight, 4)}
                        </td>
                        <td className="text-right font-mono font-bold text-emerald-300">
                          {formatNumber(totalWeight * 100, 2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Snapshot ditetapkan {formatDateTime(savedTop[0].selected_at)} berdasarkan{" "}
                  {formatInteger(savedTop[0].respondentCount)} jawaban per variabel.
                </p>
              </div>
              <div className="lg:col-span-2">
                <WeightPieChart
                  data={savedTop.map((item) => ({ name: item.name, weight: item.weight }))}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3 border-t border-slate-800 pt-5">
              <ActionButton
                action={computeTopVariablesAction}
                className={isStale ? "btn-primary" : "btn-secondary"}
                confirmMessage="Hitung ulang TOP 5? Snapshot lama dinonaktifkan dan hasil ranking yang aktif akan direset."
              >
                <Calculator className="h-4 w-4" /> Hitung Ulang TOP {TOP_N}
              </ActionButton>
              <Link href="/dashboard/gpus" className="btn-secondary">
                Lanjut: Kandidat GPU
              </Link>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
