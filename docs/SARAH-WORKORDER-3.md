# Sarah Work Order #3 — Reports, Deadlines, AML decision

Schemas live (migration `0016` applied + RLS). Same rules as WO2: `src/` only, mirror the types, every table is RLS-scoped to the client's org. Add types to `src/lib/types.ts`, data fns to `src/lib/data/portal.ts`.

## 1. Reports Library  (table: reports)  — `E11/E8`
- Type: `Report {id,tenant_id,org_id,job_id,period_label,type:'management'|'profit_loss'|'balance_sheet'|'cash_flow'|'year_end'|'custom',title,storage_path,ai_commentary,created_at,updated_at,deleted_at}`.
- Portal page `/portal/reports`: list the client's reports (newest first), grouped by `period_label` or `type`; each row downloads via a signed URL from the existing **`client-documents`** bucket using `storage_path`; show `ai_commentary` in an expandable note when present.
- Staff (CRM): "Add report" on a client — upload a file to `client-documents` at `{org_id}/reports/{uuid}-{name}` and insert a `reports` row. Reuse the existing upload pattern.
- Add `Reports` to `PortalNav`.

## 2. Deadline Tracker  (table: deadlines)  — `E20/E5-3`
- Type: `Deadline {id,tenant_id,org_id,kind:'vat'|'cis'|'payroll'|'accounts'|'self_assessment'|'confirmation_statement'|'other',title,due_date,completed,created_at,updated_at,deleted_at}`.
- Portal: add an "Upcoming deadlines" panel to `/portal` (the home dashboard) listing the client's deadlines ordered by `due_date`. Compute RAG in the UI: `completed` → green/done; past `due_date` → red (overdue); within 14 days → amber; else neutral.
- Staff (CRM): manage deadlines per client (create/complete). Note `organizations.accounts_next_due` and `confirmation_next_due` already exist — you can surface those alongside, or seed `deadlines` rows from them.

## 3. AML decision  (table: aml_checks — STAFF ONLY)  — `E1-2`
- Type: `AmlCheck {id,tenant_id,org_id,provider,reference,result,evidence_url,decision:'pending'|'cleared'|'rejected'|null,decided_by,decided_at,created_at,updated_at}`.
- CRM-only AML panel on the client/company detail: record provider + reference + result + evidence_url, and a decision action that sets `decision` + `decided_by` (auth.uid()) + `decided_at`. **Never expose `aml_checks` in the portal** — it has no client RLS policy by design.

## Workflow templates now available (for the "Start Workflow" picker)
`instantiate_workflow(job_id, key)` accepts any of: `monthly_bookkeeping` (13 tasks), `vat` (12), `cleanup` (17), `cis_registration` (11), `cis_compliance` (14). Let staff pick the template by name when starting a workflow on a job.

## Run / verify
`npm run typecheck`, `npm run dev`, click through. `supabase db push` is a no-op on the shared dev DB (already applied) but syncs other envs.
