/**
 * Verifikasi SQL migration TANPA menyentuh database Supabase Anda.
 *
 * Skrip menjalankan supabase/migrations/0001_init.sql pada instance Postgres
 * in-memory (PGlite) yang sepenuhnya bersifat sementara, lalu memeriksa:
 *   1. seluruh tabel & view terbentuk,
 *   2. seluruh tabel data KOSONG setelah migration (tidak ada seed data),
 *   3. constraint skala Likert 1–5, unique, dan cascade delete bekerja,
 *   4. Row Level Security berperilaku benar untuk role anon & authenticated.
 *
 * Baris uji apa pun hanya hidup di memori proses ini dan tidak pernah dikirim
 * ke Supabase. Jalankan dengan: npm run db:verify
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import path from "node:path";

const MIGRATION = path.join(process.cwd(), "supabase", "migrations", "0001_init.sql");

const results = [];
function check(label, passed, detail = "") {
  results.push({ label, passed });
  console.log(`${passed ? "  ✔" : "  ✖"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const db = new PGlite();

// Objek bawaan Supabase yang tidak ada di Postgres polos.
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  end $$;
  grant usage on schema auth to anon, authenticated;
`);

// pgcrypto tidak tersedia di PGlite; gen_random_uuid() sudah built-in sejak PG13.
const sql = readFileSync(MIGRATION, "utf8").replace(
  /create extension if not exists "pgcrypto";/,
  "",
);

console.log("\n1. Menjalankan migration");
await db.exec(sql);
check("migration berjalan tanpa error", true);

console.log("\n2. Struktur database");
const expectedTables = [
  "profiles",
  "variables",
  "respondents",
  "respondent_assessments",
  "variable_analysis",
  "selected_top_variables",
  "gpus",
  "gpu_assessments",
  "ranking_results",
];
const tables = (
  await db.query(
    "select table_name from information_schema.tables where table_schema = 'public'",
  )
).rows.map((row) => row.table_name);
for (const table of expectedTables) check(`tabel ${table} ada`, tables.includes(table));
check("view variable_analysis_live ada", tables.includes("variable_analysis_live"));
check("view likert_distribution_live ada", tables.includes("likert_distribution_live"));

console.log("\n3. Database kosong setelah migration (tanpa seed data)");
// `variables` sengaja berisi 10 definisi instrumen penelitian (master data,
// bukan data hasil pengukuran), sehingga tidak termasuk pemeriksaan ini.
for (const table of expectedTables.filter((table) => table !== "variables")) {
  const { rows } = await db.query(`select count(*)::int as n from public.${table}`);
  check(`${table} kosong`, rows[0].n === 0, `${rows[0].n} baris`);
}
const variableCount = (await db.query("select count(*)::int as n from public.variables")).rows[0].n;
check("10 definisi variabel instrumen tersedia", variableCount === 10, `${variableCount} variabel`);

console.log("\n4. Constraint & integritas");
const ids = Object.fromEntries(
  (await db.query("select code, id from public.variables")).rows.map((row) => [row.code, row.id]),
);
const respondentId = (
  await db.query(
    "insert into public.respondents (name, source) values ('uji-sementara', 'manual') returning id",
  )
).rows[0].id;

await db.query(
  "insert into public.respondent_assessments (respondent_id, variable_id, score) values ($1, $2, 4)",
  [respondentId, ids.harga_gpu],
);
check("insert jawaban valid diterima", true);
check("skor > 5 ditolak", await denied(() =>
  db.query(
    "insert into public.respondent_assessments (respondent_id, variable_id, score) values ($1, $2, 9)",
    [respondentId, ids.performa_gaming],
  ),
));
check("skor duplikat per variabel ditolak", await denied(() =>
  db.query(
    "insert into public.respondent_assessments (respondent_id, variable_id, score) values ($1, $2, 3)",
    [respondentId, ids.harga_gpu],
  ),
));
check("source tidak dikenal ditolak", await denied(() =>
  db.query("insert into public.respondents (name, source) values ('x', 'lainnya')"),
));
check("bobot > 1 ditolak", await denied(() =>
  db.query(
    "insert into public.selected_top_variables (batch_id, variable_id, rank, average_score, weight, respondent_count) values (gen_random_uuid(), $1, 1, 4.5, 1.5, 1)",
    [ids.harga_gpu],
  ),
));

const live = (
  await db.query(
    "select total_score, respondent_count, average_score from public.variable_analysis_live where variable_id = $1",
    [ids.harga_gpu],
  )
).rows[0];
check(
  "view menghitung rata-rata dengan benar",
  Number(live.total_score) === 4 && Number(live.respondent_count) === 1 && Number(live.average_score) === 4,
  `total=${live.total_score} n=${live.respondent_count} avg=${live.average_score}`,
);

await db.query("delete from public.respondents where id = $1", [respondentId]);
const leftovers = (
  await db.query(
    "select count(*)::int as n from public.respondent_assessments where respondent_id = $1",
    [respondentId],
  )
).rows[0].n;
check("hapus responden ikut menghapus jawabannya", leftovers === 0);

console.log("\n5. Row Level Security");
const publicId = crypto.randomUUID();
const manualId = crypto.randomUUID();
await db.query("insert into public.respondents (id, name, source) values ($1, 'admin-input', 'manual')", [
  manualId,
]);

check("anon boleh membaca daftar variabel", await allowed("anon", () =>
  db.query("select count(*) from public.variables"),
));
check("anon boleh mengirim jawaban kuesioner publik", await allowed("anon", () =>
  db.query("insert into public.respondents (id, name, source) values ($1, 'publik', 'public')", [
    publicId,
  ]),
));
check("anon boleh menyimpan nilai untuk responden publik miliknya", await allowed("anon", () =>
  db.query(
    "insert into public.respondent_assessments (respondent_id, variable_id, score) values ($1, $2, 5)",
    [publicId, ids.performa_gaming],
  ),
));
check("anon TIDAK bisa membaca data responden", await denied(() => query("anon", "select * from public.respondents")));
check("anon TIDAK bisa membaca kandidat GPU", await denied(() => query("anon", "select * from public.gpus")));
check("anon TIDAK bisa membuat responden manual", await denied(() =>
  query("anon", "insert into public.respondents (name, source) values ('palsu', 'manual')"),
));
check("anon TIDAK bisa menempel jawaban ke responden admin", await denied(() =>
  query(
    "anon",
    `insert into public.respondent_assessments (respondent_id, variable_id, score) values ('${manualId}', '${ids.harga_gpu}', 5)`,
  ),
));
check("anon TIDAK bisa menulis hasil ranking", await denied(() =>
  query(
    "anon",
    `insert into public.ranking_results (batch_id, gpu_id, final_score, rank) values (gen_random_uuid(), gen_random_uuid(), 4, 1)`,
  ),
));

const adminId = crypto.randomUUID();
await db.query("insert into auth.users (id, email) values ($1, 'admin@lokal.test')", [adminId]);
check("admin (authenticated) punya akses penuh", await allowed("authenticated", async () => {
  await db.exec(`set request.jwt.claim.sub = '${adminId}';`);
  await db.query("insert into public.gpus (name, brand) values ('kandidat-uji', 'brand-uji')");
  await db.query("select * from public.respondents");
  await db.query("select * from public.variable_analysis_live");
  await db.query("select * from public.likert_distribution_live");
}));

await db.close();

const failed = results.filter((result) => !result.passed);
console.log(
  failed.length === 0
    ? `\n✅ Semua ${results.length} pemeriksaan lulus. Migration siap dijalankan di Supabase.\n`
    : `\n❌ ${failed.length} dari ${results.length} pemeriksaan gagal.\n`,
);
process.exit(failed.length === 0 ? 0 : 1);

async function query(role, statement) {
  await db.exec(`set role ${role};`);
  try {
    return await db.query(statement);
  } finally {
    await db.exec("reset role;");
  }
}

async function allowed(role, fn) {
  await db.exec(`set role ${role};`);
  try {
    await fn();
    return true;
  } catch {
    return false;
  } finally {
    await db.exec("reset role; reset request.jwt.claim.sub;");
  }
}

async function denied(fn) {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
}
