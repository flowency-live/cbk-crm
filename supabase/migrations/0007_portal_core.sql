-- ============================================================
-- 0007_portal_core.sql
-- Client portal core: who can log in (portal_users), the minimal
-- job + Hi-Vis status, and uploaded documents. Plus the RLS that
-- isolates a client to their own org + tenant.
-- ============================================================

-- ---------- job status (Hi-Vis flow) ----------
-- ready_for_review (report ready, no action) is intentionally distinct from
-- ready_for_approval (needs client sign-off). Keep both.
do $$ begin
  create type job_status as enum (
    'submitted',
    'under_review',
    'in_progress',
    'info_required',
    'ready_for_review',
    'ready_for_approval',
    'completed'
  );
exception when duplicate_object then null; end $$;

-- ---------- portal_users: links an auth user to one org + tenant ----------
create table if not exists portal_users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  org_id        uuid not null references organizations(id) on delete cascade,
  tenant_id     uuid not null references tenants(id),
  contact_id    uuid references contacts(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (auth_user_id)
);
drop trigger if exists trg_portal_users_updated on portal_users;
create trigger trg_portal_users_updated before update on portal_users
  for each row execute function set_updated_at();
create index if not exists idx_portal_users_org on portal_users (org_id);

-- ---------- jobs: minimal per-client job carrying a Hi-Vis status ----------
create table if not exists jobs (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id),
  org_id       uuid not null references organizations(id) on delete cascade,
  title        text not null,
  service_type text,                      -- 'monthly_bookkeeping' | 'vat' | 'cis' | ...
  status       job_status not null default 'submitted',
  period_label text,                      -- e.g. 'June 2026'
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
drop trigger if exists trg_jobs_updated on jobs;
create trigger trg_jobs_updated before update on jobs
  for each row execute function set_updated_at();
create index if not exists idx_jobs_org on jobs (org_id);
create index if not exists idx_jobs_tenant on jobs (tenant_id);

-- ---------- documents: client uploads, filed by month/year ----------
create table if not exists documents (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id),
  org_id        uuid not null references organizations(id) on delete cascade,
  job_id        uuid references jobs(id) on delete set null,
  uploaded_by   uuid references auth.users(id) on delete set null,
  file_name     text not null,
  storage_path  text not null,
  period_month  int,                      -- 1..12
  period_year   int,
  status        text not null default 'received',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
drop trigger if exists trg_documents_updated on documents;
create trigger trg_documents_updated before update on documents
  for each row execute function set_updated_at();
create index if not exists idx_documents_org on documents (org_id);
create index if not exists idx_documents_period on documents (period_year, period_month);

-- ---------- helper: the caller's portal org (security definer) ----------
create or replace function auth_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from portal_users where auth_user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table portal_users enable row level security;
alter table jobs         enable row level security;
alter table documents    enable row level security;

-- portal_users: a client sees only their own link; staff manage all.
drop policy if exists "client read own portal_user" on portal_users;
create policy "client read own portal_user" on portal_users
  for select to authenticated using (auth_user_id = auth.uid() or is_staff());
drop policy if exists "staff write portal_users" on portal_users;
create policy "staff write portal_users" on portal_users
  for all to authenticated using (is_staff()) with check (is_staff());

-- jobs: client reads own org's jobs; staff manage all.
drop policy if exists "client read own jobs" on jobs;
create policy "client read own jobs" on jobs
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write jobs" on jobs;
create policy "staff write jobs" on jobs
  for all to authenticated using (is_staff()) with check (is_staff());

-- documents: client reads + uploads to own org; staff manage all.
drop policy if exists "client read own documents" on documents;
create policy "client read own documents" on documents
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "client insert own documents" on documents;
create policy "client insert own documents" on documents
  for insert to authenticated
  with check (org_id = auth_org_id() and uploaded_by = auth.uid());
drop policy if exists "staff write documents" on documents;
create policy "staff write documents" on documents
  for all to authenticated using (is_staff()) with check (is_staff());

-- ============================================================
-- Tighten existing reads so a `client` cannot see the whole CRM.
-- 0002_rls.sql granted SELECT on organizations/contacts to ALL
-- authenticated users (using(true)). Restrict to staff/agent + own org.
-- Staff and agents are unaffected.
-- ============================================================
drop policy if exists "read organizations" on organizations;
create policy "read organizations" on organizations
  for select to authenticated
  using (is_staff() or auth_role() = 'agent' or id = auth_org_id());

drop policy if exists "read contacts" on contacts;
create policy "read contacts" on contacts
  for select to authenticated
  using (is_staff() or auth_role() = 'agent' or org_id = auth_org_id());
