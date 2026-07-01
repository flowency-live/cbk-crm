"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DeadlineKind } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface CreateDeadlineInput {
  kind: DeadlineKind;
  title: string;
  due_date: string;
}

/**
 * Create a deadline for a client. Staff only.
 */
export async function createDeadline(
  orgId: string,
  input: CreateDeadlineInput
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Check staff role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "staff"].includes(profile.role as string)) {
    return { ok: false, error: "Staff only." };
  }

  // Get org's tenant_id
  const { data: org } = await supabase
    .from("organizations")
    .select("id, tenant_id")
    .eq("id", orgId)
    .single();
  if (!org) return { ok: false, error: "Organization not found." };

  const { error } = await supabase.from("deadlines").insert({
    tenant_id: org.tenant_id,
    org_id: orgId,
    kind: input.kind,
    title: input.title.trim(),
    due_date: input.due_date,
    completed: false,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${orgId}`);
  revalidatePath("/portal");
  return { ok: true };
}

/**
 * Mark a deadline as completed. Staff only.
 */
export async function completeDeadline(
  deadlineId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Get deadline to find org_id
  const { data: deadline, error: fetchErr } = await supabase
    .from("deadlines")
    .select("id, org_id")
    .eq("id", deadlineId)
    .single();
  if (fetchErr || !deadline) return { ok: false, error: "Deadline not found." };

  const { error } = await supabase
    .from("deadlines")
    .update({ completed: true })
    .eq("id", deadlineId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${deadline.org_id}`);
  revalidatePath("/portal");
  return { ok: true };
}

/**
 * Delete a deadline. Staff only.
 */
export async function deleteDeadline(
  deadlineId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Get deadline to find org_id
  const { data: deadline, error: fetchErr } = await supabase
    .from("deadlines")
    .select("id, org_id")
    .eq("id", deadlineId)
    .single();
  if (fetchErr || !deadline) return { ok: false, error: "Deadline not found." };

  const { error } = await supabase
    .from("deadlines")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", deadlineId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${deadline.org_id}`);
  revalidatePath("/portal");
  return { ok: true };
}
