import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "./companies";
import type {
  Job,
  PortalUser,
  Tenant,
  Document,
  Organization,
  JobTask,
  VatPeriod,
  Subcontractor,
  CisRecord,
  Message,
  Onboarding,
  Report,
  Deadline,
} from "@/lib/types";

// Demo tenant for when Supabase is not configured
const DEMO_TENANT: Tenant = {
  id: "a0000000-0000-4000-8000-000000000001",
  slug: "hi-vis",
  name: "The Hi Vis Bookkeeper",
  theme: {
    logo_url: "/brand/hi-vis/logo.png",
    primary: "#FACC15",
    ink: "#1C1C1C",
    accent: "#3FA89B",
    portal_name: "The Hi Vis Bookkeeper",
  },
  support_email: "hello@hivisbooks.co.uk",
  status: "active",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Fetches the portal_user row for the currently authenticated user.
 * Returns null if the user is not provisioned as a portal client.
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("portal_users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (error || !data) return null;
    return data as PortalUser;
  } catch {
    return null;
  }
}

/**
 * Fetches a tenant by slug. Falls back to demo tenant if not configured.
 */
export async function getTenant(slug: string): Promise<Tenant | null> {
  if (!isSupabaseConfigured()) {
    return slug === "hi-vis" ? DEMO_TENANT : null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return data as Tenant;
  } catch {
    return null;
  }
}

/**
 * Fetches the default tenant (Hi-Vis for now).
 */
export async function getDefaultTenant(): Promise<Tenant> {
  if (!isSupabaseConfigured()) return DEMO_TENANT;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", "hi-vis")
      .single();

    if (error || !data) return DEMO_TENANT;
    return data as Tenant;
  } catch {
    return DEMO_TENANT;
  }
}

/**
 * Fetches the organization for a portal user.
 */
export async function getPortalOrganization(): Promise<Organization | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get org via portal_users join
    const { data, error } = await supabase
      .from("portal_users")
      .select("org_id, organizations(*)")
      .eq("auth_user_id", user.id)
      .single();

    if (error || !data) return null;

    const org = data.organizations as unknown as Organization;
    return org;
  } catch {
    return null;
  }
}

/**
 * Fetches jobs for the current portal user's organization.
 */
export async function getPortalJobs(): Promise<Job[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as Job[];
  } catch {
    return [];
  }
}

/**
 * Fetches documents for the current portal user's organization.
 */
export async function getPortalDocuments(limit = 10): Promise<Document[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as Document[];
  } catch {
    return [];
  }
}

// ---------- Workflow / Job Tasks ----------

/**
 * Fetches job tasks for a specific job, grouped by stage.
 */
export async function getJobTasks(jobId: string): Promise<JobTask[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_tasks")
      .select("*")
      .eq("job_id", jobId)
      .order("sort_order", { ascending: true });

    if (error) return [];
    return (data ?? []) as JobTask[];
  } catch {
    return [];
  }
}

/**
 * Fetches all tasks for the current portal user's jobs (client view).
 */
export async function getPortalJobTasks(): Promise<JobTask[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("job_tasks")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) return [];
    return (data ?? []) as JobTask[];
  } catch {
    return [];
  }
}

// ---------- VAT Centre ----------

/**
 * Fetches VAT periods for the current portal user's organization.
 */
export async function getPortalVatPeriods(): Promise<VatPeriod[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vat_periods")
      .select("*")
      .is("deleted_at", null)
      .order("period_end", { ascending: false });

    if (error) return [];
    return (data ?? []) as VatPeriod[];
  } catch {
    return [];
  }
}

// ---------- CIS Centre ----------

/**
 * Fetches subcontractors for the current portal user's organization.
 */
export async function getPortalSubcontractors(): Promise<Subcontractor[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("subcontractors")
      .select("*")
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) return [];
    return (data ?? []) as Subcontractor[];
  } catch {
    return [];
  }
}

/**
 * Fetches CIS records for the current portal user's organization.
 */
export async function getPortalCisRecords(): Promise<CisRecord[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cis_records")
      .select("*")
      .is("deleted_at", null)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });

    if (error) return [];
    return (data ?? []) as CisRecord[];
  } catch {
    return [];
  }
}

// ---------- Messaging ----------

/**
 * Fetches messages for the current portal user's organization.
 */
export async function getPortalMessages(): Promise<Message[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return [];
    return (data ?? []) as Message[];
  } catch {
    return [];
  }
}

// ---------- Onboarding ----------

/**
 * Fetches the onboarding record for the current portal user's organization.
 */
export async function getPortalOnboarding(): Promise<Onboarding | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("onboarding")
      .select("*")
      .single();

    if (error || !data) return null;
    return data as Onboarding;
  } catch {
    return null;
  }
}

// ---------- Reports Library ----------

/**
 * Fetches reports for the current portal user's organization.
 */
export async function getPortalReports(): Promise<Report[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as Report[];
  } catch {
    return [];
  }
}

// ---------- Deadline Tracker ----------

/**
 * Fetches deadlines for the current portal user's organization.
 */
export async function getPortalDeadlines(): Promise<Deadline[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deadlines")
      .select("*")
      .is("deleted_at", null)
      .order("due_date", { ascending: true });

    if (error) return [];
    return (data ?? []) as Deadline[];
  } catch {
    return [];
  }
}
