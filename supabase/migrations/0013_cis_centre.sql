-- ============================================================
-- 0013_cis_centre.sql
-- CIS Centre (Construction Industry Scheme) for the client portal.
-- Registered subcontractors + monthly CIS suffered/deducted records,
-- optionally linked to an uploaded CIS statement document.
-- tenant_id + org_id scoped, same client-vs-staff RLS as 0007.
-- ============================================================

-- ---------- subcontractors: registered subbies per org ----------
create table if not exists subcontractors (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references tenants(id),
  org_id              uuid not null references organizations(id) on delete cascade,
  name                text not null,
  utr                 text,
  verification_number text,
  cis_rate            numeric(5,2),
  contact_email       text,
  contact_phone       text,
  status              text not null default 'active',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
drop trigger if exists trg_subcontractors_updated on subcontractors;
create trigger trg_subcontractors_updated before update on subcontractors
  for each row execute function set_updated_at();
create index if not exists idx_subcontractors_org on subcontractors (org_id);

-- ---------- cis_records: monthly CIS suffered/deducted, filed by period ----------
create table if not exists cis_records (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references tenants(id),
  org_id                uuid not null references organizations(id) on delete cascade,
  subcontractor_id      uuid references subcontractors(id) on delete set null,
  period_month          int,
  period_year           int,
  suffered              numeric(12,2) default 0,
  deducted              numeric(12,2) default 0,
  statement_document_id uuid references documents(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
drop trigger if exists trg_cis_records_updated on cis_records;
create trigger trg_cis_records_updated before update on cis_records
  for each row execute function set_updated_at();
create index if not exists idx_cis_records_org on cis_records (org_id);
create index if not exists idx_cis_records_period on cis_records (period_year, period_month);

-- ============================================================
-- RLS — client reads own org, staff manage all (0007 pattern)
-- ============================================================
alter table subcontractors enable row level security;
alter table cis_records    enable row level security;

drop policy if exists "client read own subcontractors" on subcontractors;
create policy "client read own subcontractors" on subcontractors
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write subcontractors" on subcontractors;
create policy "staff write subcontractors" on subcontractors
  for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "client read own cis_records" on cis_records;
create policy "client read own cis_records" on cis_records
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write cis_records" on cis_records;
create policy "staff write cis_records" on cis_records
  for all to authenticated using (is_staff()) with check (is_staff());
