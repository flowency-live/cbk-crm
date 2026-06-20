# The Hi-Vis Bookkeeper — Client Delivery Platform & Portal
## Product Requirements Document

**Author:** Flowency (Jason)
**Date:** 16 June 2026
**Version:** 0.1 (draft for review)
**Status:** For prioritisation
**Builds on:** the existing CRM (`cbk-crm`, Next.js + Supabase) — `CRM-Architecture.md`, `BUILD-PLAN.md`

---

## 1. Summary

We're extending the existing prospecting CRM into the **operational platform Sarah runs each client's bookkeeping from**, plus a **client-facing portal**. The platform turns the monthly bookkeeping cycle into a tracked, mostly-automated workflow, and gives clients a branded place to upload records, see status, answer queries and approve VAT.

The differentiator is **AI doing the work, not just assisting**. Most of the monthly cycle (chasing records, sorting documents, completeness checks, categorisation, drafting queries, generating reports and commentary) can run autonomously with a human safety-rail. We deliberately keep a human/client **sign-off** only where professional liability or regulation requires it (VAT approval, AML decision, final review).

---

## 2. Goals & success metrics

| Goal | Metric |
|---|---|
| Cut manual effort per client-month | ≥ 60% reduction in Sarah's hands-on minutes per client-month |
| Faster month-end | Median "records received → reports issued" ≤ 5 working days |
| Fewer chases | ≥ 80% of records arrive without a manual nudge |
| Client clarity | Every client can answer "what's the status / what do you need from me?" in the portal without emailing |
| Scale | One bookkeeper can service 3–4× more clients without quality loss |
| Compliance | 100% VAT returns client-approved before filing; AML complete before work starts |

---

## 3. Personas

- **Sarah — Bookkeeper / Practice owner (primary internal user).** Wants the month to run itself, exceptions surfaced, and to stay compliant. Accountable for the work.
- **The Client — trades & construction business owner (primary external user).** Time-poor, on-site, wants to drop in receipts, know what's needed, and approve things from their phone.
- **Future: Junior bookkeeper / VA.** Works the exception queue under Sarah's review.
- **The AI agents (non-human "users").** Records-chaser, document-sorter, completeness-checker, categoriser, query-drafter, report-writer, VAT/CIS-checker, client-assistant. Each runs with scoped permissions and an audit trail.

---

## 4. Scope

**In scope (this PRD):** client onboarding + AML, secure document intake, the monthly workflow engine, client + bookkeeper dashboards, VAT Centre, CIS Centre, templates, in-portal messaging, financial reporting via Xero, and the AI automation layer across all of the above.

**Out of scope (for now):** doing the actual ledger postings outside Xero (we orchestrate Xero, not replace it), payroll, self-assessment/CT filing, building our own HMRC VAT submission (we file via Xero), a native mobile app (portal is responsive web first).

**Relationship to the existing app:** extend `cbk-crm`. Prospects/leads already live there. A won prospect becomes a **Client (engagement)**. Add a **`client` role** and a portal route group (`/portal/*`) alongside the existing staff app. Reuse Supabase Auth + RLS so clients only ever see their own data.

---

## 5. Status taxonomy (tightened)

> **Challenge:** the supplied emoji set has collisions — blue 🔵 was used for *both* "Information Required" and "Ready for Approval", and a stray 🟣 "Ready for Review" appeared. We need one canonical set or the portal will confuse clients. Proposed:

| Status | Emoji | Meaning | Who acts next |
|---|---|---|---|
| `submitted` | 🟢 | We've received it | Us |
| `under_review` | 🟡 | Our crew is checking it | Us |
| `in_progress` | 🚧 | Being processed | Us |
| `info_required` | 🔴 | We need something from you | **Client** |
| `ready_for_approval` | 🔵 | Waiting for your sign-off | **Client** |
| `completed` | ✅ | Job done | — |

Separately, a **RAG health marker** (🟢 on-track / 🟠 at-risk / 🔴 overdue) sits on every task/deadline — distinct from workflow status, driven by due dates.

---

## 6. The monthly bookkeeping workflow (state machine)

Each client-month is a **workflow instance** built from a **template** (Bookkeeping ± VAT ± CIS). Tasks carry an owner (`client` / `bookkeeper` / `ai`), a status, a due date and an automation level. The instance auto-advances when tasks complete.

| # | Stage / Task | Drives status | Today (HITL?) | **Recommended automation** |
|---|---|---|---|---|
| 1 | Records request + reminder | 🔵 info_required | manual email | **Autonomous** — scheduled agent sends a tailored "what we still need" list |
| 2 | Client uploads documents | 🟡 under_review | manual filing | **Autonomous** — AI classifies + OCRs + files by month/year, marks Records Received |
| 3 | Initial completeness review | 🟡 / 🔴 | manual | **Autonomous detect → assisted** — AI checks statements present, date continuity, duplicates, totals; auto-raises "info required" + drafts the ask |
| 4 | Client supplies missing info | 🟢 | manual chase | **Autonomous** — agent follows up on a cadence, escalates to Sarah only if stuck |
| 5 | Process & reconcile (Xero) | 🚧 in_progress | manual | **Assisted → autonomous** — bank feeds + AI categorisation/VAT codes/CIS; high-confidence auto-applied, low-confidence queued |
| 6 | Queries raised | 🔴 info_required | manual | **Assisted → autonomous** — AI drafts the query from the flagged item; auto-send for templated cases |
| 7 | Internal review | 🟡 under_review | manual | **Assisted (keep human sign-off)** — AI pre-review checklist (recon, VAT sanity, anomalies); Sarah approves |
| 8 | Reports generated | 🚧 | manual | **Autonomous** — pull P&L/BS/Aged Debtors/Creditors from Xero; AI writes plain-English commentary |
| 9 | Report delivered | 🔵 ready_for_approval | manual | **Autonomous** — upload + notify client |
| 10 | VAT return prepared | 🚧 | manual | **Autonomous prep** — figures from Xero; AI sanity-checks |
| 11 | **VAT approval requested** | 🔵 ready_for_approval | client | **KEEP HUMAN (client)** — legal sign-off; one-tap "Approve VAT Return" |
| 12 | VAT submitted | ✅ | manual | **Autonomous post-approval** — file via Xero (MTD-recognised), store confirmation |
| 13 | Month closed | ✅ | manual | **Autonomous** — summary + "June 2026 complete" notification |

**Design principle — separate *authoring* from *accountability*.** Automate the authoring of everything. Keep a human/client **gate** only on regulated/liable actions: VAT approval (client), final professional review (Sarah), AML decision (Sarah), onboarding signature (client).

---

## 7. AI automation layer (the core of "make it cool")

We run a small set of purpose-scoped agents on top of Supabase (system of record) + Xero (ledger). Each writes to an **`ai_runs` audit log** (input, output, confidence, model, cost) and respects a **confidence threshold** with **exception escalation**.

### Automation maturity ladder
- **L1 — Assist:** AI drafts, human does/approves. (Launch here for anything regulated or unproven.)
- **L2 — Auto + review:** AI acts, human approves exceptions only.
- **L3 — Autonomous:** AI acts end-to-end, logged, anomalies escalated.

Each feature ships at L1, and **graduates** to L2/L3 once it clears a measured accuracy bar over N client-months (e.g., categorisation ≥ 95% agreement over 3 months → promote).

### Where AI earns its keep

| AI capability | Replaces / augments | Launch level | Guardrail |
|---|---|---|---|
| **Document classifier + OCR/extraction** | Manual sorting & data entry of invoices/receipts/bank/CIS | L3 | Low-confidence → "needs filing" queue |
| **Records-chaser agent** | Manual monthly reminders | L3 | Only asks for what's actually missing; escalation cap |
| **Completeness checker** | Manual "is everything here?" review | L2→L3 | Statement date continuity + opening/closing balance checks |
| **Categorisation & VAT/CIS coding** | Manual coding in Xero | L1→L2 | Auto-apply only above confidence; rest → query |
| **Query drafter** | Sarah writing client questions | L1→L3 | Human approves until templated patterns proven |
| **Internal pre-review** | Manual review checklist | L2 (human sign-off kept) | Flags anomalies, never self-approves the books |
| **Report commentary writer** | Manual report notes | L2→L3 | Figures come from Xero, not invented |
| **VAT sanity-check** | Manual return review | L2 | Compares to prior periods, flags outliers; client still approves |
| **CIS engine** | Manual CIS reconciliation | L1→L2 | Subcontractor verification + suffered/deducted matching |
| **Anomaly / duplicate / fraud detection** | Ad-hoc spotting | L2 | Surfaces, doesn't act |
| **Hi-Vis Helper (client chat assistant)** | "Quick question" emails | L2 | RAG over *that client's* data only; no advice beyond scope |
| **Template personaliser** | Manual mail-merge + tone | L3 | Locked legal templates; AI fills variables only |
| **Deadline intelligence** | Manual deadline tracking | L3 | Predicts at-risk, auto-nudges, sets RAG |

> **Net effect of challenging HITL:** of the 13 monthly tasks, **9 become autonomous, 2 stay AI-assisted with human sign-off (internal review, VAT prep), and only 2 remain deliberate human/client gates (VAT approval, supply-missing-info).** Onboarding adds one more human gate (AML decision).

---

## 8. Feature areas (epics)

### E1 — Onboarding & AML
Secure upload of ID + signed engagement letter; **AML/KYC check via SmartSearch/Credas** triggered automatically; AI extracts data from ID/contract to pre-fill the client record; e-signature for the engagement letter. **Human gate:** Sarah reviews & records the AML decision (regulatory requirement). Stores AML evidence for the retention period.

### E2 — Secure document intake
Drag-and-drop upload (invoices, receipts, bank statements, CIS statements); mobile camera capture; **auto-sort into month/year folders** by AI classification; OCR/extraction to structured data; duplicate detection; virus scan; per-client encrypted storage (Supabase Storage, private buckets, RLS).

### E3 — Client dashboard
Business info (incl. CIS status), "what we need from you" list, reminders, action tasks (upload statement, approve VAT…), RAG deadline markers, current month progress checklist, VAT/CIS at-a-glance.

### E4 — Bookkeeper workspace
Cross-client queue (exceptions first), per-client workflow board, task completion, recurring monthly instances auto-created, notifications outbound to clients, RAG markers, time/cost visibility, the AI exception queue.

### E5 — Workflow engine
Reusable templates (Bookkeeping, VAT, CIS, Year-End), instance generation on a schedule, task dependencies, status transitions, SLA/RAG, audit trail. This is the spine everything hangs on.

### E6 — VAT Centre
Current period, estimated VAT due (from Xero), submission dates, previous returns, one-tap client approval, file-via-Xero, confirmation storage.

### E7 — CIS Centre
CIS suffered / deducted, statements uploaded vs **missing**, registered subcontractors, subcontractor verification, monthly CIS return support.

### E8 — Financial reporting (Xero)
OAuth connect per client; pull P&L, Balance Sheet, Aged Debtors/Creditors; derive cash position; **AI commentary**; monthly + year-end report packs delivered to the portal.

### E9 — Templates & comms
Library of standard letters/emails with personalised fields (AI-merged); in-portal messaging thread per client (replaces scattered email); notifications by email/SMS/push.

### E10 — Hi-Vis Helper (client AI assistant)
In-portal chat answering "what do you need / what's my VAT / explain my P&L", grounded in that client's data; deflects out-of-scope to Sarah.

---

## 9. Integrations

- **Xero** (core): OAuth2 (granular scopes, 2026); Accounting API for invoices, bank transactions and the **reports** endpoints (P&L, Balance Sheet, Aged Debtors/Creditors — cash flow derived). Bank-feed reconciliation + categorisation happen here; we orchestrate and read back. **VAT is filed through Xero** (MTD-recognised) — we don't build HMRC submission in v1.
- **HMRC MTD / Agent Services:** future-optional direct path via the VAT (MTD) API + Agent Authorisation API + Agent Services Account, only if we outgrow filing-via-Xero. Flagged as Phase 3.
- **Companies House** (already built): registration data, deadlines.
- **AML/KYC:** SmartSearch/Credas API — automated ID verification + KYB at onboarding, triggered from the workflow.
- **Comms:** transactional email + SMS provider; push for PWA.
- **e-Signature:** for engagement letters (provider TBD).
- **Storage:** Supabase Storage (private, per-client).

---

## 10. Data model additions (Supabase)

Extends the existing schema (`organizations`, `contacts`, `profiles`, `enrichment_log`, …):

- `engagements` (a won client: services taken, status active/paused/closed, Xero connection, CIS flag, VAT scheme)
- `portal_users` (links a contact to an auth user with `client` role + which engagement)
- `documents` (engagement_id, type, period, storage_path, ai_class, extracted jsonb, status)
- `workflow_templates` / `workflow_tasks_templates`
- `workflow_instances` (engagement_id, period, template, status) / `workflow_tasks` (owner, status, due_at, rag, automation_level)
- `messages` (engagement thread)
- `vat_periods` / `cis_records` / `subcontractors`
- `reports` (engagement_id, period, type, storage_path, ai_commentary)
- `onboarding` / `aml_checks` (provider ref, result, evidence, decision_by)
- `ai_runs` (agent, entity, input, output, confidence, model, tokens, cost, status) — the automation audit trail

All client-facing tables enforce **RLS scoped to the client's engagement**; service-role/agents operate server-side only.

---

## 11. Security, compliance & data protection

- **Data isolation:** clients see only their engagement (RLS). Staff see all; agents are server-side with scoped keys.
- **AML:** automated checks + **human decision recorded**; evidence retained per MLR 2017 (5 years).
- **GDPR/UK-GDPR:** lawful basis, retention schedule, right-to-erasure handling, DPA with sub-processors (Supabase, Xero, AML, LLM).
- **AI data handling:** client data sent to LLMs must use enterprise/no-train endpoints; PII minimised; every AI action logged in `ai_runs`; human override always available.
- **Documents:** private buckets, encryption at rest, virus scanning, signed URLs.
- **Auditability:** immutable trail for financial actions, AML, VAT approval/submission.

---

## 12. Non-functional requirements

Responsive/mobile-first portal (PWA, camera upload); ≤2s p95 page loads; resilient background jobs (idempotent, retriable agents); cost controls on LLM usage; uptime ≥ 99.5%; accessibility AA; full backups + PITR (Supabase Pro).

---

## 13. Phased roadmap

**Phase 1 — MVP "the month runs in the portal" (HITL-heavy, prove value)**
Onboarding+AML (assisted), document intake + AI auto-sort, client + bookkeeper dashboards, workflow engine with the 13-task Bookkeeping template, statuses + RAG, in-portal messaging, records-chaser + completeness-checker agents (L2), basic VAT Centre with **client approval gate**. *Outcome: a client can be onboarded, upload records, see status, answer queries, approve VAT.*

**Phase 2 — Xero + reporting + real automation**
Xero OAuth + reports + AI commentary, categorisation/VAT/CIS coding agents, CIS Centre, templates with AI personalisation, Hi-Vis Helper assistant, promote chaser/sorter/completeness to L3. *Outcome: reports auto-generated, coding auto-applied above confidence, far less manual work.*

**Phase 3 — Autonomy + scale**
Graduate query-drafting and report commentary to autonomous, anomaly/fraud detection, deadline intelligence, optional direct HMRC MTD path, multi-bookkeeper exception queue, analytics on automation accuracy/savings. *Outcome: one bookkeeper scales 3–4×.*

---

## 14. Backlog (epics → representative stories)

Full prioritised backlog with effort/impact/automation level is in **`Hi-Vis-Backlog.xlsx`**. Prioritisation uses **MoSCoW × phase**, plus an **automation level** per story.

Representative Must-haves (Phase 1):
- As a client, I can upload invoices/receipts/bank/CIS by drag-drop or phone camera, and they're auto-filed by month. *(E2, L3)*
- As the system, I auto-classify and OCR each upload and flag low-confidence for filing. *(E2, L3)*
- As a client, I see a dashboard of what's needed, my tasks, and month status with RAG. *(E3)*
- As the system, I send a tailored monthly records request and chase what's missing. *(E1/E5, L3)*
- As a bookkeeper, recurring monthly workflow instances are created automatically from a template. *(E5)*
- As a bookkeeper, the completeness checker tells me what's missing/duplicated before I start. *(E5, L2)*
- As a client, I approve my VAT return with one tap before it's filed. *(E6, human gate)*
- As a client, I onboard by uploading ID + signing the letter; AML runs automatically. *(E1, human decision)*

(Phase 2/3 stories — Xero pull, AI coding, commentary, CIS engine, Helper assistant, autonomy graduation — itemised in the spreadsheet.)

---

## 15. Open questions / decisions

1. **One app or two?** Recommend extending `cbk-crm` with a `client` role + `/portal` (reuses auth/RLS). Confirm.
2. **Xero for all clients?** Some trades may not be on Xero — do we mandate Xero, or support a non-Xero "upload only" tier?
3. **AML provider** — SmartSearch/Credas vs Thirdfort; budget per check.
4. **e-signature** provider for engagement letters.
5. **VAT filing** — confirm we file via Xero in v1 (vs building HMRC MTD direct in Phase 3).
6. **LLM provider/endpoint** for no-train data handling; per-client cost ceiling.
7. **Comms channel** priority — email only at MVP, or SMS too (trades respond to text)?
8. **Automation appetite** — are you comfortable launching document-sort + chasing at L3 (autonomous) from day one, given the audit trail?

---

*Sources for current integration/compliance facts are listed in the accompanying chat message.*

---

## Appendix A — Hi-Vis "site" status language

The canonical statuses (§5) carry site-themed client-facing copy:

| Status | Client-facing copy |
|---|---|
| 🟢 Submitted | On the site board — we've received it |
| 🟡 Under Review | Our crew is checking it in the site office |
| 🔴 Information Required | Halted on site — we need something from you |
| 🔵 Ready for Approval | Site inspection ready — waiting for your sign-off |
| 🚧 In Progress | Active site work — being processed |
| ✅ Completed | Job signed off & filed |

## Appendix B — Service workflow definitions (template source)

These are the stage/task definitions the workflow engine (E5) builds templates from. Each task carries owner (client/bookkeeper/ai), status and automation level per §6–§7.

### B1 — Monthly Bookkeeping & MTD
**New Client Setup:** welcome email/letter with AML paperwork, ID request, T&Cs, engagement letter → complete onboarding questionnaire → connect accounting software (Xero only currently) → add bank feeds → upload opening records → review completed.
**Monthly Processing:** records requested → records received → transactions processed → bank accounts reconciled → queries raised (if required) → queries resolved → bookkeeping review completed.
**Reporting & Compliance:** monthly management reports prepared → reports uploaded to portal for client approval → MTD submission prepared (when due) → MTD submission completed → month closed.

### B2 — VAT Return Service
**VAT Review:** VAT period opened → transactions reviewed → VAT treatment checked → VAT adjustments reviewed → VAT return prepared.
**Client Approval:** VAT summary uploaded → approval requested → approval received.
**Submission:** VAT return submitted to HMRC → submission confirmation received → VAT liability communicated → VAT period closed.

### B3 — Bookkeeping Clean-Up Service
**Initial Assessment:** records requested → records received → historical bookkeeping reviewed → issues identified → clean-up plan + quotation prepared → plan and quotation approved by client.
**Correction Work:** transactions reviewed → bank reconciliations corrected → duplicate entries removed → missing transactions entered → VAT coding reviewed → control accounts checked.
**Final Review:** accounts reconciled → errors corrected → clean-up review completed → summary report prepared → recommendations issued.

### B4 — CIS Registration Service
**Registration Preparation:** subcontractor information requested → received → UTR verified → business details reviewed → registration application prepared.
**Submission:** CIS registration submitted → HMRC response monitored → registration confirmed.
**Completion:** registration documents uploaded → CIS guidance provided → service completed.

### B5 — CIS Compliance Review
**Review Setup:** CIS records requested → received → compliance review started.
**Compliance Checks:** CIS registration verified → subcontractor records reviewed → verification procedures checked → deductions reviewed → monthly returns reviewed → payment records reviewed.
**Findings & Recommendations:** compliance issues identified → risk assessment completed → recommendations prepared → compliance report uploaded with follow-up actions → follow-up actions agreed.

## Appendix C — Universal task actions

Reusable action buttons surfaced throughout the portal, tied to task types:
Upload Documents · Complete Questionnaire · Respond to Query · Approve Submission · View Report · Download Documents · Book a Call · Mark as Complete.

