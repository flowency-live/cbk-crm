# Cheshire Bookkeeping CRM

A search-first CRM for Cheshire Bookkeeping — Next.js + Supabase, with Companies House
auto-population, light/dark themes, and a record-level data layer that Claude, ChatGPT and
marketing agents can all read and write.

> **Runs out of the box in demo mode.** With no environment variables set, the app serves
> built-in Cheshire demo data so you can click through everything immediately. Add the
> Supabase + Companies House keys to switch to live data.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in when ready (optional for demo)
npm run dev
# open http://localhost:3000
```

## Try it (demo mode, no keys needed)

- **Search** — top bar or `⌘K` / `Ctrl-K` for the command palette (companies + contacts).
- **Filter** — status + sector chips, free-text box on the Companies list.
- **Detail** — click any row → Overview / Contacts / Companies House / Activities / Notes.
- **Add company** — "Add company" → *Companies House lookup* tab, type `prestbury`,
  `frodsham`, or `tarporley` to see the auto-fill flow (mock data until a CH key is set).
- **Theme** — sun/moon toggle, top right.

## Going live

### 1. Supabase  🔑

Create a project at [supabase.com](https://supabase.com), then in **Settings → API** copy:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server-only
```

Apply the schema (either option):

- **Supabase CLI:** `supabase link --project-ref <ref>` then `supabase db push`
- **SQL editor:** paste `supabase/migrations/0001_init.sql`, then `0002_rls.sql`, then
  (optional demo data) `0003_seed.sql`, in order.

### 2. Companies House  🔑

Free key from
[developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/).
Create an application, generate a **REST / Public Data API key**, then:

```
COMPANIES_HOUSE_API_KEY=...
```

All CH calls are proxied through `/api/companies-house/*`, so the key never reaches the
browser. Rate limit is 600 requests / 5 min; responses are cached in `companies_house_cache`.

### 3. Run / deploy

```bash
npm run dev          # local
# deploy: push to GitHub, import to Vercel, set the same env vars in the Vercel project
```

## Architecture

```
Browser (Next.js, RLS-scoped) ─┐
Claude (Supabase MCP) ─────────┤→  Supabase Postgres  ←─ Companies House (server proxy)
ChatGPT (MCP app / GPT Action) ┤      (system of record)
Marketing agents (service role)┘
```

- **System of record:** Postgres (Supabase). All consumers read/write the same tables;
  access differs by credential + Row-Level Security.
- **AI/agent access:** Claude via the Supabase MCP server; ChatGPT via a remote MCP "app"
  or a Custom GPT Action on the auto-generated REST API; agents via the service-role key
  server-side. Every agent write should go through `enrichment_log` for audit + rollback.

## Project structure

```
src/
  app/
    (app)/            # authenticated shell (sidebar + topbar)
      companies/      # list + [id] detail
      dashboard, contacts, deals, activities, reports
    (auth)/login/     # magic-link sign-in
    api/
      search/                     # palette + list search
      companies-house/search/     # CH type-ahead proxy
      companies-house/company/    # CH profile fetch + cache + enrich
  components/         # app shell, command palette, theme, companies/*
  lib/
    supabase/         # browser + server + middleware clients
    data/             # data access (Supabase or demo fallback)
    companies-house.ts
    demo-data.ts
    types.ts, utils.ts
supabase/migrations/  # 0001 schema · 0002 RLS · 0003 seed
```

## Roles & security

`profiles.role` ∈ `admin | staff | client | agent`. RLS: all authenticated users can read;
staff/admin write everything; agents update enrichable tables + write `enrichment_log`;
clients are read-only. The service-role key bypasses RLS and is **server-only**.

## Status

Companies is fully built (list, search, palette, detail, add + Companies House). Dashboard,
Contacts, Deals, Activities and Reports are scaffolded and next in `BUILD-PLAN.md`.
