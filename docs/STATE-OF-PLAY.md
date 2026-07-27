# State of Play — CBKCRM Platform

**Date:** 2 July 2026 · **Author:** Claude (CTO) · Supersedes nothing — this is the "what needs doing where" map Jason asked for. Backlog board at `/backlog` remains the task tracker.

## 1. What exists, honestly

| Piece | State | Verdict |
|---|---|---|
| Database (Supabase) | 28 tables, RLS everywhere, multi-tenant, 20 migrations | **Sound.** Best part of the platform. |
| CRM (staff app) | Companies/contacts/activities/enquiries/backlog live and used (151 orgs) | Works; UX polish items on board (CRM-1..3). Reports page is a stub. |
| Portal (client app) | All routes built: dashboard, onboarding, VAT, CIS, messages, reports, passwordless login (magic link/Google/Apple/OTP) | Code quality is decent — the real problem was **no data**: every portal table was empty, so every screen rendered its empty state. That's why it felt unbuilt. Now seeded (see §3). |
| Veriphy / AML | Schema live (0017), work order written (`SARAH-WORKORDER-4-veriphy.md`), **zero integration code** | Blocked on Veriphy API docs. Build mock-first (§4). |
| Onboarding docs | 10 legacy docx analysed; portal has questionnaire + ID upload only | Missing: privacy consent, engagement letter + service agreement e-sign, £20 fee ack, PDF generation. This is E1-5. |
| Websites | hvbk-website live; login modal → portal.hivisbooks.co.uk (DNS not set up) | Cheshire-branded copy not started (WEB-1, phase 2). |
| Tests / CI | None | Accepted for now; RLS isolation test is the priority check. |

## 2. Security — found and fixed today (live DB + repo migrations 0018–0020)

1. **CRITICAL — every new signup became staff.** `profiles.role` defaulted to `'staff'`, the signup trigger created a profile for every auth user, and `auth_role()` fell back to `'staff'`. Any invited client had full CRM access across both tenants. **Fixed** (default + fallback now `client`).
2. **CRITICAL — role self-escalation.** Signed-in users had table-wide UPDATE on `profiles` + an "update own row" policy → anyone could set themselves `admin`. **Fixed** (column-level grant: `full_name` only).
3. Advisor warnings: search_paths pinned; `handle_new_user`/`auth_role`/`auth_org_id` no longer REST-callable by anon. Deferred: pg_trgm schema move, leaked-password toggle.

Jason + Sarah remain `staff`. Nothing user-visible changes.

## 3. How to test everything (no DNS needed)

**Rule (hard, after a near-miss on 2 Jul): no test data ever goes into a real client's org.** Paul Powell Plumbing is an active client — data briefly seeded there in error on 2 Jul was fully removed the same day (all affected tables verified back to prior state).

**The test rig — live since 2 Jul:**
1. **"HV Test Co Ltd (TEST — not a real client)"** exists under the hi-vis tenant, org id `f0000000-0000-4000-8000-000000000001` (fixed id for easy cleanup). Contact: Terry Tester.
2. Seeded against it: Monthly Bookkeeping job "June 2026" in `info_required` (13 workflow tasks, 3 done), onboarding at `started`, VAT period Apr–Jun `awaiting_approval` (£1,842.50 — exercises one-tap approval), VAT + CIS deadlines (one amber), and one staff message prefixed `[TEST]`.
3. **One manual step (Jason):** in the CRM, open HV Test Co Ltd → **Invite to portal** → `jason+hvtest@flowency.co.uk`. The magic link lands in your inbox; that login is the client-side test identity (the invite flow forces role `client`).
4. That login is also the **RLS isolation test** subject: it must see only HV Test Co — no other org, no CRM. Claude verifies once the invite has been accepted.
5. ~~Suspect `portal_users` mapping (Paul Powell Plumbing ↔ jason@flowency.co.uk)~~ — removed 2 Jul on Jason's instruction. Paul Powell Plumbing now has **no portal access**; when they're onboarded for real, invite their own email from the company page.

**URLs:**
- **Staff/CRM:** `https://cbk-crm.vercel.app` — dashboard, companies, enquiries, `/backlog`.
- **Client/portal:** `https://cbk-crm.vercel.app/portal` — with the test login above.
- **Local:** `npm run dev` in CBKCRM (`.env.local` already configured) → `localhost:3000` (CRM) and `localhost:3000/portal`. Tenant resolves to the default (hi-vis) on localhost.

## 4. What needs doing where

**Claude (platform lane — `supabase/`, DB, dashboard):**
1. ~~Hardening 0018–0020~~ done, files in repo.
2. E1-5 schema: `document_templates` + `client_documents` + signature capture columns (typed name, timestamp, IP, doc-version hash) — next up.
3. Veriphy **mock provider contract**: freeze the adapter interface + webhook payload shape now so Sarah builds against it; swap real Veriphy in when docs land.
4. RLS isolation test once a real test-client login exists.
5. Auth provider checklist handover (Google/Apple/Twilio/SMTP settings for Sarah to paste).

**Sarah (app lane — `src/`):**
1. **Commit the uncommitted work** (both 0017 migrations, tenant-domain code, brand assets are sitting untracked — the repo doesn't match prod).
2. Middleware role gate: signed-in non-staff hitting CRM routes → redirect `/portal` (data is safe via RLS since 0020, but the shell shouldn't render).
3. Onboarding steps: privacy consent → e-sign engagement letter + service agreement (merged from templates) → £20 fee acknowledgement → Veriphy step against my mock (work order 4 §4).
4. Staff AML panel on company detail (work order 4 §5) + PDF download/print buttons (manual path retained).
5. UX-1 polish pass once the above flows exist end-to-end.

**Jason:**
1. **Chase Veriphy for API docs + sandbox key** — the only external blocker.
2. Decide £20 AML fee collection: invoice vs in-portal card (card = payment provider scope).
3. Give me a test client email for the isolation test.
4. Later: DNS CNAME for portal.hivisbooks.co.uk per `docs/DOMAIN-SETUP.md` / go-live runbook. Not needed for testing.

## 5. Order of play

Test the seeded portal now (§3) → Sarah commits + role gate → I ship E1-5 schema + mock Veriphy contract → Sarah builds onboarding steps + AML panel → isolation test with real client login → UX pass → DNS + go-live runbook → first real Hi Vis client.
