"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import type { ActionResult } from "@/lib/types";

/** Tombol untuk memicu server action perhitungan + menampilkan hasilnya. */
export function ActionButton({
  action,
  children,
  className = "btn-primary",
  pendingLabel = "Menghitung…",
  confirmMessage,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<unknown> | null>(null);

  return (
    <div className="space-y-3">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setResult(null);
          startTransition(async () => {
            const response = await action();
            setResult(response);
            if (response.ok) router.refresh();
          });
        }}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? pendingLabel : children}
      </button>
      {result ? (
        <Alert tone={result.ok ? "success" : "error"}>{result.message ?? "Selesai."}</Alert>
      ) : null}
    </div>
  );
}
