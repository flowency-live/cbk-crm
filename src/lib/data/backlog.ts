import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BacklogItem } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getBacklog(): Promise<BacklogItem[]> {
  if (!configured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("backlog_items")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as BacklogItem[];
  } catch {
    return [];
  }
}
