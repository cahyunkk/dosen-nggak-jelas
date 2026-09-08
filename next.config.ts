import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Halaman /setup menampilkan isi SQL migration, sertakan file-nya saat build.
  outputFileTracingIncludes: {
    "/setup": ["./supabase/migrations/**"],
  },
  // Izinkan origin preview (sandbox / tunnel) saat mode development.
  allowedDevOrigins: ["*.e2b.app", "*.vercel.app", "localhost"],
};

export default nextConfig;
