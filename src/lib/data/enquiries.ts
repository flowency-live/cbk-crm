import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { WebsiteEnquiry } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getEnquiries(status = "new"): Promise<WebsiteEnquiry[]> {
  if (!configured()) return [];
  try {
    const supabase = await createClient();
    let query = supabase
      .from("website_enquiries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (status && status !== "all") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as WebsiteEnquiry[];
  } catch {
    return [];
  }
}

export async function getNewEnquiryCount(): Promise<number> {
  if (!configured()) return 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("website_enquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}
