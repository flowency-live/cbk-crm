-- ============================================================
-- 0008_portal_harden.sql
-- auth_org_id() is SECURITY DEFINER (used inside RLS policies). It must not be
-- callable by anonymous users via the auto-exposed RPC endpoint. RLS evaluation
-- runs as `authenticated`, so keep EXECUTE for that role only.
-- ============================================================
revoke execute on function public.auth_org_id() from anon, public;
grant execute on function public.auth_org_id() to authenticated;
