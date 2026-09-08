import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-sm text-indigo-300">404</p>
      <h1 className="mt-3 text-2xl font-bold text-white">Halaman tidak ditemukan</h1>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        Halaman yang Anda tuju tidak tersedia atau sudah dipindahkan.
      </p>
      <Link href="/dashboard" className="btn-primary mt-6">
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
