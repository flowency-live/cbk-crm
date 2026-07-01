"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AmlDecision } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface CreateAmlCheckInput {
  provider: string;
  reference: string;
  result: string;
  evidence_url?: string;
}

/**
 * Create an AML check record for a client. Staff only.
 */
export async function createAmlCheck(
  orgId: string,
  input: CreateAmlCheckInput
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

  const { error } = await supabase.from("aml_checks").insert({
    tenant_id: org.tenant_id,
    org_id: orgId,
    provider: input.provider.trim(),
    reference: input.reference.trim(),
    result: input.result.trim(),
    evidence_url: input.evidence_url?.trim() || null,
    decision: "pending" as AmlDecision,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${orgId}`);
  return { ok: true };
}

/**
 * Record a decision on an AML check. Staff only.
 */
export async function recordAmlDecision(
  checkId: string,
  decision: "cleared" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Get check to find org_id
  const { data: check, error: fetchErr } = await supabase
    .from("aml_checks")
    .select("id, org_id")
    .eq("id", checkId)
    .single();
  if (fetchErr || !check) return { ok: false, error: "AML check not found." };

  const { error } = await supabase
    .from("aml_checks")
    .update({
      decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    })
    .eq("id", checkId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${check.org_id}`);
  return { ok: true };
}
