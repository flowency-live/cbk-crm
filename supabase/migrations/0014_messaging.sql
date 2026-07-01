-- ============================================================
-- 0014_messaging.sql
-- Secure in-portal messaging. One thread per org (optionally
-- tied to a job). Messages are immutable: no updated_at, no
-- update trigger. Clients post as their own org; staff manage all.
-- ============================================================

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id),
  org_id          uuid not null references organizations(id) on delete cascade,
  job_id          uuid references jobs(id) on delete set null,
  sender_user_id  uuid references auth.users(id),
  sender_role     text not null check (sender_role in ('client', 'staff')),
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists idx_messages_org_created on messages (org_id, created_at);

alter table messages enable row level security;

drop policy if exists "client read own messages" on messages;
create policy "client read own messages" on messages
  for select to authenticated
  using (is_staff() or org_id = auth_org_id());

drop policy if exists "client insert own messages" on messages;
create policy "client insert own messages" on messages
  for insert to authenticated
  with check (
    org_id = auth_org_id()
    and sender_user_id = auth.uid()
    and sender_role = 'client'
  );

drop policy if exists "staff write messages" on messages;
create policy "staff write messages" on messages
  for all to authenticated using (is_staff()) with check (is_staff());
