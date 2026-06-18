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
