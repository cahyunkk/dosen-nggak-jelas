export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True hanya jika kedua environment variable Supabase terisi dan valid. */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0 &&
  /^https?:\/\/.+/.test(SUPABASE_URL);

/** Set NEXT_PUBLIC_ALLOW_ADMIN_SIGNUP=false untuk mematikan halaman registrasi. */
export const allowAdminSignup = process.env.NEXT_PUBLIC_ALLOW_ADMIN_SIGNUP !== "false";

/** Set NEXT_PUBLIC_ENABLE_PUBLIC_SURVEY=false untuk menutup kuesioner publik. */
export const enablePublicSurvey = process.env.NEXT_PUBLIC_ENABLE_PUBLIC_SURVEY !== "false";
