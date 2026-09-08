"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/alert";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }
      setInfo(
        "Akun dibuat. Cek email untuk konfirmasi, atau matikan email confirmation di Supabase → Authentication → Providers → Email.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-7">
      <h1 className="text-xl font-bold text-white">Daftar Admin</h1>
      <p className="mt-1.5 text-sm text-slate-400">
        Buat akun admin untuk mengelola sistem analisis preferensi GPU.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? <Alert tone="error">{error}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <div>
          <label className="label" htmlFor="fullName">
            Nama Lengkap
          </label>
          <input
            id="fullName"
            className="input"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nama admin"
          />
        </div>
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
            autoComplete="new-password"
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "Memproses…" : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
          Login
        </Link>
      </p>
    </div>
  );
}
