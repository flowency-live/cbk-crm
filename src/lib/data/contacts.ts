import "server-only";
import { createClient } from "@/lib/supabase/server";
import { demoCompanies, demoContacts } from "@/lib/demo-data";
import type { Contact } from "@/lib/types";
import { isSupabaseConfigured } from "./companies";

export interface ContactRow extends Contact {
  company_name: string | null;
}

export async function getContacts(
  filters: { q?: string } = {}
): Promise<{ rows: ContactRow[]; demo: boolean }> {
  const q = (filters.q ?? "").trim();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("contacts")
        .select("*, organizations(name)")
        .is("deleted_at", null)
        .order("full_name", { ascending: true })
        .limit(500);
      if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

      const { data, error } = await query;
      if (error) throw error;

      const rows: ContactRow[] = (data ?? []).map((c: Record<string, unknown>) => ({
        ...(c as unknown as Contact),
        company_name:
          (c.organizations as { name?: string } | null)?.name ?? null,
      }));
      return { rows, demo: false };
    } catch {
      // fall through to demo
    }
  }

  // demo
  const flat: ContactRow[] = [];
  for (const [orgId, contacts] of Object.entries(demoContacts)) {
    const company = demoCompanies.find((c) => c.id === orgId);
    for (const ct of contacts) {
      flat.push({ ...ct, company_name: company?.name ?? null });
    }
  }
  const needle = q.toLowerCase();
  const rows = needle
    ? flat.filter((c) =>
        [c.full_name, c.email, c.company_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle)
      )
    : flat;
  rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
  return { rows, demo: true };
}
