# Hi-Vis Client Portal — Day-One Work Order (codebase agent)

**For:** Sarah Builder (the VSCode coding agent working in `CBKCRM`).
**From:** CTO (Claude).
**Scope:** the deliberately slim **day-one** portal only. If a feature isn't listed in §4, it's out of scope — do not build it.
**Read first:** `docs/PRD-Hi-Vis-Platform.md` (background), and the live backlog board in-app at `/backlog` (items marked `planned` = this work order).

---

## 1. What you're building (one paragraph)

A **client-facing portal** that is a new view on this same app + Supabase backend — *not* a separate project. A client gets a branded, passwordless login from their brand's website, lands on a slim dashboard that shows "what we need from you" and the status of their bookkeeping job, can upload documents, and gets emailed when we need records or when they've uploaded. Staff drive the job status manually from the existing CRM. No AI, no Xero, no automation on day one.

**Hard architectural rule — multi-tenant from the start.** Cheshire Bookkeeping is the parent practice; brands (Hi-Vis is tenant #1, Cheshire + others come later) sit beneath it. **Never hard-code "Hi-Vis."** Every client-facing table carries `tenant_id`; all branding (logo, palette, copy, support email) is resolved from the tenant record. A second brand must be a config + theme job, not a code change.

---

## 2. Workstream split — who owns what

| The CTO (Claude, outside the repo) provides | You (this repo) own |
|---|---|
| Supabase **Auth provider config**: enable Email magic link/OTP, Google, Apple, Phone OTP; Site URL + per-brand redirect URLs | The `/portal` route group, login UI, and all client-facing React/Next code |
| The **data-model + RLS design** (in §3) and review of your migrations against the live DB | Writing the actual migration files in `supabase/migrations/` and `supabase db push` |
| **Storage** bucket creation + policy review | The upload component + server action that writes to the bucket |
| The **tenant theme-token contract** (§3.4) | Consuming theme tokens to render branding |
| Security review of portal RLS **before** any real client data goes in | Server actions, middleware, email wiring, tests |
| Backlog grooming + acceptance sign-off | Opening a PR per task; keeping changes scoped |

**You author all SQL as repo migrations** (house rule: schema lives in `supabase/migrations`, never click-edited in prod). The CTO will review and verify isolation against the live project, but the migration files are yours.

**Inputs the CTO still owes you** (don't block T1/T4/T6 on these; they only gate the OAuth/email tasks): Google OAuth client id+secret, Apple Services ID/key/team id, SMS provider (likely Twilio) creds, transactional email provider (likely Resend) + verified domain, and the confirmed Hi-Vis tenant slug + theme values. Stub these behind env vars and the providers will light up when the CTO sets them.

---

## 3. Contracts to build against

Mirror existing conventions in `0001_init.sql` / `0002_rls.sql`: UUID PKs, `created_at/updated_at` (trigger `set_updated_at`), soft-delete via `deleted_at`, RLS enabled on every table, reuse the `auth_role()` / `is_staff()` helpers.

### 3.1 New tables (target shape — refine in migration)

- **`tenants`** — `id, slug (unique), name, theme jsonb, support_email, status, created_at`. Seed one row for Hi-Vis.
- **`organizations`** — add `tenant_id uuid references tenants` (nullable for now; backfill existing rows to the Hi-Vis tenant).
- **`portal_users`** — `id, auth_user_id uuid references auth.users, org_id references organizations, tenant_id references tenants, contact_id references contacts null, created_at`. Links a logged-in client to exactly one org + tenant.
- **`jobs`** — `id, tenant_id, org_id, title, service_type text, status job_status, period_label text, created_at, updated_at, deleted_at`. The minimal "job" staff move through statuses.
- **`documents`** — `id, tenant_id, org_id, job_id null, uploaded_by uuid, file_name, storage_path, period_month int, period_year int, status text default 'received', created_at, deleted_at`.

### 3.2 Status enum (`job_status`) — keep BOTH review states

```
submitted | under_review | in_progress | info_required | ready_for_review | ready_for_approval | completed
```

> `ready_for_review` (report ready, no action) is deliberately **distinct** from `ready_for_approval` (needs client sign-off). This is a confirmed product decision — keep both even though the PRD once collapsed them.

### 3.3 Status label map (render by audience)

| Enum | Dot | Client label | Client sub-text | Internal (crew) label |
|---|---|---|---|---|
| `submitted` | 🟢 | Submitted | We've received it. | Submitted by client — on the site board |
| `under_review` | 🟡 | Under Review | Our crew is working on it. | Under Review — checking it in the site office |
| `in_progress` | 🚧 | In Progress | Currently being processed. | In Progress — active site work |
| `info_required` | 🔴 | Information Required | We need something from you. | Information Required — halted on site |
| `ready_for_review` | 🟣 | Ready for Review | Your report is ready to view. | Reports ready — no sign-off needed |
| `ready_for_approval` | 🔵 | Ready for Approval | Waiting for your sign-off. | Ready for Approval — site inspection ready |
| `completed` | ✅ | Completed | Job done. | Completed — signed off & filed |

### 3.4 Tenant theme-token contract (`tenants.theme` jsonb)

```json
{ "logo_url": "", "primary": "#FACC15", "ink": "#1C1C1C", "accent": "#3FA89B",
  "portal_name": "The Hi Vis Bookkeeper", "support_email": "hello@hivisbooks.co.uk" }
```
Resolve the tenant from the login route/sub-domain; pass tokens to the portal layout. No brand string literals in components.

### 3.5 RLS intent

- `client` role: SELECT/INSERT only rows whose `org_id` matches their `portal_users.org_id` **and** `tenant_id` matches. No cross-org, no cross-tenant, ever.
- `staff`/`admin`: full access within their tenant (reuse `is_staff()`).
- `service_role`: server-side only (invites, email). Never in the browser bundle.
- Add a helper e.g. `auth_org_id()` (security-definer, like `auth_role()`) returning the caller's `portal_users.org_id`.

---

## 4. Tasks (day-one only)

Each task = one PR. Acceptance criteria are the definition of done. Backlog refs in brackets.

**T1 — Tenant foundation** `[TEN-1]`
Migration `0006_tenants.sql`: `tenants` table + `set_updated_at` trigger + RLS; add `tenant_id` to `organizations`; seed the Hi-Vis tenant; backfill existing orgs to it.
*AC:* Hi-Vis tenant row exists; every organization has a `tenant_id`; no brand string is hard-coded.

**T2 — Portal core schema + RLS** `[TEN-1/WF-0/E2-1]`
Migration `0007_portal_core.sql`: `job_status` enum (§3.2), `portal_users`, `jobs`, `documents`, the `auth_org_id()` helper, and RLS per §3.5.
*AC:* a `client` JWT can read only its own org+tenant rows; a second test org's rows are invisible. Verify with two seed clients.

**T3 — `/portal` route group + passwordless login** `[F-1, AUTH-1]`
New `src/app/(portal)/` group with its own layout (themed from tenant). Login page modelled on `src/app/(auth)/login/page.tsx` but **passwordless**: magic link (`signInWithOtp`), Google + Apple (`signInWithOAuth`), phone OTP (`signInWithOtp({ phone })`). Reuse `src/app/auth/callback/route.ts`. Extend `src/middleware.ts` so `/portal/*` requires an authenticated `client`; staff CRM routes stay separate.
*AC:* a client logs in via each enabled method and lands on `/portal`; an un-provisioned email is rejected; clients can't reach `/dashboard` (CRM) and staff aren't forced through the portal.

**T4 — Admin "Invite to portal"** `[AUTH-2]`
Server action (service-role, server-only) + a button on the company/contact detail in the CRM. Creates a `portal_users` row (tenant-scoped, linked org) and sends a magic invite (`auth.admin.inviteUserByEmail` or `generateLink`). Must be one click — these clients are non-technical.
*AC:* staff click Invite → client receives a link → first click creates their session + `portal_user`; re-invite is idempotent.

**T5 — Document upload** `[E2-1]`
Private Supabase Storage bucket `client-documents` (CTO will confirm/secure policies). Upload UI in `/portal`: drag-drop **and** mobile capture (`<input type="file" accept="image/*,application/pdf" capture>`). Each file → object at `tenant/{tenant_id}/org/{org_id}/{year}/{month}/...` + a `documents` row tagged month/year. **No OCR, no AI, no auto-classification.**
*AC:* client uploads from desktop and phone; file lands in the private bucket at the right path; it shows in their document list; another org can't list it.

**T6 — Minimal job + manual status** `[WF-0, E5-9]`
Staff (CRM side) can create a `job` for a client and change its status through the `job_status` values. Build the shared status label map (§3.3) once and reuse. Client portal shows the current **client-facing** label + sub-text; CRM shows the **internal** label.
*AC:* staff move a job's status; the client's portal reflects the new plain-English status on next load.

**T7 — Slim client dashboard** `[E3-1]`
`/portal` home: business name, current job status, a "What we need from you" panel (any `info_required` job + an upload prompt), and recent documents. Scoped to the client's org via RLS.
*AC:* renders only the logged-in client's data; shows an actionable prompt when status is `info_required`.

**T8 — Email notifications** `[F-2]`
Transactional email on (a) records requested / status → `info_required` (to client) and (b) document uploaded (to staff). Use the provider the CTO wires (env-gated); a thin server util or edge function is fine.
*AC:* both emails fire with correct recipient + link back to the portal; no-op cleanly if the provider env is unset.

**Dependency order:** T1 → T2 → {T5, T6, T7}; T3 → T4; T3 gates all portal UI. T8 last.

---

## 5. Explicitly OUT of scope (do not build)

AI agents (sorting, chasing, OCR, coding, commentary), Xero/any ledger integration, AML/KYC automation, e-signature, VAT Centre, CIS Centre, in-portal messaging thread, the full workflow engine (templates/instances/dependencies), reporting library, SMS, native mobile app, sales invoicing. These are later phases on the board — leave them alone.

---

## 6. Ground rules

- Migrations in `supabase/migrations/` only; never edit prod schema by hand.
- `tenant_id` on every client-facing table; RLS on by default; deny-by-default for `client`.
- Passwordless only — no password fields anywhere in the portal.
- Service-role key server-side only; browser uses anon key + user JWT.
- Keep PRs small and scoped to one task; don't gold-plate or pull scope forward.
- Reuse existing patterns (`auth_role`, `is_staff`, server actions in `src/lib/actions`, data fns in `src/lib/data`).

---

## 7. Definition of done / handoff back to CTO

A task is done when its AC pass and the PR is open. Hand back to the CTO for: RLS/security review before real client data is loaded, Auth provider enablement (Google/Apple/phone/email), storage policy sign-off, and acceptance against the `planned` backlog items. Flag any contract in §3 you think should change rather than silently diverging.
