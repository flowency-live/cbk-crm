import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  demoActivities,
  demoCompanies,
  demoContacts,
  demoNotes,
} from "@/lib/demo-data";
import type {
  Activity,
  CompanyListRow,
  Contact,
  Note,
  Organization,
} from "@/lib/types";

export function isSupabaseConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface CompanyFilters {
  q?: string;
  status?: string; // comma-separated list; empty = all
  category?: string;
  fit?: string;
}

export async function getCompanies(
  filters: CompanyFilters = {}
): Promise<{ rows: CompanyListRow[]; demo: boolean }> {
  const { q = "", status = "", category = "all", fit = "all" } = filters;
  const statuses = status
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let rows: CompanyListRow[];
  let demo = false;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("search_companies", { q });
      if (error) throw error;
      rows = (data ?? []) as CompanyListRow[];
    } catch {
      rows = filterDemo(q);
      demo = true;
    }
  } else {
    rows = filterDemo(q);
    demo = true;
  }

  const filtered = rows.filter((r) => {
    const okStatus = statuses.length === 0 || statuses.includes(r.status);
    const okCategory = category === "all" || r.category === category;
    const fitVal =
      r.enrichment && typeof r.enrichment === "object"
        ? ((r.enrichment as Record<string, unknown>).fit as string | undefined)
        : undefined;
    const okFit =
      fit === "all" || (fit === "unreviewed" ? !fitVal : fitVal === fit);
    return okStatus && okCategory && okFit;
  });

  return { rows: filtered, demo };
}

function filterDemo(q: string): CompanyListRow[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return demoCompanies;
  return demoCompanies.filter((c) =>
    [
      c.name,
      c.primary_contact_name,
      c.primary_contact_email,
      c.town,
      c.county,
      c.postcode,
      c.sector,
      c.company_number,
      ...c.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(needle)
  );
}

export interface CompanyDetail {
  org: Organization;
  contacts: Contact[];
  activities: Activity[];
  notes: Note[];
}

export async function getCompany(id: string): Promise<CompanyDetail | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: org } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single();
      if (!org) throw new Error("not found");

      const [{ data: contacts }, { data: activities }, { data: notes }] =
        await Promise.all([
          supabase
            .from("contacts")
            .select("*")
            .eq("org_id", id)
            .is("deleted_at", null)
            .order("is_primary", { ascending: false }),
          supabase
            .from("activities")
            .select("*")
            .eq("org_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("notes")
            .select("*")
            .eq("org_id", id)
            .order("created_at", { ascending: false }),
        ]);

      return {
        org: org as Organization,
        contacts: (contacts ?? []) as Contact[],
        activities: (activities ?? []) as Activity[],
        notes: (notes ?? []) as Note[],
      };
    } catch {
      // fall through to demo
    }
  }

  const org = demoCompanies.find((c) => c.id === id);
  if (!org) return null;
  return {
    org,
    contacts: demoContacts[id] ?? [],
    activities: demoActivities[id] ?? [],
    notes: demoNotes[id] ?? [],
  };
}

/** Lightweight list for the command palette (companies + their primary contacts). */
export async function getPaletteIndex(): Promise<CompanyListRow[]> {
  const { rows } = await getCompanies();
  return rows;
}
