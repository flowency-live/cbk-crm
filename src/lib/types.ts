// Hand-maintained DB types. When the DB stabilises you can replace this with
// `supabase gen types typescript` output for full type-safety.

export type CompanyStatus =
  | "discovered"
  | "prospect"
  | "active_lead"
  | "client"
  | "closed"
  | "dormant"
  | "lost";

/** The statuses surfaced in the UI, in pipeline order. */
export const STATUS_FLOW: CompanyStatus[] = [
  "discovered",
  "prospect",
  "active_lead",
  "client",
  "closed",
];
export type UserRole = "admin" | "staff" | "client" | "agent";
export type ActivityType = "call" | "email" | "meeting" | "task" | "note";

export interface Organization {
  id: string;
  name: string;
  trading_name: string | null;
  company_number: string | null;
  company_type: string | null;
  status: CompanyStatus;
  sector: string | null;
  sic_code: string | null;
  category: string | null;
  address_line1: string | null;
  address_line2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
  incorporated_on: string | null;
  ch_status: string | null;
  accounts_next_due: string | null;
  confirmation_next_due: string | null;
  owner_id: string | null;
  website: string | null;
  phone: string | null;
  enriched_at: string | null;
  enriched_by: string | null;
  enrichment: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyListRow extends Organization {
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  last_activity_at: string | null;
  tags: string[];
}

export interface Contact {
  id: string;
  org_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  is_primary: boolean;
  source: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  org_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  type: ActivityType;
  subject: string;
  body: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  org_id: string | null;
  body: string;
  created_by: string | null;
  created_at: string;
}

export interface EnrichmentLogRow {
  id: string;
  entity_type: string;
  entity_id: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  source: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

export const STATUS_META: Record<
  CompanyStatus,
  { label: string; className: string }
> = {
  discovered: { label: "Discovered", className: "bg-[#6366f126] text-[#6366f1]" },
  prospect: { label: "Prospect", className: "bg-primary-soft text-primary" },
  active_lead: { label: "Active Lead", className: "bg-[#E0A75C26] text-warning" },
  client: { label: "Client", className: "bg-accent-soft text-accent" },
  closed: { label: "Closed", className: "bg-[#9993] text-muted" },
  dormant: { label: "Dormant", className: "bg-[#9993] text-muted" },
  lost: { label: "Lost", className: "bg-[#9993] text-muted" },
};

// ---------- Backlog ----------
export type BacklogStatus = "backlog" | "planned" | "in_progress" | "done";

export interface BacklogItem {
  id: string;
  ref: string | null;
  epic: string;
  title: string;
  description: string | null;
  priority: string; // must | should | could | wont
  phase: string; // phase_1 | phase_2 | phase_3
  status: BacklogStatus;
  automation: string | null; // none | assisted | autonomous | human_gate
  effort: string | null;
  impact: string | null;
  sort_order: number;
}

export const BACKLOG_COLUMNS: { key: BacklogStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "planned", label: "Planned" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

export const PRIORITY_META: Record<string, { label: string; className: string }> = {
  must: { label: "Must", className: "bg-[#C8553D26] text-danger" },
  should: { label: "Should", className: "bg-primary-soft text-primary" },
  could: { label: "Could", className: "bg-[#9993] text-muted" },
  wont: { label: "Won't (v1)", className: "bg-[#9993] text-muted" },
};

export const AUTOMATION_META: Record<string, { label: string; className: string }> = {
  autonomous: { label: "⚡ Autonomous", className: "bg-accent-soft text-accent" },
  assisted: { label: "AI-assisted", className: "bg-primary-soft text-primary" },
  human_gate: { label: "Human gate", className: "bg-[#E0A75C26] text-warning" },
  none: { label: "Build", className: "bg-[#9993] text-muted" },
};

export const PHASE_META: Record<string, string> = {
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  phase_3: "Phase 3",
};

// ---------- Business category (user-friendly classification) ----------
export const CATEGORIES = [
  "Construction & Trades",
  "Hospitality",
  "Retail",
  "Professional Services",
  "Health & Wellbeing",
  "Automotive",
  "Property",
  "Technology & Creative",
  "Other",
] as const;

// ---------- Website enquiries (contact-form inbox) ----------
export interface WebsiteEnquiry {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  service_interest: string | null;
  message: string | null;
  page_source: string | null;
  status: string; // new | reviewed | converted | spam
  converted_org_id: string | null;
}

export const ENQUIRY_STATUS_META: Record<
  string,
  { label: string; className: string }
> = {
  new: { label: "New", className: "bg-primary-soft text-primary" },
  reviewed: { label: "Reviewed", className: "bg-[#E0A75C26] text-warning" },
  converted: { label: "Converted", className: "bg-accent-soft text-accent" },
  spam: { label: "Spam", className: "bg-[#9993] text-muted" },
};

// ---------- Portal / Multi-tenant ----------
export type JobStatus =
  | "submitted"
  | "under_review"
  | "in_progress"
  | "info_required"
  | "ready_for_review"
  | "ready_for_approval"
  | "completed";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  theme: {
    logo_url?: string;
    primary?: string;
    ink?: string;
    accent?: string;
    portal_name?: string;
  };
  support_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PortalUser {
  id: string;
  auth_user_id: string;
  org_id: string;
  tenant_id: string;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  tenant_id: string;
  org_id: string;
  title: string;
  service_type: string | null;
  status: JobStatus;
  period_label: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Document {
  id: string;
  tenant_id: string;
  org_id: string;
  job_id: string | null;
  uploaded_by: string | null;
  file_name: string;
  storage_path: string;
  period_month: number | null;
  period_year: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- Workflow & Tasks ----------
export interface WorkflowTemplate {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  service_type: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTaskTemplate {
  id: string;
  template_id: string;
  stage: string;
  title: string;
  owner: "client" | "bookkeeper" | "ai";
  automation_level: string | null;
  sort_order: number;
}

export type JobTaskStatus = "pending" | "in_progress" | "blocked" | "done";
export type JobTaskOwner = "client" | "bookkeeper" | "ai";

export interface JobTask {
  id: string;
  job_id: string;
  tenant_id: string;
  org_id: string;
  stage: string;
  title: string;
  owner: JobTaskOwner;
  status: JobTaskStatus;
  due_at: string | null;
  rag: "green" | "amber" | "red" | null;
  automation_level: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- VAT Centre ----------
export type VatPeriodStatus =
  | "open"
  | "under_review"
  | "awaiting_approval"
  | "submitted"
  | "closed";

export interface VatPeriod {
  id: string;
  tenant_id: string;
  org_id: string;
  job_id: string | null;
  period_start: string;
  period_end: string;
  status: VatPeriodStatus;
  estimated_due: number | null;
  submission_due: string | null;
  submitted_at: string | null;
  hmrc_reference: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const VAT_STATUS_META: Record<
  VatPeriodStatus,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-primary-soft text-primary" },
  under_review: { label: "Under Review", className: "bg-[#E0A75C26] text-warning" },
  awaiting_approval: { label: "Awaiting Approval", className: "bg-[#6366f126] text-[#6366f1]" },
  submitted: { label: "Submitted", className: "bg-accent-soft text-accent" },
  closed: { label: "Closed", className: "bg-[#9993] text-muted" },
};

// ---------- CIS Centre ----------
export interface Subcontractor {
  id: string;
  tenant_id: string;
  org_id: string;
  name: string;
  utr: string | null;
  verification_number: string | null;
  cis_rate: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CisRecord {
  id: string;
  tenant_id: string;
  org_id: string;
  subcontractor_id: string | null;
  period_month: number;
  period_year: number;
  suffered: number | null;
  deducted: number | null;
  statement_document_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ---------- Messaging ----------
export type SenderRole = "client" | "staff";

export interface Message {
  id: string;
  tenant_id: string;
  org_id: string;
  job_id: string | null;
  sender_user_id: string;
  sender_role: SenderRole;
  body: string;
  read_at: string | null;
  created_at: string;
}

// ---------- Onboarding ----------
export type OnboardingStatus =
  | "started"
  | "questionnaire_complete"
  | "id_uploaded"
  | "review"
  | "complete";

export interface OnboardingQuestionnaire {
  utr?: string;
  vat_no?: string;
  company_no?: string;
  business_details?: string;
  [key: string]: unknown;
}

export interface Onboarding {
  id: string;
  tenant_id: string;
  org_id: string;
  status: OnboardingStatus;
  questionnaire: OnboardingQuestionnaire;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ONBOARDING_STATUS_META: Record<
  OnboardingStatus,
  { label: string; className: string; step: number }
> = {
  started: { label: "Started", className: "bg-primary-soft text-primary", step: 1 },
  questionnaire_complete: { label: "Questionnaire Complete", className: "bg-[#E0A75C26] text-warning", step: 2 },
  id_uploaded: { label: "ID Uploaded", className: "bg-[#6366f126] text-[#6366f1]", step: 3 },
  review: { label: "Under Review", className: "bg-[#E0A75C26] text-warning", step: 4 },
  complete: { label: "Complete", className: "bg-accent-soft text-accent", step: 5 },
};

// ---------- Reports Library ----------
export type ReportType =
  | "management"
  | "profit_loss"
  | "balance_sheet"
  | "cash_flow"
  | "year_end"
  | "custom";

export interface Report {
  id: string;
  tenant_id: string;
  org_id: string;
  job_id: string | null;
  period_label: string | null;
  type: ReportType;
  title: string;
  storage_path: string;
  ai_commentary: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const REPORT_TYPE_META: Record<ReportType, { label: string; className: string }> = {
  management: { label: "Management Report", className: "bg-primary-soft text-primary" },
  profit_loss: { label: "Profit & Loss", className: "bg-accent-soft text-accent" },
  balance_sheet: { label: "Balance Sheet", className: "bg-[#6366f126] text-[#6366f1]" },
  cash_flow: { label: "Cash Flow", className: "bg-[#E0A75C26] text-warning" },
  year_end: { label: "Year End", className: "bg-accent-soft text-accent" },
  custom: { label: "Custom", className: "bg-[#9993] text-muted" },
};

// ---------- Deadline Tracker ----------
export type DeadlineKind =
  | "vat"
  | "cis"
  | "payroll"
  | "accounts"
  | "self_assessment"
  | "confirmation_statement"
  | "other";

export interface Deadline {
  id: string;
  tenant_id: string;
  org_id: string;
  kind: DeadlineKind;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export const DEADLINE_KIND_META: Record<DeadlineKind, { label: string; icon: string }> = {
  vat: { label: "VAT Return", icon: "📊" },
  cis: { label: "CIS", icon: "🏗️" },
  payroll: { label: "Payroll", icon: "💰" },
  accounts: { label: "Accounts", icon: "📁" },
  self_assessment: { label: "Self Assessment", icon: "📝" },
  confirmation_statement: { label: "Confirmation Statement", icon: "✅" },
  other: { label: "Other", icon: "📋" },
};

// ---------- AML Checks (Staff only) ----------
export type AmlDecision = "pending" | "cleared" | "rejected" | null;

export interface AmlCheck {
  id: string;
  tenant_id: string;
  org_id: string;
  provider: string | null;
  reference: string | null;
  result: string | null;
  evidence_url: string | null;
  decision: AmlDecision;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AML_DECISION_META: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-[#E0A75C26] text-warning" },
  cleared: { label: "Cleared", className: "bg-accent-soft text-accent" },
  rejected: { label: "Rejected", className: "bg-[#C8553D26] text-danger" },
};

/** Job status metadata for UI rendering — §3.3 of work order */
export const JOB_STATUS_META: Record<
  JobStatus,
  { dot: string; client: string; clientSub: string; internal: string; className: string }
> = {
  submitted: {
    dot: "🟢",
    client: "Submitted",
    clientSub: "We've received it.",
    internal: "Submitted by client — on the site board",
    className: "bg-accent-soft text-accent",
  },
  under_review: {
    dot: "🟡",
    client: "Under Review",
    clientSub: "Our crew is working on it.",
    internal: "Under Review — checking it in the site office",
    className: "bg-[#E0A75C26] text-warning",
  },
  in_progress: {
    dot: "🚧",
    client: "In Progress",
    clientSub: "Currently being processed.",
    internal: "In Progress — active site work",
    className: "bg-primary-soft text-primary",
  },
  info_required: {
    dot: "🔴",
    client: "Information Required",
    clientSub: "We need something from you.",
    internal: "Information Required — halted on site",
    className: "bg-[#C8553D26] text-danger",
  },
  ready_for_review: {
    dot: "🟣",
    client: "Ready for Review",
    clientSub: "Your report is ready to view.",
    internal: "Reports ready — no sign-off needed",
    className: "bg-[#6366f126] text-[#6366f1]",
  },
  ready_for_approval: {
    dot: "🔵",
    client: "Ready for Approval",
    clientSub: "Waiting for your sign-off.",
    internal: "Ready for Approval — site inspection ready",
    className: "bg-primary-soft text-primary",
  },
  completed: {
    dot: "✅",
    client: "Completed",
    clientSub: "Job done.",
    internal: "Completed — signed off & filed",
    className: "bg-accent-soft text-accent",
  },
};
