-- 0021: let a portal client edit their own contact record (My details page)
-- (applied to live 3 Jul 2026 via MCP)
create or replace function public.auth_contact_id()
returns uuid
language sql
stable security definer
set search_path to 'public'
as $$
  select contact_id from portal_users where auth_user_id = auth.uid() limit 1;
$$;
revoke execute on function public.auth_contact_id() from public, anon;
grant execute on function public.auth_contact_id() to authenticated, service_role;

create policy "client update own contact" on public.contacts
  for update to authenticated
  using (id = auth_contact_id())
  with check (id = auth_contact_id() and org_id = auth_org_id());
