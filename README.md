# GPU Preference Ranking System

Aplikasi web full-stack untuk **analisis preferensi pengguna dalam pemilihan GPU gaming**
berbasis kuesioner Skala Likert, seleksi TOP 5 variabel, dan perankingan kandidat GPU
dengan metode **Weighted Average**.

> **Tanpa dummy data.** Database kosong saat pertama kali dijalankan. Tidak ada responden,
> nilai Likert, GPU, assessment, ranking, chart, maupun rekomendasi contoh di mana pun dalam
> aplikasi. Seluruh angka berasal dari data nyata yang Anda masukkan atau import.

---

## Stack

| Bagian     | Teknologi                                         |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router) + React 19                |
| Bahasa     | TypeScript (strict)                               |
| Styling    | Tailwind CSS v4 — dashboard dark mode, responsive |
| Database   | Supabase PostgreSQL + Row Level Security          |
| Auth       | Supabase Authentication (admin)                   |
| Chart      | Recharts 3                                        |
| CSV        | PapaParse                                         |
| Deployment | Vercel                                            |

---

## Alur sistem

```
INPUT DATA RESPONDEN  (manual / import CSV / kuesioner publik)
        ↓
DATA DISIMPAN KE SUPABASE
        ↓
ANALISIS 10 VARIABEL      → rata-rata = total nilai ÷ jumlah responden
        ↓
SELEKSI TOP 5 VARIABEL    → bobot = rata-rata ÷ total rata-rata TOP 5 (Σ bobot = 1)
        ↓
INPUT KANDIDAT GPU        → manual, tidak ada GPU bawaan
        ↓
ASSESSMENT GPU            → nilai 1–5 per GPU untuk tiap variabel TOP 5
        ↓
PERHITUNGAN SKOR          → skor GPU = Σ (nilai assessment × bobot variabel)
        ↓
RANKING + CHART + REKOMENDASI
```

Setiap tahap **terkunci** sampai prasyaratnya terpenuhi:

- TOP 5 tidak dapat dihitung sebelum ada data responden.
- Assessment tidak dapat dimulai sebelum ada responden, TOP 5, dan minimal satu kandidat GPU.
- Ranking dan rekomendasi tidak muncul sebelum ada assessment lengkap.
- Semua halaman menampilkan **empty state** informatif saat datanya belum ada.

---

## Setup

### 1. Buat project Supabase

Buka [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
Catat `Project URL` dan `anon public key` dari **Project Settings → API**.

### 2. Jalankan migration

Salin seluruh isi [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) ke
**SQL Editor** Supabase lalu **Run** (atau `supabase db push` bila memakai Supabase CLI).

Migration membuat:

- 9 tabel: `profiles`, `respondents`, `respondent_assessments`, `variables`,
  `variable_analysis`, `selected_top_variables`, `gpus`, `gpu_assessments`, `ranking_results`
  (UUID primary key, foreign key, `created_at`, `updated_at` + trigger),
- 2 view agregasi real-time (`variable_analysis_live`, `likert_distribution_live`),
- Row Level Security + policy untuk role `anon` dan `authenticated`,
- trigger pembuatan `profiles` otomatis saat admin mendaftar,
- 10 **definisi variabel penelitian** (master data instrumen kuesioner).

Migration **tidak** memasukkan seed/sample data apa pun — seluruh tabel data tetap kosong.

### 3. Environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
# opsional
NEXT_PUBLIC_ALLOW_ADMIN_SIGNUP=true      # false → tutup halaman /register
NEXT_PUBLIC_ENABLE_PUBLIC_SURVEY=true    # false → tutup halaman /survey
```

Hanya **anon key** yang dipakai; tidak ada service role key di aplikasi karena seluruh
akses data dijaga RLS.

### 4. Jalankan

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Jika env belum diisi, aplikasi mengarahkan ke halaman
`/setup` yang berisi panduan lengkap + SQL migration siap salin.

Buat akun admin pertama di `/register` (matikan *Confirm email* di Supabase →
Authentication → Providers → Email bila ingin langsung login).

---

## Halaman

| Rute                        | Fungsi                                                                     |
| --------------------------- | -------------------------------------------------------------------------- |
| `/`                         | Landing page publik                                                        |
| `/survey`                   | Kuesioner publik (responden mengisi sendiri, tersimpan sebagai `public`)   |
| `/login`, `/register`       | Autentikasi admin                                                          |
| `/setup`                    | Panduan konfigurasi bila env Supabase belum tersedia                       |
| `/dashboard`                | Ringkasan status + empty state seluruh tahap                               |
| `/dashboard/respondents`    | Daftar, cari, tambah, edit, hapus responden                                |
| `/dashboard/import`         | Import CSV: drag & drop, validasi, mapping kolom, preview, konfirmasi      |
| `/dashboard/analysis`       | Tabel analisis 10 variabel, chart, penetapan TOP 5 + bobot                 |
| `/dashboard/gpus`           | CRUD kandidat GPU                                                          |
| `/dashboard/assessment`     | Matriks penilaian GPU × variabel TOP 5                                     |
| `/dashboard/ranking`        | Ranking Weighted Average, breakdown skor, chart, rekomendasi               |

### Import CSV

- Drag & drop, validasi tipe & ukuran file (maks 5 MB)
- Deteksi header otomatis + **mapping kolom manual** untuk 10 variabel
- Validasi nilai Likert (menerima `4`, `4 - Penting`, atau `Penting`), usia, dan nama
- Preview data, daftar baris error, jumlah data valid vs error
- Data **hanya** tersimpan setelah tombol konfirmasi ditekan (divalidasi ulang di server)
- **Download Template CSV** hanya berisi baris header, tanpa data contoh

---

## Rumus

**Rata-rata variabel**

```
rata-rata = Σ nilai seluruh responden / jumlah responden
```

**Bobot TOP 5**

```
bobot(i) = rata-rata(i) / Σ rata-rata seluruh TOP 5      →   Σ bobot = 1
```

**Skor GPU (Weighted Average)**

```
skor(gpu) = Σ ( nilai assessment(gpu, variabel) × bobot(variabel) )
```

GPU yang belum dinilai pada seluruh variabel TOP 5 tidak dimasukkan ke ranking dan
ditampilkan sebagai daftar "assessment belum lengkap".

Snapshot hasil perhitungan disimpan ke `variable_analysis`, `selected_top_variables`, dan
`ranking_results` (dengan `batch_id`). Mengubah data responden atau assessment akan
menonaktifkan hasil lama sehingga tidak pernah ada ranking basi yang ditampilkan.

---

## Pengujian

```bash
npm run test        # unit test rumus analisis, seleksi TOP 5, ranking, dan parser CSV
npm run db:verify   # jalankan migration di Postgres in-memory (PGlite): struktur,
                    # constraint, database kosong, dan seluruh RLS policy
npm run typecheck   # tsc --noEmit
npm run lint
npm run build
```

`npm run db:verify` tidak menyentuh database Supabase Anda sama sekali — seluruh baris uji
hanya hidup di memori proses dan langsung hilang.

---

## Deploy ke Vercel

1. Push repository ini ke GitHub.
2. Vercel → **New Project** → import repository (framework Next.js terdeteksi otomatis).
3. Tambahkan Environment Variables `NEXT_PUBLIC_SUPABASE_URL` dan
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production, Preview, Development).
4. Deploy, lalu tambahkan domain Vercel ke **Supabase → Authentication → URL Configuration**
   (Site URL dan Redirect URLs).

---

## Struktur

```
src/
├─ app/
│  ├─ (auth)/login, (auth)/register   # autentikasi admin
│  ├─ dashboard/                      # area admin (force-dynamic)
│  │  ├─ respondents/  import/  analysis/  gpus/  assessment/  ranking/
│  │  └─ */actions.ts                 # server action: validasi + tulis ke Supabase
│  ├─ survey/                         # kuesioner publik
│  └─ setup/                          # panduan konfigurasi
├─ components/                        # UI dashboard + chart Recharts
└─ lib/
   ├─ analysis.ts                     # rumus murni: rata-rata, TOP 5 + bobot, ranking
   ├─ csv.ts                          # parsing, mapping, validasi CSV, template
   ├─ data.ts                         # query Supabase (server)
   └─ supabase/                       # client browser/server, middleware sesi
supabase/migrations/0001_init.sql      # skema + RLS (tanpa seed data)
scripts/verify-migration.mjs           # verifikasi migration & RLS di PGlite
tests/                                 # unit test rumus & CSV
```
