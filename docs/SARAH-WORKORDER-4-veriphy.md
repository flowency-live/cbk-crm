# Sarah Work Order #4 — Veriphy ID/AML integration

**Decision:** Veriphy is the ID verification + AML provider. Schema is live (migration `0017`). Build behind a **provider adapter** so the vendor is swappable and so we're not blocked on exact endpoints — the Veriphy-specific request/response mapping is filled once we have their API docs + sandbox key (see "Blocked on" at the end).

## Data model (already live)

- **`aml_checks`** (STAFF ONLY) — the compliance record. New columns: `check_type` (`id_verification|aml_screen|pep_sanctions|company|source_of_funds`), `status` (`requested|in_progress|complete|error|expired`), `provider_check_id`, `result_payload jsonb`, `requested_by`, `checked_at`. Plus existing `provider, reference, result, evidence_url, decision, decided_by, decided_at`.
- **`id_verification_sessions`** (CLIENT READABLE, org-scoped) — just the capture link + status, no AML result: `provider`, `provider_check_id`, `session_url`, `status` (`requested|in_progress|complete|failed|expired`), `expires_at`, `aml_check_id`.

Why two tables: RLS is row-level, so the client can't be shown the ID link on the same row that holds AML results. The client reads `id_verification_sessions`; results/decision stay in staff-only `aml_checks`.

## State machine

| Stage | Actor | Writes |
|---|---|---|
| Staff clicks "Start ID + AML" on a client (or auto on onboarding) | server action `startVeriphyCheck(orgId, type)` | insert `aml_checks` (status `requested`, requested_by) + insert `id_verification_sessions` (status `requested`, `session_url` from Veriphy) |
| Client opens portal onboarding → clicks "Verify your ID" → completes doc + selfie on phone | client opens `session_url` | (Veriphy side) |
| Veriphy finishes | webhook `POST /api/veriphy/webhook` (service role) | update matching `aml_checks` (status `complete`, `result` pass/refer/fail, `result_payload`, `evidence_url`, `checked_at`) + `id_verification_sessions.status` |
| Firm's AML decision | staff panel (CRM) | set `aml_checks.decision` + `decided_by` + `decided_at`; on cleared → advance `onboarding` |

Keep the human decision — MLR 2017 requires the firm to make/record it. No auto-approve.

## Build (src/, behind an adapter)

1. **`lib/aml/veriphy.ts`** — adapter with `createBiometricCheck(person)`, `createAmlScreen(person)`, `verifyWebhook(req)`, `parseResult(payload)`. Implement against Veriphy's docs when they land. Reads env (below). Keep all Veriphy specifics in this one file.
2. **`lib/actions/aml.ts`** — `startVeriphyCheck(orgId, type)` (staff-only, service role): call the adapter, write `aml_checks` + `id_verification_sessions`. `recordAmlDecision(amlCheckId, decision)`.
3. **`app/api/veriphy/webhook/route.ts`** — POST handler: verify signature (`VERIPHY_WEBHOOK_SECRET`), match on `provider_check_id`, update `aml_checks` + `id_verification_sessions` via the **service-role** client (server-only). Return 200 fast.
4. **Client onboarding step** (`/portal/onboarding`) — read `id_verification_sessions` for the org; if one is `requested`/`in_progress`, show a "Verify your ID" button opening `session_url`; when `complete`, show a tick. (No AML result shown to client.)
5. **Staff AML panel** (CRM company detail) — show `aml_checks` (result + `result_payload`), and the decision action. This is the E1-2 panel; extend it.

## Env vars (add to Vercel + `.env.local.example`)

```
VERIPHY_API_BASE_URL=
VERIPHY_API_KEY=
VERIPHY_WEBHOOK_SECRET=
```

## Blocked on (Jason → Veriphy)

We can't finish `lib/aml/veriphy.ts` until we have Veriphy's specifics. From the sign-up/demo, get:
1. **API documentation + sandbox credentials** (they supply docs on request).
2. **Auth method** (API key vs OAuth) and **base URL**.
3. The **Biometric Check** and **AML Check** endpoints, and whether the client capture is a **hosted URL we can hand the client** (ideal), a redirect, or an SDK.
4. **Result delivery**: do they **push a webhook/callback** (preferred), or must we **poll**? If webhook — the signature scheme.
5. Sandbox test data for pass/refer/fail.

Give me those and I'll finalise the adapter contract; Sarah wires the UI/webhook. Everything above the adapter (schema, state machine, RLS, decision gate) is done and vendor-neutral.
