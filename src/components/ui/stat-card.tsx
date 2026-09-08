import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

/**
 * Kartu statistik. `value` HANYA diisi jika data nyata tersedia.
 * Jika `value` null, kartu menampilkan status "Belum ada data".
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  emptyLabel = "Belum ada data",
  href,
  accent = "indigo",
}: {
  label: string;
  value: string | null;
  hint?: string;
  icon?: ReactNode;
  emptyLabel?: string;
  href?: string;
  accent?: "indigo" | "cyan" | "emerald" | "amber";
}) {
  const accents: Record<string, string> = {
    indigo: "text-indigo-300 border-indigo-500/25 bg-indigo-500/10",
    cyan: "text-cyan-300 border-cyan-500/25 bg-cyan-500/10",
    emerald: "text-emerald-300 border-emerald-500/25 bg-emerald-500/10",
    amber: "text-amber-300 border-amber-500/25 bg-amber-500/10",
  };
  const isEmpty = value === null;

  const body = (
    <div className={clsx("card card-hover h-full p-5", href && "cursor-pointer")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {icon ? (
          <span
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              accents[accent],
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p
        className={clsx(
          "mt-3 font-bold tracking-tight",
          isEmpty ? "text-base text-slate-500 italic" : "text-2xl text-white",
        )}
      >
        {isEmpty ? emptyLabel : value}
      </p>
      {hint && !isEmpty ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
