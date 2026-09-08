import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return <div className={clsx("card", padded && "p-5 sm:p-6", className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-indigo-300">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  step,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  step?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {step ? (
          <span className="mb-2 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-indigo-300 uppercase">
            {step}
          </span>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "indigo" | "emerald" | "amber" | "rose" | "cyan";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-800/80 text-slate-300 border border-slate-700",
    indigo: "bg-indigo-500/10 text-indigo-300 border border-indigo-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border border-amber-500/30",
    rose: "bg-rose-500/10 text-rose-300 border border-rose-500/30",
    cyan: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30",
  };
  return <span className={clsx("badge", tones[tone], className)}>{children}</span>;
}
