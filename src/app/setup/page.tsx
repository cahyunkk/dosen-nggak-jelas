import { readFile } from "node:fs/promises";
import path from "node:path";
import { Database, KeyRound, Rocket, Table2 } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Alert } from "@/components/ui/alert";

export const metadata = { title: "Setup" };

const ENV_TEMPLATE = `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>`;

async function loadMigration(): Promise<string | null> {
  try {
    const file = path.join(process.cwd(), "supabase", "migrations", "0001_init.sql");
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

export default async function SetupPage() {
  const migration = await loadMigration();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-14">
      <span className="badge border border-amber-500/30 bg-amber-500/10 text-amber-300">
        Konfigurasi diperlukan
      </span>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
        Hubungkan aplikasi ke Supabase
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
        Aplikasi belum menemukan kredensial Supabase. Selesaikan tiga langkah di bawah, lalu jalankan
        ulang server. Tidak ada data contoh yang akan dibuat — database Anda tetap kosong sampai
        responden dan GPU dimasukkan sendiri.
      </p>

      <ol className="mt-10 space-y-5">
        <li className="card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
              <Database className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-white">1. Buat project Supabase</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Buka{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-300 underline underline-offset-4"
            >
              supabase.com/dashboard
            </a>{" "}
            → <strong className="text-slate-200">New project</strong>. Catat Project URL dan anon key
            dari menu <strong className="text-slate-200">Project Settings → API</strong>.
          </p>
        </li>

        <li className="card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
              <Table2 className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-white">2. Jalankan SQL migration</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Salin isi <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
              supabase/migrations/0001_init.sql
            </code>{" "}
            ke <strong className="text-slate-200">SQL Editor</strong> Supabase lalu Run. Skrip ini
            membuat 9 tabel, RLS policy, dan 10 definisi variabel penelitian — tanpa seed data.
          </p>
          {migration ? (
            <div className="mt-4">
              <div className="mb-2 flex justify-end">
                <CopyButton value={migration} label="Salin SQL migration" />
              </div>
              <pre className="max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-[11px] leading-relaxed text-slate-400">
                {migration}
              </pre>
            </div>
          ) : (
            <Alert tone="info" className="mt-4">
              File migration ada di repository pada{" "}
              <code className="text-xs">supabase/migrations/0001_init.sql</code>.
            </Alert>
          )}
        </li>

        <li className="card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-300">
              <KeyRound className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-white">3. Isi environment variable</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Buat file <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">.env.local</code>{" "}
            di root project (atau tambahkan Environment Variables di Vercel):
          </p>
          <div className="mt-4">
            <div className="mb-2 flex justify-end">
              <CopyButton value={ENV_TEMPLATE} label="Salin template" />
            </div>
            <pre className="overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs text-slate-300">
              {ENV_TEMPLATE}
            </pre>
          </div>
          <Alert tone="warning" className="mt-4">
            Gunakan <strong>anon / publishable key</strong>, bukan service role key. Seluruh akses
            data sudah dilindungi Row Level Security.
          </Alert>
        </li>
      </ol>

      <div className="card mt-6 flex flex-wrap items-center gap-3 p-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
          <Rocket className="h-4 w-4" />
        </span>
        <p className="text-sm text-slate-300">
          Setelah itu jalankan ulang <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">npm run dev</code>{" "}
          dan buka <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">/register</code> untuk
          membuat akun admin pertama.
        </p>
      </div>
    </main>
  );
}
