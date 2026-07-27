# CTO Status Report — Portal MVP Go-Live

**Date:** 3 July 2026 · **Scope:** 3–5 clients logging in from hivisbooks.co.uk doing basic things; COO able to enable clients, send magic links, and see everything client-related in the backend.

## Headline

The software for this MVP is **~90% built and better than we thought**. What stands between us and first client login is not code — it's four operational items: paid database tier, invite email deliverability, one website deploy, and one end-to-end test that has never been run. Realistic runway: **days, not weeks**, if the checklist below gets actioned.

## Two incidents found today

1. **The platform was down this morning.** The Supabase project is on the Free tier, which auto-pauses after inactivity. Status was `INACTIVE` when I checked; I restored it (all data intact, verified — 152 orgs, both tenants, migrations, test rig). A database that goes to sleep cannot serve clients. **Upgrading to Supabase Pro (~$25/mo) is the single hard go-live blocker.** Pro also adds daily backups, which we currently don't have — unacceptable with real client data.
2. **The live website's Client Login was sending clients to the staff CRM.** The deployed HTML still carried the old username/password modal linking to `/login` (staff). The corrected passwordless partial existed in `src/` but was never rebuilt. I've rebuilt `public/` — verified: no password fields, links to `https://cbk-crm.vercel.app/portal`. **Needs redeploying** (one `vercel --prod` / git push on hvbk-website).

## What's DONE and verified (code + database)

**Client side (portal):** passwordless login page (magic link; Google/Apple/phone UI present but providers unconfigured); tenant-branded layout (Hi Vis yellow / Cheshire teal resolved by domain, no hard-coded brand); dashboard with plain-English job status, "what we need from you", task list, RAG deadlines, progress bar; document upload (desktop drag-drop + phone camera) into a private per-org storage bucket; VAT one-tap approval; reports download via signed URLs; onboarding questionnaire + ID upload; client messaging thread.

**COO side (CRM):** company detail with tabs — Jobs (create job, set status, start any of 5 workflow templates), Reports (upload for client), Deadlines (create/complete), AML panel (record check + cleared/rejected decision), Contacts with **one-click "Invite to portal"** per contact (creates the auth user, forces `client` role, links them to exactly their org, sends the magic link; idempotent on re-invite). Enquiries inbox from the website form. `/backlog` board.

**Platform:** multi-tenant model with RLS isolation on every table; the critical role-escalation holes fixed this week (0018–0020 — new signups can no longer become staff, roles can't be self-edited); both tenant domains seeded; test rig (HV Test Co Ltd) seeded with a full journey; email util env-gated and ready for Resend.

## What's NOT done (MVP-relevant gaps)

| # | Gap | Impact | Fix | Owner |
|---|---|---|---|---|
| 1 | **Supabase Free tier** (auto-pause, no backups) | Platform randomly down; no recovery | Upgrade to Pro | **Jason** (5 min + card) |
| 2 | **Auth email = Supabase built-in SMTP** — ~2–4 emails/hr rate limit, spam-prone, unbranded | Magic links may not arrive = clients can't log in | Resend account, verify `hivisbooks.co.uk`, paste SMTP into Supabase Auth settings; set `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_SITE_URL` on Vercel | **Jason** (~1 hr) |
| 3 | **Website redeploy** (rebuilt, not deployed) | Clients hit staff login | Deploy hvbk-website | **Jason/Sarah** (5 min) |
| 4 | **Invite → login → scoped view has NEVER been run end-to-end** (`portal_users` = 0) | Unknown unknowns on the critical path | COO invites `jason+hvtest@flowency.co.uk` on HV Test Co; walk the journey; I then run the RLS isolation test (must pass before any real client) | **Sarah/Jason → Claude** |
| 5 | Google/Apple/phone login buttons render but providers are unconfigured → dead buttons/errors | Confusing first impression | MVP: **magic link only** — hide the other buttons behind an env flag (tiny `src/` change). Configure OAuth post-MVP | **Sarah** (30 min) |
| 6 | Client messaging has no staff-side UI — clients can write, COO can't see/reply | Silent black hole | MVP: hide Messages from portal nav (tiny) **or** add a simple thread panel on company detail (half-day) | **Sarah** (choose) |
| 7 | Signed-in clients hitting CRM URLs see empty app shell (data safe via RLS, but ugly) | Cosmetic/professional | Middleware role gate → redirect to `/portal` | **Sarah** (30 min) |
| 8 | Supabase Auth redirect allowlist + Site URL unverified against `cbk-crm.vercel.app` | Magic links could redirect wrong | 2-min dashboard check alongside #2 | **Jason** |

**Explicitly NOT needed for this MVP:** portal.hivisbooks.co.uk DNS (site already links to the Vercel URL; do the CNAME later per `DOMAIN-SETUP.md`), Veriphy integration (record AML manually in the AML tab per legacy process), e-sign/document pack (E1-5, next phase), Xero, staff passwordless, Cheshire website.

## Day-one capability once the 8 items clear

**A client can:** log in passwordlessly from the website → see their job status in plain English → upload receipts/statements from their phone → see deadlines → approve their VAT return → download reports → complete the onboarding questionnaire.

**The COO can:** mark an organisation as a client → create their job and start the right workflow template → invite them to the portal in one click → see their uploads, progress the job, manage deadlines, upload reports → record the AML check and decision.

## Order of play

1. Jason: Supabase Pro (today — the platform is one quiet week away from pausing again).
2. Jason: Resend + SMTP + Vercel env vars; verify auth redirect list.
3. Deploy the rebuilt website.
4. Sarah: hide unconfigured login methods; hide-or-build messages; middleware gate.
5. Run the HV Test Co invite end-to-end; Claude signs off RLS isolation.
6. Onboard first real client (suggest starting with one, then the other 2–4).
