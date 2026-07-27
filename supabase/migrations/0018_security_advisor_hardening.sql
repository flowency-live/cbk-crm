-- 0018: fix security advisor warnings (applied to live 2 Jul 2026 via MCP)
-- 1. Pin search_path on functions flagged as mutable
alter function public.set_updated_at() set search_path = public;
alter function public.is_staff() set search_path = public;
alter function public.search_companies(text) set search_path = public;

-- 2. handle_new_user is a trigger function (auth.users trigger) — must never be
--    callable via the REST RPC surface
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3. auth_role() is used inside RLS policies for signed-in users only;
--    anon has no business calling it
revoke execute on function public.auth_role() from anon;
