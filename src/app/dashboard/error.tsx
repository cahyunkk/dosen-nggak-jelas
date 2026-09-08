"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message ?? "Terjadi kesalahan.";
  const looksLikeMissingSchema =
    /relation .* does not exist|schema cache|permission denied|does not exist/i.test(message);

  return (
    <div className="card border-rose-900/50 p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-800/60 bg-rose-950/40 text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">Gagal memuat data</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
          {looksLikeMissingSchema ? (
            <p className="mt-3 rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
              Sepertinya skema database belum dibuat. Jalankan{" "}
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">
                supabase/migrations/0001_init.sql
              </code>{" "}
              di Supabase SQL Editor, lalu muat ulang halaman ini.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={reset} className="btn-primary">
              <RotateCcw className="h-4 w-4" /> Coba Lagi
            </button>
            <Link href="/dashboard" className="btn-secondary">
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
