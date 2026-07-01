"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { JobTaskStatus } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Instantiate a workflow on a job using the RPC.
 * Staff only.
 */
export async function instantiateWorkflow(
  jobId: string,
  templateKey: string = "monthly_bookkeeping"
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Get job to verify it exists and get org_id for revalidation
  const { data: job, error: jobErr } = await supabase
    .from("jobs")
    .select("id, org_id")
    .eq("id", jobId)
    .single();
  if (jobErr || !job) return { ok: false, error: "Job not found." };

  // Call the RPC to instantiate workflow tasks
  const { error } = await supabase.rpc("instantiate_workflow", {
    p_job_id: jobId,
    p_template_key: templateKey,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/companies/${job.org_id}`);
  revalidatePath("/portal");
  return { ok: true };
}

/**
 * Update a job task's status. Used by both staff and clients.
 * RLS enforces appropriate permissions.
 */
export async function updateJobTaskStatus(
  taskId: string,
  status: JobTaskStatus
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const completedAt = status === "done" ? new Date().toISOString() : null;

  const { data: task, error: fetchErr } = await supabase
    .from("job_tasks")
    .select("id, org_id, job_id")
    .eq("id", taskId)
    .single();
  if (fetchErr || !task) return { ok: false, error: "Task not found." };

  const { error } = await supabase
    .from("job_tasks")
    .update({ status, completed_at: completedAt })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };

  // Get the job's org_id for proper revalidation
  const { data: job } = await supabase
    .from("jobs")
    .select("org_id")
    .eq("id", task.job_id)
    .single();

  if (job) {
    revalidatePath(`/companies/${job.org_id}`);
  }
  revalidatePath("/portal");
  return { ok: true };
}
