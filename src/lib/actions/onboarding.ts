"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/data/portal";
import type { OnboardingQuestionnaire, OnboardingStatus } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Update the onboarding questionnaire.
 * Client can SELECT + UPDATE their own onboarding row (RLS allows it).
 */
export async function updateOnboardingQuestionnaire(
  questionnaire: OnboardingQuestionnaire
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const portalUser = await getPortalUser();
  if (!portalUser) return { ok: false, error: "No portal access." };

  // Get current onboarding record
  const { data: onboarding } = await supabase
    .from("onboarding")
    .select("id, questionnaire")
    .eq("org_id", portalUser.org_id)
    .single();

  if (!onboarding) return { ok: false, error: "Onboarding not found." };

  // Merge new questionnaire data with existing
  const mergedQuestionnaire = {
    ...(onboarding.questionnaire as object),
    ...questionnaire,
  };

  const { error } = await supabase
    .from("onboarding")
    .update({
      questionnaire: mergedQuestionnaire,
      status: "questionnaire_complete" as OnboardingStatus,
    })
    .eq("id", onboarding.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/onboarding");
  return { ok: true };
}

/**
 * Advance onboarding status after ID upload.
 */
export async function advanceOnboardingToIdUploaded(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const portalUser = await getPortalUser();
  if (!portalUser) return { ok: false, error: "No portal access." };

  const { error } = await supabase
    .from("onboarding")
    .update({ status: "id_uploaded" as OnboardingStatus })
    .eq("org_id", portalUser.org_id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/onboarding");
  return { ok: true };
}

/**
 * Staff action: Update onboarding status (e.g., to 'review' or 'complete').
 * Staff only.
 */
export async function updateOnboardingStatus(
  orgId: string,
  status: OnboardingStatus
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

  const updateData: { status: OnboardingStatus; completed_at?: string } = {
    status,
  };
  if (status === "complete") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("onboarding")
    .update(updateData)
    .eq("org_id", orgId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${orgId}`);
  revalidatePath("/portal/onboarding");
  return { ok: true };
}
