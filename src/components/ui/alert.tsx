import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import clsx from "clsx";

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const config = {
    info: { cls: "border-sky-800/60 bg-sky-950/30 text-sky-200", Icon: Info },
    success: { cls: "border-emerald-800/60 bg-emerald-950/25 text-emerald-200", Icon: CheckCircle2 },
    warning: { cls: "border-amber-800/60 bg-amber-950/25 text-amber-200", Icon: AlertTriangle },
    error: { cls: "border-rose-800/60 bg-rose-950/25 text-rose-200", Icon: XCircle },
  }[tone];

  const { Icon } = config;

  return (
    <div className={clsx("flex gap-3 rounded-xl border px-4 py-3 text-sm", config.cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={clsx(title && "mt-1", "leading-relaxed")}>{children}</div> : null}
      </div>
    </div>
  );
}
