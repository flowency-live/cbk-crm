-- ============================================================
-- 0011_workflow_engine.sql
-- Workflow engine. Reuses the existing `jobs` table as the per-client/period
-- INSTANCE (it already has tenant_id, org_id, status, period_label). Adds:
--   workflow_templates       — authored service templates (Bookkeeping, VAT, CIS…)
--   workflow_task_templates  — the ordered stage/tasks within a template
--   job_tasks                — the live tasks for a job, instantiated from a template
-- Design note: we do NOT introduce a separate workflow_instances table — that
-- would duplicate `jobs`, which day-one already uses. A job IS the instance.
-- ============================================================

create table if not exists workflow_templates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id),          -- null = global/default template
  key           text not null unique,                 -- 'monthly_bookkeeping' | 'vat' | 'cis_registration' …
  name          text not null,
  service_type  text,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
drop trigger if exists trg_wf_templates_updated on workflow_templates;
create trigger trg_wf_templates_updated before update on workflow_templates
  for each row execute function set_updated_at();

create table if not exists workflow_task_templates (
  id               uuid primary key default gen_random_uuid(),
  template_id      uuid not null references workflow_templates(id) on delete cascade,
  stage            text not null,
  title            text not null,
  owner            text not null default 'bookkeeper' check (owner in ('client','bookkeeper','ai')),
  automation_level text check (automation_level in ('none','assisted','autonomous','human_gate')),
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_wf_task_templates_template on workflow_task_templates (template_id);

create table if not exists job_tasks (
  id               uuid primary key default gen_random_uuid(),
  job_id           uuid not null references jobs(id) on delete cascade,
  tenant_id        uuid not null references tenants(id),
  org_id           uuid not null references organizations(id) on delete cascade,
  stage            text,
  title            text not null,
  owner            text not null default 'bookkeeper' check (owner in ('client','bookkeeper','ai')),
  status           text not null default 'pending' check (status in ('pending','in_progress','blocked','done')),
  due_at           timestamptz,
  rag              text check (rag in ('green','amber','red')),
  automation_level text,
  sort_order       int not null default 0,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
drop trigger if exists trg_job_tasks_updated on job_tasks;
create trigger trg_job_tasks_updated before update on job_tasks
  for each row execute function set_updated_at();
create index if not exists idx_job_tasks_job on job_tasks (job_id);
create index if not exists idx_job_tasks_org on job_tasks (org_id);

-- ---------- RLS ----------
alter table workflow_templates      enable row level security;
alter table workflow_task_templates enable row level security;
alter table job_tasks               enable row level security;

-- Templates: readable by any authenticated user (names/stages aren't sensitive); staff write.
drop policy if exists "read workflow_templates" on workflow_templates;
create policy "read workflow_templates" on workflow_templates
  for select to authenticated using (true);
drop policy if exists "staff write workflow_templates" on workflow_templates;
create policy "staff write workflow_templates" on workflow_templates
  for all to authenticated using (is_staff()) with check (is_staff());

drop policy if exists "read workflow_task_templates" on workflow_task_templates;
create policy "read workflow_task_templates" on workflow_task_templates
  for select to authenticated using (true);
drop policy if exists "staff write workflow_task_templates" on workflow_task_templates;
create policy "staff write workflow_task_templates" on workflow_task_templates
  for all to authenticated using (is_staff()) with check (is_staff());

-- Job tasks: client reads only their org's tasks; staff manage all.
drop policy if exists "client read own job_tasks" on job_tasks;
create policy "client read own job_tasks" on job_tasks
  for select to authenticated using (is_staff() or org_id = auth_org_id());
drop policy if exists "staff write job_tasks" on job_tasks;
create policy "staff write job_tasks" on job_tasks
  for all to authenticated using (is_staff()) with check (is_staff());

-- ---------- Instantiate a template onto a job ----------
-- Copies a template's task_templates into job_tasks for the given job.
-- SECURITY DEFINER + staff check so it can be called from a staff server action.
create or replace function instantiate_workflow(p_job_id uuid, p_template_key text)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_job   jobs%rowtype;
  v_tmpl  workflow_templates%rowtype;
  v_count int;
begin
  if not is_staff() then
    raise exception 'staff only';
  end if;
  select * into v_job from jobs where id = p_job_id;
  if not found then raise exception 'job not found'; end if;
  select * into v_tmpl from workflow_templates where key = p_template_key and active;
  if not found then raise exception 'template not found'; end if;

  insert into job_tasks (job_id, tenant_id, org_id, stage, title, owner, automation_level, sort_order)
  select v_job.id, v_job.tenant_id, v_job.org_id, t.stage, t.title, t.owner, t.automation_level, t.sort_order
  from workflow_task_templates t
  where t.template_id = v_tmpl.id
  order by t.sort_order;

  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke execute on function public.instantiate_workflow(uuid, text) from anon, public;
grant execute on function public.instantiate_workflow(uuid, text) to authenticated;
