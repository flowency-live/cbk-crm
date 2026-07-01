-- ============================================================
-- 0006_tenants.sql
-- Multi-tenant / brand layer. Cheshire Bookkeeping is the parent
-- practice; brands (tenants) sit beneath it. Hi-Vis is tenant #1;
-- Cheshire + others come later. Nothing may hard-code a brand —
-- branding is resolved from the tenant record.
-- ============================================================

-- Fixed id for the seed Hi-Vis tenant so the column default + backfill
-- can reference it deterministically.
-- HIVIS_TENANT_ID = a0000000-0000-4000-8000-000000000001

create table if not exists tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  theme         jsonb not null default '{}'::jsonb,  -- logo_url, primary, ink, accent, portal_name
  support_email text,
  status        text not null default 'active',      -- active | paused
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_tenants_updated on tenants;
create trigger trg_tenants_updated before update on tenants
  for each row execute function set_updated_at();

-- Seed Hi-Vis (tenant #1)
insert into tenants (id, slug, name, theme, support_email)
values (
  'a0000000-0000-4000-8000-000000000001',
  'hi-vis',
  'The Hi Vis Bookkeeper',
  jsonb_build_object(
    'logo_url',    '/brand/hi-vis/logo.png',
    'primary',     '#FACC15',
    'ink',         '#1C1C1C',
    'accent',      '#3FA89B',
    'portal_name', 'The Hi Vis Bookkeeper'
  ),
  'hello@hivisbooks.co.uk'
)
on conflict (slug) do nothing;

-- Attach organizations to a tenant. Default to Hi-Vis so existing rows and
-- new CRM inserts work without change while we are single-brand. When brand #2
-- arrives, set tenant_id explicitly on insert instead of relying on this default.
alter table organizations
  add column if not exists tenant_id uuid references tenants(id)
  default 'a0000000-0000-4000-8000-000000000001';

update organizations set tenant_id = 'a0000000-0000-4000-8000-000000000001'
where tenant_id is null;

create index if not exists idx_org_tenant on organizations (tenant_id);

-- RLS: branding is readable by any authenticated user (not sensitive);
-- only staff/admin may write.
alter table tenants enable row level security;

drop policy if exists "read tenants" on tenants;
create policy "read tenants" on tenants
  for select to authenticated using (true);

drop policy if exists "staff write tenants" on tenants;
create policy "staff write tenants" on tenants
  for all to authenticated using (is_staff()) with check (is_staff());
