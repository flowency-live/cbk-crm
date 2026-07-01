-- ============================================================
-- 0015_onboarding.sql
-- Client onboarding (questionnaire + ID upload) and internal AML
-- checks. Onboarding is one-per-org and client-editable through the
-- questionnaire/id_uploaded stages; AML is staff-only and never
-- visible to clients.
-- ============================================================

create table if not exists onboarding (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references tenants(id),
  org_id        uuid not null references organizations(id) on delete cascade,
  status        text not null default 'started'
                  check (status in ('started','questionnaire_complete','id_uploaded','review','complete')),
  questionnaire jsonb not null default '{}'::jsonb,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id)
);
drop trigger if exists trg_onboarding_updated on onboarding;
create trigger trg_onboarding_updated before update on onboarding
  for each row execute function set_updated_at();
create index if not exists idx_onboarding_org on onboarding (org_id);
create index if not exists idx_onboarding_tenant on onboarding (tenant_id);

create table if not exists aml_checks (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants(id),
  org_id       uuid not null references organizations(id) on delete cascade,
  provider     text,
  reference    text,
  result       text,
  evidence_url text,
  decision     text check (decision in ('pending','cleared','rejected')),
  decided_by   uuid references auth.users(id) on delete set null,
  decided_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
drop trigger if exists trg_aml_checks_updated on aml_checks;
create trigger trg_aml_checks_updated before update on aml_checks
  for each row execute function set_updated_at();
create index if not exists idx_aml_checks_org on aml_checks (org_id);
create index if not exists idx_aml_checks_tenant on aml_checks (tenant_id);

alter table onboarding enable row level security;
alter table aml_checks enable row level security;

drop policy if exists "client read own onboarding" on onboarding;
create policy "client read own onboarding" on onboarding
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "client update own onboarding" on onboarding;
create policy "client update own onboarding" on onboarding
  for update to authenticated
  using (org_id = auth_org_id()) with check (org_id = auth_org_id());
drop policy if exists "staff write onboarding" on onboarding;
create policy "staff write onboarding" on onboarding
  for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "staff read aml_checks" on aml_checks;
create policy "staff read aml_checks" on aml_checks
  for select to authenticated using (is_staff());
drop policy if exists "staff write aml_checks" on aml_checks;
create policy "staff write aml_checks" on aml_checks
  for all to authenticated using (is_staff()) with check (is_staff());
