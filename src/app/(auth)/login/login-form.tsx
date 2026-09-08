"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";
import { allowAdminSignup } from "@/lib/supabase/config";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Email atau password salah."
            : signInError.message,
        );
        return;
      }
      router.replace(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-7">
      <h1 className="text-xl font-bold text-white">Login Admin</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Masuk untuk mengelola data responden, GPU, dan hasil analisis.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@email.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {loading ? "Memproses…" : "Masuk"}
        </button>
      </form>

      {allowAdminSignup ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          Belum punya akun admin?{" "}
          <Link href="/register" className="font-medium text-indigo-300 hover:text-indigo-200">
            Daftar di sini
          </Link>
        </p>
      ) : null}
    </div>
  );
}
