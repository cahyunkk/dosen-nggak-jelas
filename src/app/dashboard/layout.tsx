import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Dashboard selalu dirender dinamis: seluruh data dibaca dari Supabase per request. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) redirect("/setup");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <Sidebar email={user.email ?? "admin"} />
      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
