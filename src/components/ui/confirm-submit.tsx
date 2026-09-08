"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

/** Tombol submit dengan konfirmasi browser (dipakai untuk aksi destruktif). */
export function ConfirmSubmit({
  children,
  message,
  className = "btn-danger btn-sm",
  title,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  title?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      title={title}
      className={className}
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}
