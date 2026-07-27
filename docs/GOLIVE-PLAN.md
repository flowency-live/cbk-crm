# Go-Live Plan — Portal to Sarah (the customer)

**Date:** 3 July 2026 · **Author:** Claude (CTO) · **Working model change:** Claude now builds everything it can from here, including `src/`. The VSCode agent(s) get only deployment, local-run testing, and secret-pasting tasks. (Supersedes the old "Claude never touches src/" rule.)

## 1. Direct answers first

**"Remember me?" — yes, it's already the default.** Supabase sessions persist on the device: after the first magic link or OTP, the user stays signed in (tokens auto-refresh) until they sign out or clear their browser. No checkbox needed, nothing to build. A client signs in once on their phone and the portal just opens from then on. Only private-browsing or a cleared browser forces a fresh code/link — which is one tap.

**Best-practice auth for low-tech users (research-backed):** passwordless is correct, and your instinct on SMS OTP is right for this audience — trades clients live on their phones and a 6-digit text code is the pattern they know from their bank. Magic links are the simplest possible ("tap the link in your email") but depend on email deliverability and confuse people who open email on a different device than the browser. **MVP: offer exactly two options, phone code first, email link second.** Park Google/Apple (unconfigured buttons currently render as dead weight — they go behind an env flag). One session persists either way.

**"We should have built Node from the start" — we did.** The portal/CRM *is* a Node app (Next.js). Only the marketing website is static HTML. The inconsistency is a styling gap, not an architecture problem — the fix is porting the website's design system (fonts, palette, header, footer) into the portal shell so the subdomain feels like the same site. Later, if we ever want one deployment, the static pages can be folded into the Next app — the "Dorset model" already noted in the runbook. Not needed now.

## 2. What clients get at MVP (built already, verified in code)

From the PRD's Phase-1 outcome ("a client can be onboarded, upload records, see status, answer queries, approve VAT"):

- **Dashboard (E3):** job status in plain English, "what we need from you", their task list, RAG deadlines, month progress bar, recent documents.
- **Document upload (E2, manual-sort version):** drag-drop + phone camera, filed per month into a private bucket. (AI auto-sort/OCR is Phase 2.)
- **VAT approval (E6 basic):** current period, estimated due, one-tap approve — the legal client gate.
- **Reports (E8 storage-side):** download report packs Sarah uploads. (Xero auto-generation is Phase 2.)
- **Onboarding (E1 partial):** questionnaire + ID upload. (Veriphy + e-sign are the next phase; AML recorded manually by Sarah in the CRM's AML tab.)
- **Messaging (E9):** client side exists; staff side doesn't yet — included in this plan (C4) so it's not a black hole.
- **NEW in this plan — "My details":** view/edit their contact info (name, phone, email, preferred contact method). Didn't exist anywhere; small build.

**Sarah (COO) can already:** mark an org as a client, create a job, start one of 5 workflow templates, move statuses (client sees plain-English updates), upload reports, manage deadlines, record AML, and — the flow you asked for — open a client → Contacts tab → **Invite to portal** button → magic link sent. That IS the "Enable Portal" action; C2 below makes its state visible (enabled/pending/active).

## 3. The plan

### Phase A — Platform foundations (Jason, ~1–2 hrs, gates everything)
1. **Supabase Pro upgrade** — stops the free-tier auto-pause (the platform was found paused/DOWN on 3 Jul), adds daily backups. Non-negotiable before real clients.
2. **Resend**: create account, verify `hivisbooks.co.uk`, then (a) paste SMTP into Supabase → Auth → SMTP (magic-link deliverability), (b) set `RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFICATION_EMAIL` on Vercel (notifications).
3. **Twilio** (for SMS OTP): create account, buy a UK number / register sender, paste creds into Supabase → Auth → Providers → Phone.
4. **Supabase Auth URL config**: Site URL = `https://cbk-crm.vercel.app` (swap to portal subdomain later); allowlist `/auth/callback` on that host + localhost.
5. `NEXT_PUBLIC_SITE_URL=https://cbk-crm.vercel.app` on Vercel.

### Phase B — Auth UX rebuild (Claude, in `src/`)
1. **Login page rework**: two big, plain choices — "**Text me a sign-in code**" (phone, default tab) and "**Email me a sign-in link**". Google/Apple/password removed behind `NEXT_PUBLIC_AUTH_PROVIDERS` flag. Large inputs, no jargon, brand-styled (Phase C shell). Friendly failure copy ("That code didn't match — we've sent a fresh one").
2. **Invite flow upgrade**: when Sarah invites a client, create the auth user with **email AND phone** (from the contact record) so both channels work from day one; SMS OTP fails today for email-only invited users. Add phone-number capture/validation to the invite UI.
3. **Session**: confirm persistent session lands returning users straight on the dashboard (skip login screen entirely when already signed in — this is the "remember me" experience).

### Phase C — "Looks like the website" portal shell (Claude, in `src/`)
1. **Design tokens**: port the website's `:root` palette (yellow `#E3A22E`, teal-dark `#1E4D45`, ink, paper `#FBFAF8`, line), Inter + Permanent Marker fonts, `.btn-yellow` and blob/marker styles into the portal layout. Tokens stay tenant-driven (extend `tenants.theme`) so Cheshire reskins by config, structure shared.
2. **Header**: same header as the website — wordmark logo, same nav bar styling; portal nav items (Dashboard, Documents, VAT, Reports, My details, Sign out) rendered in the site's nav style. Mobile burger identical.
3. **Footer**: port the website footer (contact links, legal links, brand strip) so every portal page ends the way site pages do.
4. **Staff messages panel** on CRM company detail (thread view + reply) so client messages aren't a black hole. If time pressure bites, fallback = hide Messages from portal nav — but the panel is ~half a day.
5. **"My details" page**: view/edit contact name, phone, email (email change = re-verify), preferred contact method; writes to `contacts`, notifies staff of changes.
6. **Middleware role gate**: signed-in clients hitting CRM URLs → `/portal`.

### Phase D — Test → Sarah (Jason + VSCode agent + Claude)
1. Deploy rebuilt website (login modal fix is built, sitting undeployed) + deploy CBKCRM after Phases B/C. *(VSCode agent: `npm run typecheck`, local run, deploy.)*
2. **End-to-end test on HV Test Co** (never yet run): Jason invites `jason+hvtest@flowency.co.uk` (+ your mobile for SMS) → sign in by text code → walk every screen on a phone.
3. **Claude signs off RLS isolation** (test client sees only HV Test Co; no CRM).
4. **Sarah demo + handover**: 30-min walkthrough of the COO flow (enable portal → invite → job → status → reports → AML), then she onboards clients 1–5. Suggest client #1 solo for a week before the rest.

## 4. Sequencing & effort

A is independent and gates D (and B's SMS testing). B+C are my build (~2–3 working sessions). D is a day including the demo. **Critical path: A1/A2/A3 today → B/C build → deploy → test → Sarah.** Realistic: Sarah demo within a week.

## 5. Out of scope (explicitly parked)

Google/Apple sign-in, Veriphy integration (mock contract next phase), e-sign document pack (E1-5), Xero, AI agents, CIS data entry UI, Hi-Vis Helper, portal.hivisbooks.co.uk DNS (cosmetic; 15 min whenever — the shell makes the Vercel URL feel native meanwhile), Cheshire website.
