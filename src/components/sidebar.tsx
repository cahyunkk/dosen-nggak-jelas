"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  BarChart3,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/respondents", label: "Data Responden", icon: ClipboardList, step: "1" },
  { href: "/dashboard/import", label: "Import CSV", icon: Upload, step: "1" },
  { href: "/dashboard/analysis", label: "Analisis & TOP 5", icon: BarChart3, step: "2" },
  { href: "/dashboard/gpus", label: "Kandidat GPU", icon: Cpu, step: "3" },
  { href: "/dashboard/assessment", label: "Assessment GPU", icon: ListChecks, step: "4" },
  { href: "/dashboard/ranking", label: "Ranking & Rekomendasi", icon: Trophy, step: "5" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={clsx(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-500/12 text-white ring-1 ring-indigo-500/30"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100",
            )}
          >
            <item.icon
              className={clsx("h-4 w-4 shrink-0", active ? "text-indigo-300" : "text-slate-500")}
            />
            <span className="truncate">{item.label}</span>
            {item.step ? (
              <span
                className={clsx(
                  "ml-auto rounded-md px-1.5 py-0.5 font-mono text-[10px]",
                  active ? "bg-indigo-500/20 text-indigo-200" : "bg-slate-800 text-slate-500",
                )}
              >
                {item.step}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-3 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
        <Cpu className="h-4 w-4" />
      </span>
      <span className="text-sm leading-tight font-bold text-white">
        GPU Preference
        <span className="block text-[11px] font-medium text-slate-500">Ranking System</span>
      </span>
    </Link>
  );

  const footer = (
    <div className="border-t border-slate-800/80 p-3">
      <div className="mb-2 px-2">
        <p className="truncate text-xs text-slate-500">Login sebagai</p>
        <p className="truncate text-sm font-medium text-slate-300">{email}</p>
      </div>
      <form action={signOutAction}>
        <button type="submit" className="btn-ghost w-full justify-start text-sm">
          <LogOut className="h-4 w-4" /> Keluar
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/85 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-white">
          <Cpu className="h-4 w-4 text-indigo-300" /> GPU Preference Ranking
        </Link>
        <button
          type="button"
          className="btn-ghost p-2"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800/80 bg-slate-950/70 backdrop-blur lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                className="btn-ghost mr-3 p-2"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      ) : null}
    </>
  );
}
