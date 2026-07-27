"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPortalUser } from "@/lib/data/portal";
import { sendEmail } from "@/lib/email";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface MyDetailsInput {
  full_name: string;
  phone: string;
}

/**
 * Portal client updates their own contact details. RLS (0021) restricts the
 * update to the contact row linked via portal_users. Staff get an email so
 * changes never go unnoticed.
 */
export async function updateMyDetails(
  input: MyDetailsInput
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const portalUser = await getPortalUser();
  if (!portalUser?.contact_id) {
    return { ok: false, error: "No editable contact on file — message us and we'll update it." };
  }

  const full_name = input.full_name.trim();
  const phone = input.phone.trim();
  if (!full_name) return { ok: false, error: "Name can't be empty." };

  const { error } = await supabase
    .from("contacts")
    .update({ full_name, phone: phone || null })
    .eq("id", portalUser.contact_id);

  if (error) return { ok: false, error: error.message };

  // Nudge staff — env-gated, no-ops without RESEND_API_KEY
  const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL;
  if (staffEmail) {
    await sendEmail({
      to: staffEmail,
      subject: "Portal: a client updated their details",
      html: `<p>${full_name} updated their contact details in the portal (phone: ${phone || "—"}).</p>`,
    });
  }

  revalidatePath("/portal/details");
  return { ok: true };
}
