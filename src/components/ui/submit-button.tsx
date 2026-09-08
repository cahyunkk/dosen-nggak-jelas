"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingLabel,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={clsx(className)} disabled={pending || disabled}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? (pendingLabel ?? "Memproses…") : children}
    </button>
  );
}
