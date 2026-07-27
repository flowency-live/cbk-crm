-- 0020: CRITICAL — stop new signups defaulting to staff + block role self-escalation
-- (applied to live 2 Jul 2026 via MCP)
--
-- Before this migration:
--   * profiles.role defaulted to 'staff' and handle_new_user created a profile
--     for EVERY new auth user → any invited portal client became staff under RLS.
--   * auth_role() fell back to 'staff' when no profile row existed.
--   * authenticated had table-wide UPDATE on profiles + an "update own row"
--     policy → any signed-in user could set their own role to admin.

-- 1. New users are clients unless staff promotes them
alter table public.profiles alter column role set default 'client';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          'client')
  on conflict (id) do nothing;
  return new;
end $$;

-- 2. Unknown/missing profile must never imply staff
create or replace function public.auth_role()
returns user_role
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce(
    (select role from profiles where id = auth.uid()),
    'client'::user_role
  );
$$;

-- 3. Column-level lockdown: signed-in users may edit their own name only,
--    never their role. anon gets nothing.
revoke all on table public.profiles from anon;
revoke insert, update, delete on table public.profiles from authenticated;
grant update (full_name) on table public.profiles to authenticated;

-- 4. Clients shouldn't enumerate staff profiles
drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles read own or staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or is_staff());
