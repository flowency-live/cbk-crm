-- ============================================================
-- Row-Level Security
-- 0002_rls.sql
-- ============================================================

-- Role lookup helper (security definer to avoid recursive RLS on profiles)
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from profiles where id = auth.uid()),
    'staff'::user_role  -- default for any authenticated user without a profile row yet
  );
$$;

create or replace function is_staff()
returns boolean language sql stable as $$
  select auth_role() in ('admin','staff');
$$;

-- Enable RLS
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

-- ---------- profiles ----------
create policy "profiles readable by authenticated" on profiles
  for select to authenticated using (true);
create policy "profiles update own" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- generic read for all authenticated users ----------
do $$
declare t text;
begin
  foreach t in array array['organizations','contacts','deals','activities','notes','tags','taggables','enrichment_log','companies_house_cache']
  loop
    execute format('create policy "read %1$s" on %1$s for select to authenticated using (true);', t);
  end loop;
end $$;

-- ---------- staff/admin full write ----------
do $$
declare t text;
begin
  foreach t in array array['organizations','contacts','deals','activities','notes','tags','taggables','companies_house_cache']
  loop
    execute format('create policy "staff write %1$s" on %1$s for all to authenticated using (is_staff()) with check (is_staff());', t);
  end loop;
end $$;

-- ---------- agents: enrich orgs/contacts + log ----------
create policy "agent update organizations" on organizations
  for update to authenticated using (auth_role() = 'agent') with check (auth_role() = 'agent');
create policy "agent update contacts" on contacts
  for update to authenticated using (auth_role() = 'agent') with check (auth_role() = 'agent');
create policy "agent insert enrichment_log" on enrichment_log
  for insert to authenticated with check (auth_role() in ('agent','admin','staff'));
create policy "staff manage enrichment_log" on enrichment_log
  for update to authenticated using (is_staff()) with check (is_staff());

-- NOTE: the service_role key bypasses RLS entirely. Use it ONLY server-side
-- (privileged server actions, marketing agents). The browser only ever uses the
-- anon key + the logged-in user's JWT, so these policies are always enforced there.
