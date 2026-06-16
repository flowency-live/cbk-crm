import "server-only";
import { createClient } from "@/lib/supabase/server";
import { demoActivities, demoCompanies } from "@/lib/demo-data";
import type { Activity } from "@/lib/types";
import { isSupabaseConfigured } from "./companies";

export interface ActivityRow extends Activity {
  company_name: string | null;
}

export async function getActivities(
  filters: { q?: string; type?: string; limit?: number } = {}
): Promise<{ rows: ActivityRow[]; demo: boolean }> {
  const q = (filters.q ?? "").trim();
  const type = filters.type ?? "all";
  const limit = filters.limit ?? 200;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("activities")
        .select("*, organizations(name)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (type !== "all") query = query.eq("type", type);
      if (q) query = query.or(`subject.ilike.%${q}%,body.ilike.%${q}%`);

      const { data, error } = await query;
      if (error) throw error;

      const rows: ActivityRow[] = (data ?? []).map((a: Record<string, unknown>) => ({
        ...(a as unknown as Activity),
        company_name:
          (a.organizations as { name?: string } | null)?.name ?? null,
      }));
      return { rows, demo: false };
    } catch {
      // fall through to demo
    }
  }

  // demo
  let flat: ActivityRow[] = [];
  for (const [orgId, acts] of Object.entries(demoActivities)) {
    const company = demoCompanies.find((c) => c.id === orgId);
    for (const a of acts) flat.push({ ...a, company_name: company?.name ?? null });
  }
  if (type !== "all") flat = flat.filter((a) => a.type === type);
  if (q) {
    const needle = q.toLowerCase();
    flat = flat.filter((a) =>
      [a.subject, a.body, a.company_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }
  flat.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return { rows: flat.slice(0, limit), demo: true };
}
