# Cheshire Bookkeeping CRM — Build Plan

**Repo:** `C:\VSProjects\CBKCRM`
**Owner:** Claude (full-stack build) · **Gatekeeper:** Jason (deploy + external setup only)
**Date:** 16 June 2026
**Companion docs:** `CRM-Architecture.md`, `CRM-Frontend-Spec.md` (in the Cheshire project folder)

---

## How this works

I build the whole thing — schema, back end, front end, integrations. **I'll only stop to
ask you when (a) something needs deploying, or (b) an external account/key needs setting
up that only you can do.** Those moments are marked **🔑 GATE** below. Everything else I
just do.

> **One environment note:** the code lives on your Windows machine at `C:\VSProjects\CBKCRM`.
> I write all the files; you run `npm install` / `npm run dev` locally and click deploy.
> I verify code by type-checking where I can; you'll catch anything runtime-specific on first run.

---

## Stack (locked from the architecture + FE specs)

- **Next.js 15** (App Router, TypeScript, Server Components)
- **Tailwind CSS** + **shadcn/ui** + **Lucide** icons + **cmdk** (command palette)
- **TanStack Table** (data grids)
- **Supabase** — Postgres (system of record), Auth, Row-Level Security
- **Companies House Public Data API** — server-side proxy route
- **Deploy:** Vercel (front end) + Supabase Cloud (data)
- **AI/agent access:** Supabase MCP (Claude), REST/Custom GPT Action (ChatGPT), service-role (agents) — wired by design

---

## Phases

### Phase 0 — Setup & access  🔑 GATE (you)
- [x] Connect `C:\VSProjects\CBKCRM` to Cowork
- [ ] **🔑 Supabase project** — you create it; send me Project URL + anon key + service_role key + DB password
- [ ] **🔑 Companies House API key** — free registration; send me the key
- [ ] **🔑 Node 20+** installed locally (to run the app)
- [ ] (Later) GitHub repo + Vercel account for deploy

### Phase 1 — Project scaffold  *(me)*
Next.js + TS + Tailwind + shadcn config, ESLint/Prettier, folder structure, design tokens
(light/dark brand palette), theme provider, base layout (sidebar + top bar), fonts (Baloo 2 + Inter).

### Phase 2 — Database  *(me)*
Postgres migrations: `organizations`, `contacts`, `deals`, `activities`, `notes`, `tags`,
`taggables`, `profiles` (roles), `enrichment_log`, `companies_house_cache`. Triggers
(updated_at), full-text + `pg_trgm` indexes, **RLS policies**, and a **seed** of Cheshire demo data.

### Phase 3 — Data & search layer  *(me)*
Supabase clients (server + browser via `@supabase/ssr`), generated TS types, a search RPC
(full-text + fuzzy trigram) powering the global search and list filtering.

### Phase 4 — Companies: list, search, detail  *(me)*
List view (TanStack Table, sortable, density toggle), free-text search + faceted filters
(sector/location/status/tags) + saved views, command palette (`⌘K`), detail page/slide-over
with tabs (Overview / Contacts / Companies House / Activities / Notes / Enrichment).

### Phase 5 — Add company + Companies House  *(me)*
Add flow: manual entry **and** Companies House lookup (server-side proxy route, type-ahead,
auto-fill + field mapping, officers → contacts), response caching with TTL + "Refresh from CH".

### Phase 6 — Contacts, deals, activities, notes  *(me)*
Full CRUD for the remaining entities, inline editing, activity timeline.

### Phase 7 — Auth & roles  *(me)*
Supabase Auth (magic link / Google), protected routes via middleware, role-aware UI
(admin / staff / client / agent), RLS enforced end-to-end.

### Phase 8 — Agent & AI access  *(me)*
`enrichment_log` UI (accept/revert agent changes), service-role API surface for marketing
agents, Supabase MCP + Custom GPT Action notes in the README.

### Phase 9 — Polish  *(me)*
Empty/loading/error states, accessibility (AA both modes, keyboard), responsive, toasts.

### Phase 10 — Deploy  🔑 GATE (you)
- [ ] **🔑 Apply migrations** to Supabase (CLI `supabase db push` or paste into SQL editor — I give exact steps)
- [ ] **🔑 Push to GitHub + import to Vercel**, set env vars
- [ ] Smoke test on the live URL

---

## Current status

- Phase 0: folder connected. **Waiting on you for the 🔑 GATE items (Supabase + Companies House key)** — but I don't need them to start coding; I'll scaffold everything against env placeholders and you drop the keys in when ready.
- Building Phases 1–5 now.

## What I need from you right now

Just kick off the two free signups so the keys are ready when the app first runs (details in
the closing message). I'll keep building in the meantime and ping you at the next 🔑 GATE.
