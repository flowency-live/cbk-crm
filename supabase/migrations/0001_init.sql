-- ============================================================
-- Cheshire Bookkeeping CRM — schema
-- 0001_init.sql
-- ============================================================

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type company_status as enum ('prospect', 'client', 'dormant', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin', 'staff', 'client', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum ('call', 'email', 'meeting', 'task', 'note');
exception when duplicate_object then null; end $$;

-- ---------- updated_at helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles (mirrors auth.users) ----------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        user_role not null default 'staff',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- ---------- organizations (companies) ----------
create table if not exists organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  trading_name      text,
  company_number    text,
  company_type      text,
  status            company_status not null default 'prospect',
  sector            text,
  sic_code          text,
  -- registered office / location
  address_line1     text,
  address_line2     text,
  town              text,
  county            text,
  postcode          text,
  -- registration
  incorporated_on   date,
  ch_status         text,
  accounts_next_due date,
  confirmation_next_due date,
  -- crm
  owner_id          uuid references profiles(id) on delete set null,
  website           text,
  phone             text,
  -- enrichment / provenance
  enriched_at       timestamptz,
  enriched_by       text,
  enrichment        jsonb not null default '{}'::jsonb,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger trg_org_updated before update on organizations
  for each row execute function set_updated_at();

create index if not exists idx_org_name_trgm on organizations using gin (name gin_trgm_ops);
create index if not exists idx_org_town_trgm on organizations using gin (town gin_trgm_ops);
create index if not exists idx_org_postcode_trgm on organizations using gin (postcode gin_trgm_ops);
create index if not exists idx_org_sector_trgm on organizations using gin (sector gin_trgm_ops);
create index if not exists idx_org_number on organizations (company_number);
create index if not exists idx_org_status on organizations (status);

-- ---------- contacts ----------
create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  full_name   text not null,
  email       text,
  phone       text,
  title       text,
  is_primary  boolean not null default false,
  source      text,          -- e.g. 'companies_house', 'manual'
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();

create index if not exists idx_contacts_org on contacts (org_id);
create index if not exists idx_contacts_name_trgm on contacts using gin (full_name gin_trgm_ops);
create index if not exists idx_contacts_email_trgm on contacts using gin (email gin_trgm_ops);

-- ---------- deals ----------
create table if not exists deals (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  name        text not null,
  stage       text not null default 'new',
  value       numeric(12,2),
  currency    text not null default 'GBP',
  probability int,
  expected_close date,
  owner_id    uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_deals_updated before update on deals
  for each row execute function set_updated_at();
create index if not exists idx_deals_org on deals (org_id);

-- ---------- activities ----------
create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  contact_id  uuid references contacts(id) on delete set null,
  deal_id     uuid references deals(id) on delete set null,
  type        activity_type not null default 'note',
  subject     text not null,
  body        text,
  due_at      timestamptz,
  completed_at timestamptz,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_activities_org on activities (org_id);
create index if not exists idx_activities_created on activities (created_at desc);

-- ---------- notes ----------
create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  body        text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notes_org on notes (org_id);

-- ---------- tags ----------
create table if not exists tags (
  id     uuid primary key default gen_random_uuid(),
  label  text not null unique,
  color  text
);
create table if not exists taggables (
  tag_id      uuid references tags(id) on delete cascade,
  entity_type text not null,         -- 'organization' | 'contact'
  entity_id   uuid not null,
  primary key (tag_id, entity_type, entity_id)
);
create index if not exists idx_taggables_entity on taggables (entity_type, entity_id);

-- ---------- enrichment log (agent audit trail) ----------
create table if not exists enrichment_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  field       text,
  old_value   text,
  new_value   text,
  source      text,            -- which agent / data source
  confidence  numeric,
  status      text not null default 'applied',  -- applied | reverted | pending
  created_at  timestamptz not null default now()
);
create index if not exists idx_enrichlog_entity on enrichment_log (entity_type, entity_id);

-- ---------- companies house response cache ----------
create table if not exists companies_house_cache (
  company_number text primary key,
  payload        jsonb not null,
  fetched_at     timestamptz not null default now()
);

-- ============================================================
-- list view: org + primary contact + last activity + tags
-- ============================================================
create or replace view company_list_view
with (security_invoker = true) as
select
  o.*,
  pc.full_name as primary_contact_name,
  pc.email     as primary_contact_email,
  la.last_activity_at,
  coalesce(t.tags, '{}') as tags
from organizations o
left join lateral (
  select c.full_name, c.email
  from contacts c
  where c.org_id = o.id and c.deleted_at is null
  order by c.is_primary desc, c.created_at asc
  limit 1
) pc on true
left join lateral (
  select max(a.created_at) as last_activity_at
  from activities a where a.org_id = o.id
) la on true
left join lateral (
  select array_agg(tg.label order by tg.label) as tags
  from taggables tx
  join tags tg on tg.id = tx.tag_id
  where tx.entity_type = 'organization' and tx.entity_id = o.id
) t on true
where o.deleted_at is null;

-- ============================================================
-- search RPC: matches across org + contact fields (fuzzy)
-- ============================================================
create or replace function search_companies(q text)
returns setof company_list_view
language sql stable as $$
  select clv.* from company_list_view clv
  where
    q is null or q = '' or
    clv.name ilike '%'||q||'%' or
    clv.trading_name ilike '%'||q||'%' or
    clv.town ilike '%'||q||'%' or
    clv.county ilike '%'||q||'%' or
    clv.postcode ilike '%'||q||'%' or
    clv.sector ilike '%'||q||'%' or
    clv.company_number ilike '%'||q||'%' or
    clv.primary_contact_name ilike '%'||q||'%' or
    clv.primary_contact_email ilike '%'||q||'%' or
    exists (
      select 1 from contacts c
      where c.org_id = clv.id and c.deleted_at is null
        and (c.full_name ilike '%'||q||'%' or c.email ilike '%'||q||'%')
    )
  order by clv.name;
$$;
