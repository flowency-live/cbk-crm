"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function setEnquiryStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("website_enquiries")
      .update({ status })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/enquiries");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Turn an enquiry into a CRM prospect: organization + primary contact + an activity. */
export async function convertEnquiry(
  id: string
): Promise<{ ok: boolean; orgId?: string; error?: string }> {
  if (!configured()) return { ok: false, error: "Demo mode." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: enq } = await supabase
      .from("website_enquiries")
      .select("*")
      .eq("id", id)
      .single();
    if (!enq) return { ok: false, error: "Enquiry not found." };
    if (enq.converted_org_id)
      return { ok: true, orgId: enq.converted_org_id as string };

    const orgName =
      (enq.business_name && String(enq.business_name).trim()) || enq.name;

    const { data: org, error } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        status: "discovered",
        category: "Other",
        phone: enq.phone,
        enriched_by: "website_enquiry",
        enrichment: {
          source: "website",
          page_source: enq.page_source,
          service_interest: enq.service_interest,
          message: enq.message,
          enquiry_name: enq.name,
          enquiry_email: enq.email,
        },
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    await supabase.from("contacts").insert({
      org_id: org.id,
      full_name: enq.name,
      email: enq.email,
      phone: enq.phone,
      is_primary: true,
      source: "website",
    });

    await supabase.from("activities").insert({
      org_id: org.id,
      type: "email",
      subject: `Website enquiry${enq.service_interest ? ` — ${enq.service_interest}` : ""}`,
      body: enq.message || `Enquiry from ${enq.page_source ?? "website"}.`,
      created_by: user?.id ?? null,
    });

    await supabase
      .from("website_enquiries")
      .update({ status: "converted", converted_org_id: org.id })
      .eq("id", id);

    revalidatePath("/enquiries");
    revalidatePath("/companies");
    return { ok: true, orgId: org.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
