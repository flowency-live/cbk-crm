"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobStatus } from "@/lib/portal/status";
import { notifyClientInfoRequired } from "./notifications";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface CreateJobInput {
  title: string;
  serviceType?: string;
  periodLabel?: string;
}

/**
 * Create a new job for an organization. Staff only.
 */
export async function createJob(
  orgId: string,
  input: CreateJobInput
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Get org's tenant_id
  const { data: org } = await supabase
    .from("organizations")
    .select("id, tenant_id")
    .eq("id", orgId)
    .single();
  if (!org) return { ok: false, error: "Organization not found." };

  const { error } = await supabase.from("jobs").insert({
    tenant_id: org.tenant_id,
    org_id: orgId,
    title: input.title.trim(),
    service_type: input.serviceType?.trim() || null,
    period_label: input.periodLabel?.trim() || null,
    status: "submitted" as JobStatus,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${orgId}`);
  return { ok: true };
}

/**
 * Update a job's status. Staff only.
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, org_id")
    .eq("id", jobId)
    .single();
  if (fetchErr || !job) return { ok: false, error: "Job not found." };

  const { error } = await supabase
    .from("jobs")
    .update({ status })
    .eq("id", jobId);

  if (error) return { ok: false, error: error.message };

  // Notify client when status changes to info_required
  if (status === "info_required") {
    await notifyClientInfoRequired(jobId);
  }

  revalidatePath(`/companies/${job.org_id}`);
  revalidatePath("/portal");
  return { ok: true };
}

/**
 * Soft-delete a job. Staff only.
 */
export async function deleteJob(
  jobId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: job, error: fetchErr } = await supabase
    .from("jobs")
    .select("id, org_id")
    .eq("id", jobId)
    .single();
  if (fetchErr || !job) return { ok: false, error: "Job not found." };

  const { error } = await supabase
    .from("jobs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${job.org_id}`);
  return { ok: true };
}
