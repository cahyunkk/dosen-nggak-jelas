import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  tone = "default",
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  tone?: "default" | "locked";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center",
        tone === "locked"
          ? "border-amber-800/50 bg-amber-950/10"
          : "border-slate-700/70 bg-slate-900/30",
        className,
      )}
    >
      {icon ? (
        <div
          className={clsx(
            "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border",
            tone === "locked"
              ? "border-amber-800/50 bg-amber-950/30 text-amber-400"
              : "border-slate-700 bg-slate-800/60 text-slate-400",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>
      {action || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action ? (
            <Link href={action.href} className="btn-primary">
              {action.label}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link href={secondaryAction.href} className="btn-secondary">
              {secondaryAction.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
