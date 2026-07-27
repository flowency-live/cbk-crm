# Deploy Work Order — Portal MVP (3 Jul 2026)

**For:** VSCode agent (deployment + local verification only — all app code is already written).
**Context:** `docs/GOLIVE-PLAN.md`. Do not modify feature code; if typecheck/lint fails, fix only the reported error minimally.

## 1. Verify locally (CBKCRM)

```bash
npm run typecheck   # must pass clean
npm run lint        # must pass (warnings acceptable)
npm run dev         # then click through:
```

- `http://localhost:3000/portal/login` — new sign-in: "Text me a code" (default) / "Email me a link"; no Google/Apple buttons; website fonts/branding, brushbar top, site-style footer.
- `http://localhost:3000/portal` (signed in) — website-style header with nav: Home / Reports / VAT / CIS / Messages / Setup / My details + yellow Sign out.
- `http://localhost:3000/portal/details` — My details form.
- CRM `http://localhost:3000/companies/<any client>` — new **Messages** tab; Contacts tab shows **Enable Portal** button (renamed) and "Portal enabled" badge for linked contacts.

## 2. What changed (for the commit)

- NEW: `src/app/(portal)/portal.css`, `src/components/portal/portal-header.tsx`, `portal-footer.tsx`, `my-details-form.tsx`, `src/app/(portal)/portal/details/page.tsx`, `src/lib/actions/details.ts`, `public/brand/hi-vis/{logo-wordmark,footer-logo,logo-circle}.png`, migrations `0018`–`0021`, docs.
- MODIFIED: `(portal)/layout.tsx` (website-look shell), `portal/login/page.tsx` (SMS-first passwordless), `lib/actions/portal.ts` (invite registers phone for SMS sign-in), `components/companies/company-detail.tsx` (Messages tab, Enable Portal + badge), `lib/data/companies.ts` (messages + portal users), `companies/[id]/page.tsx`, `lib/supabase/middleware.ts` (client role gate).
- `src/components/portal/portal-nav.tsx` is now unused — delete it in the same commit.
- Also commit the previously untracked files (`0017_*.sql`, brand assets, tenant-domain code).

Suggested message: `feat: website-look portal shell, SMS-first passwordless login, Enable Portal + staff messages, My details (migrations 0018-0021 already applied to live DB)`

## 3. Deploy

1. **CBKCRM:** push to main → Vercel deploy. Do NOT run `supabase db push` — migrations 0018–0021 are already applied to the live DB; the files are the record.
2. **hvbk-website:** `public/` is already rebuilt (passwordless login modal → `https://cbk-crm.vercel.app/portal`). Deploy as usual.

## 4. Env vars needed on Vercel (Jason holds the values)

`NEXT_PUBLIC_SITE_URL=https://cbk-crm.vercel.app`, `RESEND_API_KEY`, `EMAIL_FROM=noreply@hivisbooks.co.uk`, `STAFF_NOTIFICATION_EMAIL=hello@hivisbooks.co.uk`. (`NEXT_PUBLIC_AUTH_PROVIDERS` stays unset — that keeps Google/Apple hidden.)

## 5. Blocked on Jason (dashboard/account work — not this work order)

Supabase Pro upgrade; Resend SMTP into Supabase Auth; Twilio into Supabase Phone provider; Auth Site URL + redirect allowlist. SMS sign-in will error until Twilio is connected — expected.
