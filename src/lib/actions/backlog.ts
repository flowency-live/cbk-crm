"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BacklogStatus } from "@/lib/types";

export async function updateBacklogStatus(
  id: string,
  status: BacklogStatus
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("backlog_items")
      .update({ status })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/backlog");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
