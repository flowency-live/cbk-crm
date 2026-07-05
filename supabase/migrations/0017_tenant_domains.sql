-- ============================================================
-- 0017_tenant_domains.sql
-- Add domain column to tenants for hostname-based brand resolution.
-- Each portal domain maps to a tenant; the portal layout reads
-- the Host header and fetches the matching tenant.
-- ============================================================

-- Add domain column (unique, nullable for backwards compat)
alter table tenants add column if not exists domain text unique;

-- Update Hi-Vis tenant with domain and correct brand colors from website
update tenants set
  domain = 'hivisbooks.co.uk',
  theme = jsonb_build_object(
    'logo_url',    '/brand/hi-vis/logo.png',
    'primary',     '#E3A22E',   -- mustard yellow from hvbk-website
    'ink',         '#23262b',   -- ink from hvbk-website
    'accent',      '#2F8A7B',   -- teal from hvbk-website
    'secondary',   '#A88BBA',   -- lilac from hvbk-website
    'portal_name', 'The Hi Vis Bookkeeper'
  )
where slug = 'hi-vis';

-- Insert Cheshire Bookkeeping tenant
insert into tenants (id, slug, name, domain, theme, support_email)
values (
  'a0000000-0000-4000-8000-000000000002',
  'cheshire',
  'Cheshire Bookkeeping',
  'cheshirebookkeeping.co.uk',
  jsonb_build_object(
    'logo_url',    '/brand/cheshire/logo.png',
    'primary',     '#5FC2B4',   -- teal from CRM login
    'ink',         '#1C1C1C',   -- ink from CRM login
    'accent',      '#C3A9DE',   -- lilac from CRM login
    'portal_name', 'Cheshire Bookkeeping Client Portal'
  ),
  'hello@cheshirebookkeeping.co.uk'
)
on conflict (slug) do update set
  domain = excluded.domain,
  theme = excluded.theme,
  support_email = excluded.support_email;

-- Create index for domain lookups
create index if not exists idx_tenant_domain on tenants (domain);
