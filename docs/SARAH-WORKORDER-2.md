# Sarah Work Order #2 — Portal feature UIs

All schemas below are **already live** (migrations `0011`–`0015` applied + RLS verified). Your job is the `src/` side only. Don't touch `supabase/` or change the column shapes — mirror the types exactly. Every table is RLS-scoped to the client's org, so a plain authenticated query returns only their rows; filter `deleted_at is null` and order as noted. Reuse existing patterns: `@/lib/supabase/server`, the data fns in `@/lib/data/portal.ts`, and the document upload flow in `@/components/portal/upload-area.tsx` + `uploadDocuments` action.

Build in this order. Add the listed types to `src/lib/types.ts`; add data fns to `src/lib/data/portal.ts`.

## 1. Workflow UI  (tables: workflow_templates, workflow_task_templates, job_tasks)  — `E5`
- Types: `WorkflowTemplate {id,tenant_id,key,name,service_type,active,created_at,updated_at}`, `WorkflowTaskTemplate {id,template_id,stage,title,owner,automation_level,sort_order}`, `JobTask {id,job_id,tenant_id,org_id,stage,title,owner:'client'|'bookkeeper'|'ai',status:'pending'|'in_progress'|'blocked'|'done',due_at,rag,automation_level,sort_order,completed_at,created_at,updated_at}`.
- Staff (CRM): on a job, a "Start workflow" action that calls the RPC `instantiate_workflow(job_id, 'monthly_bookkeeping')` (via `supabase.rpc`), then a task list grouped by `stage` with a status toggle (update `job_tasks.status` / `completed_at`).
- Client (portal): on `/portal`, show the job's `job_tasks` grouped by stage with the client-facing status; highlight tasks where `owner='client'`.
- The Monthly Bookkeeping template (13 tasks) is already seeded.

## 2. VAT Centre  (table: vat_periods)  — `E6-1`
- Type: `VatPeriod {id,tenant_id,org_id,job_id,period_start,period_end,status:'open'|'under_review'|'awaiting_approval'|'submitted'|'closed',estimated_due,submission_due,submitted_at,hmrc_reference,created_at,updated_at,deleted_at}`.
- Portal page `/portal/vat`: current-period card (status badge + estimated_due + period range), key dates (submission_due, submitted_at), previous-returns table (status in submitted/closed, show hmrc_reference). Query `vat_periods` order by `period_end desc`.

## 3. CIS Centre  (tables: subcontractors, cis_records)  — `E7-1`
- Types: `Subcontractor {id,tenant_id,org_id,name,utr,verification_number,cis_rate,contact_email,contact_phone,status,created_at,updated_at,deleted_at}`, `CisRecord {id,tenant_id,org_id,subcontractor_id,period_month,period_year,suffered,deducted,statement_document_id,created_at,updated_at,deleted_at}`.
- Portal page `/portal/cis`: totals (sum suffered vs deducted), statements panel (months where `statement_document_id` is null = "missing", set = "uploaded"), registered subbies list (active, show name/UTR/verification/rate).

## 4. Messaging  (table: messages)  — `E9-1`
- Type: `Message {id,tenant_id,org_id,job_id,sender_user_id,sender_role:'client'|'staff',body,read_at,created_at}`.
- Portal `/portal/messages`: thread ordered by `created_at asc`, aligned by `sender_role`; composer inserts `{org_id: <their org>, body, sender_role:'client', sender_user_id: <auth.uid()>}`. RLS rejects anything else — the insert **must** set `sender_role:'client'` and `sender_user_id` to the logged-in user or it fails. (Org comes from their `portal_users` row; fetch via `getPortalUser`.)

## 5. Onboarding  (tables: onboarding, aml_checks)  — `E1`
- Types: `Onboarding {id,tenant_id,org_id,status:'started'|'questionnaire_complete'|'id_uploaded'|'review'|'complete',questionnaire:{utr?,vat_no?,company_no?,business_details?}&Record<string,unknown>,completed_at,created_at,updated_at}`, `AmlCheck {...}` (staff app only).
- Portal `/portal/onboarding`: questionnaire form (writes `questionnaire`, sets status `questionnaire_complete`), ID upload step (reuse upload flow, advance to `id_uploaded`), read-only status checklist. Client can SELECT + UPDATE their own `onboarding` row (RLS allows it).
- **AML is staff-only** — `aml_checks` has no client read policy. Build any AML review UI in the CRM, never the portal.

## Run / verify (your local loop)
`npm run typecheck` after adding types; `npm run dev` to click through. When ready, `supabase db push` is a no-op (these migrations are already applied to the shared dev DB) but keeps other envs in sync.
