"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReportType } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Upload a report for a client. Staff only.
 */
export async function uploadReport(
  orgId: string,
  formData: FormData
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

  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string)?.trim();
  const type = (formData.get("type") as ReportType) || "custom";
  const periodLabel = (formData.get("period_label") as string)?.trim() || null;
  const jobId = (formData.get("job_id") as string) || null;
  const aiCommentary = (formData.get("ai_commentary") as string)?.trim() || null;

  if (!file) return { ok: false, error: "No file selected." };
  if (!title) return { ok: false, error: "Title required." };

  // Upload to storage
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const storagePath = `${orgId}/reports/${randomUUID()}-${safe}`;
  const { error: uploadErr } = await supabase.storage
    .from("client-documents")
    .upload(storagePath, file, { contentType: file.type || undefined, upsert: false });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  // Insert report record
  const { error: insertErr } = await supabase.from("reports").insert({
    tenant_id: org.tenant_id,
    org_id: orgId,
    job_id: jobId || null,
    period_label: periodLabel,
    type,
    title,
    storage_path: storagePath,
    ai_commentary: aiCommentary,
  });
  if (insertErr) return { ok: false, error: insertErr.message };

  revalidatePath(`/companies/${orgId}`);
  revalidatePath("/portal/reports");
  return { ok: true };
}

/**
 * Get a signed URL for downloading a report.
 */
export async function getReportDownloadUrl(
  storagePath: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data, error } = await supabase.storage
    .from("client-documents")
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error) return { ok: false, error: error.message };
  return { ok: true, url: data.signedUrl };
}
