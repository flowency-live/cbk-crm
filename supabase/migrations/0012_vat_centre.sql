-- ============================================================
-- 0012_vat_centre.sql
-- VAT Centre for the client portal: VAT periods/returns scoped
-- to org + tenant. Client reads own org's periods; staff manage all.
-- ============================================================

-- ---------- vat_periods ----------
create table if not exists vat_periods (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id),
  org_id         uuid not null references organizations(id) on delete cascade,
  job_id         uuid references jobs(id),
  period_start   date,
  period_end     date,
  status         text not null default 'open'
                 check (status in ('open','under_review','awaiting_approval','submitted','closed')),
  estimated_due  numeric(12,2),
  submission_due date,
  submitted_at   timestamptz,
  hmrc_reference text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
drop trigger if exists trg_vat_periods_updated on vat_periods;
create trigger trg_vat_periods_updated before update on vat_periods
  for each row execute function set_updated_at();
create index if not exists idx_vat_periods_org on vat_periods (org_id);
create index if not exists idx_vat_periods_tenant on vat_periods (tenant_id);

-- ============================================================
-- RLS
-- ============================================================
alter table vat_periods enable row level security;

drop policy if exists "client read own vat_periods" on vat_periods;
create policy "client read own vat_periods" on vat_periods
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write vat_periods" on vat_periods;
create policy "staff write vat_periods" on vat_periods
  for all to authenticated using (is_staff()) with check (is_staff());
