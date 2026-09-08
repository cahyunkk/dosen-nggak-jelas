import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Cpu,
  Database,
  ListOrdered,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { enablePublicSurvey } from "@/lib/supabase/config";

const steps = [
  { icon: ClipboardList, title: "Input / Import Responden", desc: "Data kuesioner Likert 1–5 disimpan ke Supabase." },
  { icon: BarChart3, title: "Analisis 10 Variabel", desc: "Total nilai, jumlah responden, dan rata-rata dihitung real-time." },
  { icon: ListOrdered, title: "Seleksi TOP 5 + Bobot", desc: "Bobot = rata-rata variabel ÷ total rata-rata TOP 5 (Σ = 1)." },
  { icon: Cpu, title: "Kandidat & Assessment GPU", desc: "Admin menilai setiap GPU 1–5 pada tiap variabel TOP 5." },
  { icon: Trophy, title: "Ranking Weighted Average", desc: "Skor GPU = Σ (nilai assessment × bobot variabel)." },
];

export default function LandingPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20">
      <div className="flex flex-col items-start gap-4">
        <span className="badge border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5" /> Next.js · TypeScript · Supabase
        </span>
        <h1 className="text-4xl leading-tight font-bold tracking-tight text-white sm:text-5xl">
          GPU Preference <span className="text-gradient">Ranking System</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-400">
          Sistem pendukung keputusan untuk menganalisis preferensi pengguna dalam memilih GPU
          gaming. Seluruh angka pada dashboard dihitung dari data kuesioner nyata yang tersimpan di
          database — tidak ada data contoh.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/login" className="btn-primary">
            Login Admin <ArrowRight className="h-4 w-4" />
          </Link>
          {enablePublicSurvey ? (
            <Link href="/survey" className="btn-secondary">
              Isi Kuesioner
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="card card-hover p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
                <step.icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-xs text-slate-500">
                TAHAP {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-100">{step.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{step.desc}</p>
          </div>
        ))}
        <div className="card border-dashed p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
              <Database className="h-5 w-5" />
            </span>
          </div>
          <h2 className="mt-4 text-sm font-semibold text-slate-100">Database kosong saat awal</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
            Chart, ranking, dan rekomendasi baru muncul setelah data asli dimasukkan.
          </p>
        </div>
      </div>
    </main>
  );
}
