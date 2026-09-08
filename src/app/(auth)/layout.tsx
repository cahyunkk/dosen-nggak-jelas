import type { ReactNode } from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
          <Cpu className="h-5 w-5" />
        </span>
        <span className="text-lg font-bold tracking-tight text-white">
          GPU Preference <span className="text-gradient">Ranking</span>
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
