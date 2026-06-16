-- ============================================================
-- Cheshire Bookkeeping CRM — ONE-PASTE SETUP
-- Paste this whole file into the Supabase SQL editor and Run.
-- (Equivalent to migrations 0001 + 0002 + 0003 in order.)
-- The final seed block is optional demo data — delete it for a clean start.
-- ============================================================


-- ====================  0001_init.sql  ====================

create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

do $$ begin
  create type company_status as enum ('prospect', 'client', 'dormant', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('admin', 'staff', 'client', 'agent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_type as enum ('call', 'email', 'meeting', 'task', 'note');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text,
  role        user_role not null default 'staff',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table if not exists organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  trading_name      text,
  company_number    text,
  company_type      text,
  status            company_status not null default 'prospect',
  sector            text,
  sic_code          text,
  address_line1     text,
  address_line2     text,
  town              text,
  county            text,
  postcode          text,
  incorporated_on   date,
  ch_status         text,
  accounts_next_due date,
  confirmation_next_due date,
  owner_id          uuid references profiles(id) on delete set null,
  website           text,
  phone             text,
  enriched_at       timestamptz,
  enriched_by       text,
  enrichment        jsonb not null default '{}'::jsonb,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
drop trigger if exists trg_org_updated on organizations;
create trigger trg_org_updated before update on organizations
  for each row execute function set_updated_at();

create index if not exists idx_org_name_trgm on organizations using gin (name gin_trgm_ops);
create index if not exists idx_org_town_trgm on organizations using gin (town gin_trgm_ops);
create index if not exists idx_org_postcode_trgm on organizations using gin (postcode gin_trgm_ops);
create index if not exists idx_org_sector_trgm on organizations using gin (sector gin_trgm_ops);
create index if not exists idx_org_number on organizations (company_number);
create index if not exists idx_org_status on organizations (status);

create table if not exists contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  full_name   text not null,
  email       text,
  phone       text,
  title       text,
  is_primary  boolean not null default false,
  source      text,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
drop trigger if exists trg_contacts_updated on contacts;
create trigger trg_contacts_updated before update on contacts
  for each row execute function set_updated_at();

create index if not exists idx_contacts_org on contacts (org_id);
create index if not exists idx_contacts_name_trgm on contacts using gin (full_name gin_trgm_ops);
create index if not exists idx_contacts_email_trgm on contacts using gin (email gin_trgm_ops);

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
drop trigger if exists trg_deals_updated on deals;
create trigger trg_deals_updated before update on deals
  for each row execute function set_updated_at();
create index if not exists idx_deals_org on deals (org_id);

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

create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade,
  body        text not null,
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notes_org on notes (org_id);

create table if not exists tags (
  id     uuid primary key default gen_random_uuid(),
  label  text not null unique,
  color  text
);
create table if not exists taggables (
  tag_id      uuid references tags(id) on delete cascade,
  entity_type text not null,
  entity_id   uuid not null,
  primary key (tag_id, entity_type, entity_id)
);
create index if not exists idx_taggables_entity on taggables (entity_type, entity_id);

create table if not exists enrichment_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id   uuid not null,
  field       text,
  old_value   text,
  new_value   text,
  source      text,
  confidence  numeric,
  status      text not null default 'applied',
  created_at  timestamptz not null default now()
);
create index if not exists idx_enrichlog_entity on enrichment_log (entity_type, entity_id);

create table if not exists companies_house_cache (
  company_number text primary key,
  payload        jsonb not null,
  fetched_at     timestamptz not null default now()
);

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


-- ====================  0002_rls.sql  ====================

create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from profiles where id = auth.uid()),
    'staff'::user_role
  );
$$;

create or replace function is_staff()
returns boolean language sql stable as $$
  select auth_role() in ('admin','staff');
$$;

alter table profiles            enable row level security;
alter table organizations       enable row level security;
alter table contacts            enable row level security;
alter table deals               enable row level security;
alter table activities          enable row level security;
alter table notes               enable row level security;
alter table tags                enable row level security;
alter table taggables           enable row level security;
alter table enrichment_log      enable row level security;
alter table companies_house_cache enable row level security;

drop policy if exists "profiles readable by authenticated" on profiles;
create policy "profiles readable by authenticated" on profiles
  for select to authenticated using (true);
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['organizations','contacts','deals','activities','notes','tags','taggables','enrichment_log','companies_house_cache']
  loop
    execute format('drop policy if exists "read %1$s" on %1$s;', t);
    execute format('create policy "read %1$s" on %1$s for select to authenticated using (true);', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['organizations','contacts','deals','activities','notes','tags','taggables','companies_house_cache']
  loop
    execute format('drop policy if exists "staff write %1$s" on %1$s;', t);
    execute format('create policy "staff write %1$s" on %1$s for all to authenticated using (is_staff()) with check (is_staff());', t);
  end loop;
end $$;

drop policy if exists "agent update organizations" on organizations;
create policy "agent update organizations" on organizations
  for update to authenticated using (auth_role() = 'agent') with check (auth_role() = 'agent');
drop policy if exists "agent update contacts" on contacts;
create policy "agent update contacts" on contacts
  for update to authenticated using (auth_role() = 'agent') with check (auth_role() = 'agent');
drop policy if exists "agent insert enrichment_log" on enrichment_log;
create policy "agent insert enrichment_log" on enrichment_log
  for insert to authenticated with check (auth_role() in ('agent','admin','staff'));
drop policy if exists "staff manage enrichment_log" on enrichment_log;
create policy "staff manage enrichment_log" on enrichment_log
  for update to authenticated using (is_staff()) with check (is_staff());


-- ====================  0003_seed.sql  (optional demo data)  ====================

insert into organizations
  (name, company_number, company_type, status, sector, sic_code, town, county, postcode,
   incorporated_on, ch_status, accounts_next_due, confirmation_next_due, phone)
values
  ('Bollington Brew Co Ltd','09832145','Private limited','client','Hospitality','11050 - Manufacture of beer','Bollington','Cheshire East','SK10 5JH','2016-03-12','Active','2026-12-31','2027-03-26','01625 573214'),
  ('Wilmslow Wellness Studio Ltd','12044871','Private limited','client','Health & Fitness','93130 - Fitness facilities','Wilmslow','Cheshire East','SK9 1BX','2019-08-04','Active','2027-04-30','2026-08-18','01625 449082'),
  ('Chester Timber & Joinery Ltd','08120934','Private limited','client','Construction','16230 - Builders carpentry','Chester','Cheshire West','CH1 3AE','2012-06-21','Active','2026-09-30','2026-07-05','01244 320118'),
  ('Knutsford Kitchen Studio Ltd','13567229','Private limited','prospect','Retail','47591 - Retail of furniture','Knutsford','Cheshire East','WA16 6DA','2021-09-15','Active','2026-12-31','2026-09-14','01565 651120'),
  ('Crewe Auto Repairs Ltd','10299384','Private limited','client','Automotive','45200 - Maintenance of motor vehicles','Crewe','Cheshire East','CW1 2QP','2017-01-30','Active','2026-10-31','2027-02-12','01270 215583'),
  ('Nantwich Digital Ltd','14002271','Private limited','prospect','Technology','62012 - Business software development','Nantwich','Cheshire East','CW5 5AS','2022-02-02','Active','2027-02-28','2027-02-01','01270 887441'),
  ('Macclesfield Print House Ltd','07788321','Private limited','dormant','Manufacturing','18129 - Printing n.e.c.','Macclesfield','Cheshire East','SK11 6LF','2011-11-18','Active',null,'2026-11-22','01625 612009'),
  ('Sandbach Florals Ltd','13881204','Private limited','client','Retail','47760 - Retail of flowers & plants','Sandbach','Cheshire East','CW11 1AT','2021-12-09','Active','2026-09-30','2026-12-08','01270 768432'),
  ('Northwich Care Services Ltd','11540982','Private limited','client','Healthcare','88100 - Social work without accommodation','Northwich','Cheshire West','CW9 5BT','2018-08-25','Active','2027-05-31','2026-08-30','01606 331207'),
  ('Alderley Edge Interiors Ltd','12993017','Private limited','prospect','Retail','74100 - Specialised design','Alderley Edge','Cheshire East','SK9 7DZ','2020-05-11','Active','2027-05-31','2027-05-10','01625 590112')
on conflict do nothing;

insert into contacts (org_id, full_name, email, phone, title, is_primary, source)
select id, v.full_name, v.email, v.phone, v.title, v.is_primary, 'companies_house'
from organizations o
join (values
  ('09832145','Sarah Mellor','sarah@bollingtonbrew.co.uk','01625 573214','Director',true),
  ('09832145','James Mellor','james@bollingtonbrew.co.uk',null,'Director',false),
  ('12044871','Priya Shah','priya@wilmslowwellness.com','01625 449082','Director',true),
  ('08120934','Mark Ridley','accounts@chestertimber.co.uk','01244 320118','Director',true),
  ('08120934','Anne Ridley',null,null,'Director',false),
  ('13567229','Helen Carter','helen@knutsfordkitchens.co.uk','01565 651120','Director',true),
  ('10299384','Dave Hollins','dave@creweauto.co.uk','01270 215583','Director',true),
  ('14002271','Olivia Grant','olivia@nantwichdigital.com','01270 887441','Director',true),
  ('07788321','Geoff Barlow','geoff@maccprint.co.uk','01625 612009','Director',true),
  ('13881204','Emma Whitlow','hello@sandbachflorals.co.uk','01270 768432','Director',true),
  ('11540982','Rachel Owen','rachel@northwichcare.co.uk','01606 331207','Director',true),
  ('12993017','Charlotte Dean','charlotte@aeinteriors.co.uk','01625 590112','Director',true)
) as v(num, full_name, email, phone, title, is_primary) on o.company_number = v.num
on conflict do nothing;

insert into activities (org_id, type, subject, body, created_at)
select o.id, v.type::activity_type, v.subject, v.body, now() - (v.days || ' days')::interval
from organizations o
join (values
  ('09832145','call','Discussed Q2 VAT return','Confirmed figures with Sarah',2),
  ('12044871','meeting','Year-end planning','Reviewed accounts approach',1),
  ('08120934','call','CIS subcontractor query','6 subcontractors to verify',3),
  ('13567229','email','Sent proposal','Awaiting response',7),
  ('10299384','call','Quarterly catch-up','All on track',4),
  ('14002271','email','Intro email','Possible R&D claim',14),
  ('07788321','task','Filed dormant accounts','Submitted to CH',90),
  ('13881204','call','Valentine stock financing','Cashflow plan agreed',6),
  ('11540982','meeting','Payroll for 22 carers','Variable hours setup',0),
  ('12993017','email','Sent welcome pack','Referred by Knutsford Kitchen',5)
) as v(num, type, subject, body, days) on o.company_number = v.num;

insert into notes (org_id, body)
select o.id, v.body
from organizations o
join (values
  ('09832145','Prefers Xero. Quarterly VAT, monthly payroll for 8 staff.'),
  ('12044871','Sole director. Wants help with self-assessment too.'),
  ('08120934','CIS scheme - 6 subcontractors. Confirmation statement due soon.'),
  ('13567229','Warm lead from networking event. Unhappy with current national firm.'),
  ('10299384','Cash-heavy business, watch reconciliations.'),
  ('14002271','May qualify for R&D tax credits. Follow up.'),
  ('07788321','Trading paused 2025. Filing dormant accounts only.'),
  ('13881204','Highly seasonal - peaks Feb & May. Plan cashflow around it.'),
  ('11540982','Large payroll - 22 staff, variable hours. VAT exempt supplies.'),
  ('12993017','High-end interior design. Referred by Knutsford Kitchen Studio.')
) as v(num, body) on o.company_number = v.num;

insert into tags (label) values
  ('VAT'),('Monthly'),('Self-assessment'),('CIS'),('Lead'),('R&D'),
  ('Cash basis'),('Seasonal'),('Payroll'),('Dormant'),('VAT exempt')
on conflict do nothing;

insert into taggables (tag_id, entity_type, entity_id)
select tg.id, 'organization', o.id
from organizations o
join (values
  ('09832145','VAT'),('09832145','Monthly'),
  ('12044871','Self-assessment'),
  ('08120934','CIS'),('08120934','VAT'),
  ('13567229','Lead'),
  ('10299384','VAT'),('10299384','Cash basis'),
  ('14002271','Lead'),('14002271','R&D'),
  ('07788321','Dormant'),
  ('13881204','VAT'),('13881204','Seasonal'),
  ('11540982','Payroll'),('11540982','VAT exempt'),
  ('12993017','Lead')
) as v(num, label) on o.company_number = v.num
join tags tg on tg.label = v.label
on conflict do nothing;
