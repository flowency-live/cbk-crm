-- ============================================================
-- 0004_backlog.sql
-- Platform backlog (Hi-Vis delivery platform & client portal),
-- shown as a board inside the CRM at /backlog.
-- ============================================================

create table if not exists backlog_items (
  id uuid primary key default gen_random_uuid(),
  ref text,
  epic text not null,
  title text not null,
  description text,
  priority text not null default 'should',   -- must | should | could | wont
  phase text not null default 'phase_1',     -- phase_1 | phase_2 | phase_3
  status text not null default 'backlog',    -- backlog | planned | in_progress | done
  automation text,                           -- none | assisted | autonomous | human_gate
  effort text,                               -- S | M | L | XL
  impact text,                               -- low | med | high
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_backlog_updated on backlog_items;
create trigger trg_backlog_updated before update on backlog_items
  for each row execute function set_updated_at();

alter table backlog_items enable row level security;

drop policy if exists "read backlog_items" on backlog_items;
create policy "read backlog_items" on backlog_items
  for select to authenticated using (true);

drop policy if exists "staff write backlog_items" on backlog_items;
create policy "staff write backlog_items" on backlog_items
  for all to authenticated using (is_staff()) with check (is_staff());

-- Backlog content is seeded directly in Supabase (34 items) and managed in-app.
