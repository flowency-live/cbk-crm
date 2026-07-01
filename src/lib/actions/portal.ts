"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notifyStaffDocumentUploaded } from "./notifications";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in." };
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!prof || !["admin", "staff"].includes(prof.role as string)) {
    return { ok: false as const, error: "Staff only." };
  }
  return { ok: true as const, userId: user.id };
}

/**
 * Provision a client for the portal and send a passwordless magic invite.
 * Staff-only. Creates the auth user (if new), forces a `client` profile, and
 * links a tenant-scoped portal_users row. Idempotent on re-invite.
 */
export async function inviteClientToPortal(input: {
  orgId: string;
  email: string;
  contactId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.error };

  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "Email required." };

  const svc = createServiceClient();

  const { data: org } = await svc
    .from("organizations")
    .select("id, tenant_id")
    .eq("id", input.orgId)
    .single();
  if (!org) return { ok: false, error: "Organisation not found." };

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/portal`;

  // Invite (or resolve an existing user).
  let authUserId: string | null = null;
  const { data: invited, error: invErr } = await svc.auth.admin.inviteUserByEmail(
    email,
    { redirectTo }
  );
  if (invErr) {
    // Already registered — find them and (re)send a magic link instead.
    const { data: link, error: linkErr } = await svc.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (linkErr || !link?.user) {
      return { ok: false, error: invErr.message };
    }
    authUserId = link.user.id;
  } else {
    authUserId = invited?.user?.id ?? null;
  }
  if (!authUserId) return { ok: false, error: "Could not provision user." };

  // Force a client profile so auth_role() is 'client', not the staff fallback.
  await svc
    .from("profiles")
    .upsert({ id: authUserId, email, role: "client" }, { onConflict: "id" });

  const { error: puErr } = await svc.from("portal_users").upsert(
    {
      auth_user_id: authUserId,
      org_id: org.id,
      tenant_id: org.tenant_id,
      contact_id: input.contactId ?? null,
    },
    { onConflict: "auth_user_id" }
  );
  if (puErr) return { ok: false, error: puErr.message };

  return { ok: true };
}

/**
 * Client uploads one or more documents. Runs as the signed-in client (RLS
 * enforces org isolation). Files are stored under {org_id}/{year}/{month}/.
 */
export async function uploadDocuments(
  formData: FormData
): Promise<{ ok: boolean; count?: number; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: pu } = await supabase
    .from("portal_users")
    .select("org_id, tenant_id")
    .eq("auth_user_id", user.id)
    .single();
  if (!pu) return { ok: false, error: "No portal access." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { ok: false, error: "No files selected." };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const uploadedIds: string[] = [];

  for (const file of files) {
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${pu.org_id}/${year}/${String(month).padStart(2, "0")}/${randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("client-documents")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (upErr) return { ok: false, error: upErr.message };

    const { data: doc, error: insErr } = await supabase
      .from("documents")
      .insert({
        tenant_id: pu.tenant_id,
        org_id: pu.org_id,
        uploaded_by: user.id,
        file_name: file.name,
        storage_path: path,
        period_month: month,
        period_year: year,
      })
      .select("id")
      .single();
    if (insErr) return { ok: false, error: insErr.message };
    if (doc) uploadedIds.push(doc.id);
  }

  // Notify staff about the first uploaded document (one email per batch)
  if (uploadedIds.length > 0) {
    await notifyStaffDocumentUploaded(uploadedIds[0]);
  }

  revalidatePath("/portal");
  return { ok: true, count: files.length };
}
