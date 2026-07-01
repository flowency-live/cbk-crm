"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbk-crm.vercel.app";

/**
 * Notify a client that information is required for their job.
 * Called when job status transitions to `info_required`.
 */
export async function notifyClientInfoRequired(
  jobId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: true }; // No-op in demo mode

  try {
    const supabase = await createClient();

    // Get job with org and portal user contact
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select(`
        id, title, period_label,
        organizations(id, name),
        portal_users:portal_users(
          contacts(email, full_name)
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobErr || !job) return { ok: false, error: "Job not found" };

    const org = job.organizations as unknown as { id: string; name: string } | null;
    const portalUsers = job.portal_users as unknown as Array<{ contacts: { email: string; full_name: string } | null }> | null;
    const contact = portalUsers?.[0]?.contacts;

    if (!contact?.email) {
      console.log("[notify] No contact email for job:", jobId);
      return { ok: true }; // No one to notify
    }

    const result = await sendEmail({
      to: contact.email,
      subject: `Action needed: ${job.title}`,
      html: `
        <p>Hi ${contact.full_name ?? "there"},</p>
        <p>We need some information from you to continue working on <strong>${job.title}</strong>${job.period_label ? ` (${job.period_label})` : ""}.</p>
        <p>Please log in to your portal to see what's needed:</p>
        <p><a href="${SITE_URL}/portal" style="display:inline-block;padding:12px 24px;background:#FACC15;color:#1C1C1C;text-decoration:none;border-radius:6px;font-weight:600;">View your portal</a></p>
        <p>Thanks,<br/>The Hi Vis Bookkeeper</p>
      `,
    });

    return result;
  } catch (err) {
    console.error("[notify] Error:", err);
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Notify staff that a client has uploaded documents.
 * Called after a successful document upload.
 */
export async function notifyStaffDocumentUploaded(
  documentId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: true }; // No-op in demo mode

  try {
    const supabase = await createClient();

    // Get document with org info
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select(`
        id, file_name,
        organizations(id, name)
      `)
      .eq("id", documentId)
      .single();

    if (docErr || !doc) return { ok: false, error: "Document not found" };

    const org = doc.organizations as unknown as { id: string; name: string } | null;

    // Get staff email(s) — for now, use a configured support email
    const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL ?? "hello@hivisbooks.co.uk";

    const result = await sendEmail({
      to: staffEmail,
      subject: `New upload from ${org?.name ?? "a client"}`,
      html: `
        <p>A client has uploaded a new document:</p>
        <ul>
          <li><strong>File:</strong> ${doc.file_name}</li>
          <li><strong>Client:</strong> ${org?.name ?? "Unknown"}</li>
        </ul>
        <p><a href="${SITE_URL}/companies/${org?.id}" style="display:inline-block;padding:12px 24px;background:#5FC2B4;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">View client</a></p>
      `,
    });

    return result;
  } catch (err) {
    console.error("[notify] Error:", err);
    return { ok: false, error: (err as Error).message };
  }
}
