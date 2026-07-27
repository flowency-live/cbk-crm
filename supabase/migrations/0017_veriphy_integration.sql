-- ============================================================
-- 0017_veriphy_integration.sql
-- Support an external ID/AML provider (Veriphy) in onboarding.
--   aml_checks              — the compliance record (STAFF ONLY): results + human decision.
--   id_verification_sessions — the client-facing capture link + status (CLIENT READABLE).
-- Split into two tables because RLS is row-level: clients must see their ID
-- capture link/status but must NEVER see AML results or the firm's decision.
-- Vendor-agnostic columns (works for Veriphy; swappable later).
-- ============================================================

-- ---------- extend aml_checks (still staff-only) ----------
alter table aml_checks
  add column if not exists check_type text not null default 'aml_screen'
    check (check_type in ('id_verification','aml_screen','pep_sanctions','company','source_of_funds')),
  add column if not exists status text not null default 'requested'
    check (status in ('requested','in_progress','complete','error','expired')),
  add column if not exists provider_check_id text,          -- Veriphy's check/search id
  add column if not exists result_payload jsonb,            -- raw provider response (audit)
  add column if not exists requested_by uuid references auth.users(id) on delete set null,
  add column if not exists checked_at timestamptz;

create index if not exists idx_aml_checks_status on aml_checks (org_id, status);

-- ---------- id_verification_sessions (client-readable) ----------
create table if not exists id_verification_sessions (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants(id),
  org_id            uuid not null references organizations(id) on delete cascade,
  aml_check_id      uuid references aml_checks(id) on delete set null,
  provider          text not null default 'veriphy',
  provider_check_id text,
  session_url       text,                                   -- the link the client opens to do doc + selfie
  status            text not null default 'requested'
                      check (status in ('requested','in_progress','complete','failed','expired')),
  expires_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
drop trigger if exists trg_idv_sessions_updated on id_verification_sessions;
create trigger trg_idv_sessions_updated before update on id_verification_sessions
  for each row execute function set_updated_at();
create index if not exists idx_idv_sessions_org on id_verification_sessions (org_id);

alter table id_verification_sessions enable row level security;

-- Client may READ their own org's session (link + status). No AML result here, so safe.
drop policy if exists "client read own idv sessions" on id_verification_sessions;
create policy "client read own idv sessions" on id_verification_sessions
  for select to authenticated using (is_staff() or org_id = auth_org_id());
-- Only staff (and the service role via webhook) write. Clients never insert/update.
drop policy if exists "staff write idv sessions" on id_verification_sessions;
create policy "staff write idv sessions" on id_verification_sessions
  for all to authenticated using (is_staff()) with check (is_staff());
