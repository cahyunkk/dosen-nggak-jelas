-- =====================================================================
-- GPU Preference Ranking System — Initial Schema
-- ---------------------------------------------------------------------
-- Jalankan file ini di Supabase SQL Editor (atau `supabase db push`).
--
-- CATATAN PENTING:
--   Migration ini TIDAK memasukkan data contoh / dummy / seed apa pun.
--   Satu-satunya baris yang di-insert adalah 10 definisi VARIABEL
--   penelitian (master/reference data instrumen kuesioner) yang memang
--   menjadi bagian dari struktur sistem, bukan hasil pengukuran.
--   Tabel respondents, respondent_assessments, gpus, gpu_assessments,
--   variable_analysis, selected_top_variables, dan ranking_results
--   akan KOSONG setelah migration dijalankan.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Helper: updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- =====================================================================
-- 1. profiles
-- =====================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'admin' check (role in ('admin', 'viewer')),
  created_at  timestamptz not null default timezone('utc'::text, now()),
  updated_at  timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Buat profile otomatis ketika user baru mendaftar lewat Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 2. variables  (10 variabel instrumen penelitian)
-- =====================================================================
create table if not exists public.variables (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name         text not null,
  description  text,
  order_index  integer not null,
  created_at   timestamptz not null default timezone('utc'::text, now()),
  updated_at   timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_variables_updated_at on public.variables;
create trigger trg_variables_updated_at
  before update on public.variables
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. respondents
-- =====================================================================
create table if not exists public.respondents (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  age                integer check (age is null or (age >= 5 and age <= 120)),
  gaming_experience  text,
  gpu_knowledge      text,
  source             text not null default 'manual'
                     check (source in ('manual', 'csv', 'public')),
  notes              text,
  created_by         uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default timezone('utc'::text, now()),
  updated_at         timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_respondents_created_at on public.respondents (created_at desc);

drop trigger if exists trg_respondents_updated_at on public.respondents;
create trigger trg_respondents_updated_at
  before update on public.respondents
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. respondent_assessments (jawaban Likert 1-5 per variabel)
-- =====================================================================
create table if not exists public.respondent_assessments (
  id             uuid primary key default gen_random_uuid(),
  respondent_id  uuid not null references public.respondents (id) on delete cascade,
  variable_id    uuid not null references public.variables (id) on delete cascade,
  score          smallint not null check (score between 1 and 5),
  created_at     timestamptz not null default timezone('utc'::text, now()),
  updated_at     timestamptz not null default timezone('utc'::text, now()),
  unique (respondent_id, variable_id)
);

create index if not exists idx_resp_assess_variable on public.respondent_assessments (variable_id);
create index if not exists idx_resp_assess_respondent on public.respondent_assessments (respondent_id);

drop trigger if exists trg_resp_assess_updated_at on public.respondent_assessments;
create trigger trg_resp_assess_updated_at
  before update on public.respondent_assessments
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 5. variable_analysis (snapshot hasil perhitungan rata-rata)
-- =====================================================================
create table if not exists public.variable_analysis (
  id               uuid primary key default gen_random_uuid(),
  batch_id         uuid not null,
  variable_id      uuid not null references public.variables (id) on delete cascade,
  total_score      integer not null,
  respondent_count integer not null,
  average_score    numeric(10, 6) not null,
  rank             integer not null,
  computed_at      timestamptz not null default timezone('utc'::text, now()),
  computed_by      uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default timezone('utc'::text, now()),
  updated_at       timestamptz not null default timezone('utc'::text, now()),
  unique (batch_id, variable_id)
);

create index if not exists idx_variable_analysis_batch on public.variable_analysis (batch_id);

drop trigger if exists trg_variable_analysis_updated_at on public.variable_analysis;
create trigger trg_variable_analysis_updated_at
  before update on public.variable_analysis
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. selected_top_variables (TOP 5 + bobot)
-- =====================================================================
create table if not exists public.selected_top_variables (
  id               uuid primary key default gen_random_uuid(),
  batch_id         uuid not null,
  variable_id      uuid not null references public.variables (id) on delete cascade,
  rank             integer not null,
  average_score    numeric(10, 6) not null,
  weight           numeric(10, 8) not null check (weight > 0 and weight <= 1),
  respondent_count integer not null,
  is_active        boolean not null default true,
  selected_at      timestamptz not null default timezone('utc'::text, now()),
  selected_by      uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default timezone('utc'::text, now()),
  updated_at       timestamptz not null default timezone('utc'::text, now()),
  unique (batch_id, variable_id)
);

create index if not exists idx_top_vars_active on public.selected_top_variables (is_active, rank);

drop trigger if exists trg_top_vars_updated_at on public.selected_top_variables;
create trigger trg_top_vars_updated_at
  before update on public.selected_top_variables
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 7. gpus (kandidat GPU — diisi manual oleh admin)
-- =====================================================================
create table if not exists public.gpus (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  brand         text not null,
  series        text,
  vram_gb       integer check (vram_gb is null or vram_gb >= 0),
  release_year  integer check (release_year is null or (release_year >= 1990 and release_year <= 2100)),
  price         numeric(14, 2) check (price is null or price >= 0),
  image_url     text,
  description   text,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default timezone('utc'::text, now()),
  updated_at    timestamptz not null default timezone('utc'::text, now())
);

drop trigger if exists trg_gpus_updated_at on public.gpus;
create trigger trg_gpus_updated_at
  before update on public.gpus
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 8. gpu_assessments (penilaian admin 1-5 per GPU per variabel TOP 5)
-- =====================================================================
create table if not exists public.gpu_assessments (
  id           uuid primary key default gen_random_uuid(),
  gpu_id       uuid not null references public.gpus (id) on delete cascade,
  variable_id  uuid not null references public.variables (id) on delete cascade,
  score        smallint not null check (score between 1 and 5),
  assessed_by  uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default timezone('utc'::text, now()),
  updated_at   timestamptz not null default timezone('utc'::text, now()),
  unique (gpu_id, variable_id)
);

create index if not exists idx_gpu_assess_gpu on public.gpu_assessments (gpu_id);

drop trigger if exists trg_gpu_assess_updated_at on public.gpu_assessments;
create trigger trg_gpu_assess_updated_at
  before update on public.gpu_assessments
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 9. ranking_results (snapshot hasil ranking weighted average)
-- =====================================================================
create table if not exists public.ranking_results (
  id                uuid primary key default gen_random_uuid(),
  batch_id          uuid not null,
  top_variable_batch uuid,
  gpu_id            uuid not null references public.gpus (id) on delete cascade,
  final_score       numeric(10, 6) not null,
  rank              integer not null,
  breakdown         jsonb not null default '[]'::jsonb,
  is_active         boolean not null default true,
  computed_at       timestamptz not null default timezone('utc'::text, now()),
  computed_by       uuid references auth.users (id) on delete set null,
  created_at        timestamptz not null default timezone('utc'::text, now()),
  updated_at        timestamptz not null default timezone('utc'::text, now()),
  unique (batch_id, gpu_id)
);

create index if not exists idx_ranking_active on public.ranking_results (is_active, rank);

drop trigger if exists trg_ranking_updated_at on public.ranking_results;
create trigger trg_ranking_updated_at
  before update on public.ranking_results
  for each row execute function public.set_updated_at();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.variables              enable row level security;
alter table public.respondents            enable row level security;
alter table public.respondent_assessments enable row level security;
alter table public.variable_analysis      enable row level security;
alter table public.selected_top_variables enable row level security;
alter table public.gpus                   enable row level security;
alter table public.gpu_assessments        enable row level security;
alter table public.ranking_results        enable row level security;

-- profiles ------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- variables -----------------------------------------------------------
drop policy if exists "variables_read_all" on public.variables;
create policy "variables_read_all" on public.variables
  for select to anon, authenticated using (true);

drop policy if exists "variables_write_auth" on public.variables;
create policy "variables_write_auth" on public.variables
  for all to authenticated using (true) with check (true);

-- respondents ---------------------------------------------------------
drop policy if exists "respondents_all_auth" on public.respondents;
create policy "respondents_all_auth" on public.respondents
  for all to authenticated using (true) with check (true);

-- Kuesioner publik: pengunjung anonim hanya boleh INSERT (tidak bisa membaca).
drop policy if exists "respondents_insert_public" on public.respondents;
create policy "respondents_insert_public" on public.respondents
  for insert to anon with check (source = 'public');

-- respondent_assessments ----------------------------------------------
drop policy if exists "resp_assess_all_auth" on public.respondent_assessments;
create policy "resp_assess_all_auth" on public.respondent_assessments
  for all to authenticated using (true) with check (true);

-- security definer: policy perlu memeriksa baris respondents yang tidak dapat
-- dibaca role anon (anon memang tidak punya policy SELECT di respondents).
create or replace function public.is_public_respondent(rid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.respondents
    where id = rid and source = 'public'
  );
$$;

drop policy if exists "resp_assess_insert_public" on public.respondent_assessments;
create policy "resp_assess_insert_public" on public.respondent_assessments
  for insert to anon with check (public.is_public_respondent(respondent_id));

-- analisis, top variabel, gpu, assessment, ranking → khusus admin login
drop policy if exists "variable_analysis_all_auth" on public.variable_analysis;
create policy "variable_analysis_all_auth" on public.variable_analysis
  for all to authenticated using (true) with check (true);

drop policy if exists "top_vars_all_auth" on public.selected_top_variables;
create policy "top_vars_all_auth" on public.selected_top_variables
  for all to authenticated using (true) with check (true);

drop policy if exists "gpus_all_auth" on public.gpus;
create policy "gpus_all_auth" on public.gpus
  for all to authenticated using (true) with check (true);

drop policy if exists "gpu_assess_all_auth" on public.gpu_assessments;
create policy "gpu_assess_all_auth" on public.gpu_assessments
  for all to authenticated using (true) with check (true);

drop policy if exists "ranking_all_auth" on public.ranking_results;
create policy "ranking_all_auth" on public.ranking_results
  for all to authenticated using (true) with check (true);

-- =====================================================================
-- GRANTS (eksplisit agar tidak bergantung pada default privileges)
-- Akses tetap dibatasi oleh RLS policy di atas.
-- =====================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.variables,
  public.respondents,
  public.respondent_assessments,
  public.variable_analysis,
  public.selected_top_variables,
  public.gpus,
  public.gpu_assessments,
  public.ranking_results
to authenticated;

grant select on public.variables to anon;
grant insert on public.respondents to anon;
grant insert on public.respondent_assessments to anon;
grant execute on function public.is_public_respondent(uuid) to anon, authenticated;

-- =====================================================================
-- MASTER DATA INSTRUMEN: 10 variabel penelitian.
-- Ini adalah definisi variabel (struktur kuesioner), BUKAN data hasil
-- pengukuran / dummy. Tidak ada nilai, skor, atau responden yang dibuat.
-- =====================================================================
insert into public.variables (code, name, description, order_index) values
  ('performa_gaming',      'Performa Gaming',                     'Kemampuan GPU menghasilkan frame rate tinggi pada resolusi dan setting yang diinginkan.', 1),
  ('harga_gpu',            'Harga GPU',                           'Harga beli kartu grafis relatif terhadap anggaran pengguna.', 2),
  ('value_for_money',      'Value for Money',                     'Perbandingan performa yang didapat terhadap harga yang dibayarkan.', 3),
  ('kapasitas_vram',       'Kapasitas VRAM',                      'Besarnya memori grafis untuk tekstur resolusi tinggi dan game modern.', 4),
  ('ray_tracing',          'Kemampuan Ray Tracing',               'Dukungan dan performa rendering pencahayaan realistis berbasis ray tracing.', 5),
  ('efisiensi_daya',       'Efisiensi Konsumsi Daya',             'Konsumsi listrik GPU dan kebutuhan kapasitas power supply.', 6),
  ('suhu_operasional',     'Suhu Operasional GPU',                'Suhu kerja GPU saat beban penuh serta kualitas sistem pendinginan.', 7),
  ('teknologi_fitur',      'Teknologi dan Fitur Tambahan',        'Fitur pendukung seperti upscaling, frame generation, encoder, dan driver.', 8),
  ('future_proof',         'Future Proof',                        'Ketahanan performa GPU untuk game beberapa tahun ke depan.', 9),
  ('kompatibilitas_pc',    'Kompatibilitas dengan Komponen PC',   'Kesesuaian dimensi, konektor daya, dan keseimbangan dengan CPU/motherboard.', 10)
on conflict (code) do update
  set name        = excluded.name,
      description = excluded.description,
      order_index = excluded.order_index;

-- =====================================================================
-- VIEWS: agregasi real-time (menghitung dari data nyata, tanpa dummy).
-- security_invoker = true → RLS tabel sumber tetap berlaku.
-- =====================================================================
create or replace view public.variable_analysis_live
with (security_invoker = true) as
select
  v.id                                        as variable_id,
  v.code                                      as code,
  v.name                                      as name,
  v.order_index                               as order_index,
  coalesce(sum(ra.score), 0)::int             as total_score,
  count(ra.id)::int                           as respondent_count,
  case
    when count(ra.id) > 0 then round(sum(ra.score)::numeric / count(ra.id), 6)
    else 0
  end                                         as average_score
from public.variables v
left join public.respondent_assessments ra on ra.variable_id = v.id
group by v.id, v.code, v.name, v.order_index;

create or replace view public.likert_distribution_live
with (security_invoker = true) as
select
  ra.score          as score,
  count(*)::int     as total
from public.respondent_assessments ra
group by ra.score;

grant select on public.variable_analysis_live to authenticated;
grant select on public.likert_distribution_live to authenticated;
