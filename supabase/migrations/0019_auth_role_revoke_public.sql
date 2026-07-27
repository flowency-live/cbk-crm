-- 0019: auth_role had EXECUTE via PUBLIC; revoke and grant only what RLS needs
-- (applied to live 2 Jul 2026 via MCP)
revoke execute on function public.auth_role() from public, anon;
grant execute on function public.auth_role() to authenticated, service_role;

-- same defence-in-depth for auth_org_id (RLS helper, signed-in only)
revoke execute on function public.auth_org_id() from public, anon;
grant execute on function public.auth_org_id() to authenticated, service_role;
