-- ============================================================
-- 0009_tenants_public_read.sql
-- The portal login screen is unauthenticated but needs brand tokens
-- (logo, palette, name) to theme itself. Branding is not sensitive, so
-- allow anon to read tenants too.
-- ============================================================
drop policy if exists "read tenants" on tenants;
create policy "read tenants" on tenants
  for select to anon, authenticated using (true);
