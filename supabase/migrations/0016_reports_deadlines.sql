-- ============================================================
-- 0016_reports_deadlines.sql
-- Reports library (client-viewable management/financial reports) and
-- a deadline tracker (RAG computed in the UI from due_date). Both
-- org+tenant scoped, client reads own, staff manage all.
-- Report files reuse the private 'client-documents' bucket (keyed by org).
-- ============================================================

create table if not exists reports (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id),
  org_id        uuid not null references organizations(id) on delete cascade,
  job_id        uuid references jobs(id) on delete set null,
  period_label  text,
  type          text not null default 'management'
                  check (type in ('management','profit_loss','balance_sheet','cash_flow','year_end','custom')),
  title         text not null,
  storage_path  text,
  ai_commentary text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
drop trigger if exists trg_reports_updated on reports;
create trigger trg_reports_updated before update on reports
  for each row execute function set_updated_at();
create index if not exists idx_reports_org on reports (org_id);

create table if not exists deadlines (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references tenants(id),
  org_id      uuid not null references organizations(id) on delete cascade,
  kind        text not null
                check (kind in ('vat','cis','payroll','accounts','self_assessment','confirmation_statement','other')),
  title       text not null,
  due_date    date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
drop trigger if exists trg_deadlines_updated on deadlines;
create trigger trg_deadlines_updated before update on deadlines
  for each row execute function set_updated_at();
create index if not exists idx_deadlines_org on deadlines (org_id);
create index if not exists idx_deadlines_due on deadlines (due_date);

-- ---------- RLS ----------
alter table reports   enable row level security;
alter table deadlines enable row level security;

drop policy if exists "client read own reports" on reports;
create policy "client read own reports" on reports
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write reports" on reports;
create policy "staff write reports" on reports
  for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "client read own deadlines" on deadlines;
create policy "client read own deadlines" on deadlines
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write deadlines" on deadlines;
create policy "staff write deadlines" on deadlines
  for all to authenticated using (is_staff()) with check (is_staff());
