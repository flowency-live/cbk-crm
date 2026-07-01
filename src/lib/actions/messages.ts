"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/data/portal";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Send a message from the portal client.
 * RLS enforces that sender_role must be 'client' and sender_user_id matches auth.uid().
 */
export async function sendClientMessage(
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const portalUser = await getPortalUser();
  if (!portalUser) return { ok: false, error: "No portal access." };

  const trimmedBody = body.trim();
  if (!trimmedBody) return { ok: false, error: "Message cannot be empty." };

  const { error } = await supabase.from("messages").insert({
    org_id: portalUser.org_id,
    tenant_id: portalUser.tenant_id,
    body: trimmedBody,
    sender_role: "client",
    sender_user_id: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/messages");
  return { ok: true };
}

/**
 * Send a message from staff (CRM side).
 * Staff only.
 */
export async function sendStaffMessage(
  orgId: string,
  body: string
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

  const trimmedBody = body.trim();
  if (!trimmedBody) return { ok: false, error: "Message cannot be empty." };

  const { error } = await supabase.from("messages").insert({
    org_id: orgId,
    tenant_id: org.tenant_id,
    body: trimmedBody,
    sender_role: "staff",
    sender_user_id: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${orgId}`);
  revalidatePath("/portal/messages");
  return { ok: true };
}

/**
 * Mark messages as read for the current user.
 */
export async function markMessagesRead(
  messageIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };
  if (messageIds.length === 0) return { ok: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .in("id", messageIds)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/messages");
  return { ok: true };
}
