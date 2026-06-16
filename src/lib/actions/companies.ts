"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActivityType, CompanyStatus } from "@/lib/types";

function configured() {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export interface NewCompanyInput {
  name: string;
  company_number?: string;
  company_type?: string;
  status: CompanyStatus;
  sector?: string;
  sic_code?: string;
  town?: string;
  county?: string;
  postcode?: string;
  address_line1?: string;
  incorporated_on?: string;
  ch_status?: string;
  accounts_next_due?: string;
  confirmation_next_due?: string;
  phone?: string;
  contact_name?: string;
  contact_email?: string;
  tags?: string;
}

export async function createCompany(
  input: NewCompanyInput
): Promise<{ ok: boolean; id?: string; error?: string; demo?: boolean }> {
  if (!input.name?.trim()) return { ok: false, error: "Company name is required." };

  if (!configured()) {
    return {
      ok: false,
      demo: true,
      error: "Demo mode — connect Supabase to save records.",
    };
  }

  try {
    const supabase = await createClient();

    const clean = <T,>(v: T) => (v === "" ? null : v);
    const { data: org, error } = await supabase
      .from("organizations")
      .insert({
        name: input.name.trim(),
        company_number: clean(input.company_number),
        company_type: clean(input.company_type),
        status: input.status,
        sector: clean(input.sector),
        sic_code: clean(input.sic_code),
        town: clean(input.town),
        county: clean(input.county),
        postcode: clean(input.postcode),
        address_line1: clean(input.address_line1),
        incorporated_on: clean(input.incorporated_on),
        ch_status: clean(input.ch_status),
        accounts_next_due: clean(input.accounts_next_due),
        confirmation_next_due: clean(input.confirmation_next_due),
        phone: clean(input.phone),
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    if (input.contact_name?.trim()) {
      await supabase.from("contacts").insert({
        org_id: org.id,
        full_name: input.contact_name.trim(),
        email: clean(input.contact_email),
        is_primary: true,
        source: input.company_number ? "companies_house" : "manual",
      });
    }

    const tagLabels = (input.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    for (const label of tagLabels) {
      const { data: tag } = await supabase
        .from("tags")
        .upsert({ label }, { onConflict: "label" })
        .select("id")
        .single();
      if (tag)
        await supabase.from("taggables").upsert({
          tag_id: tag.id,
          entity_type: "organization",
          entity_id: org.id,
        });
    }

    revalidatePath("/companies");
    return { ok: true, id: org.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addNote(
  orgId: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  if (!body.trim()) return { ok: false, error: "Note is empty." };
  if (!configured())
    return { ok: false, error: "Demo mode — connect Supabase to save." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("notes").insert({
      org_id: orgId,
      body: body.trim(),
      created_by: user?.id ?? null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/companies/${orgId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function addActivity(
  orgId: string,
  input: { type: ActivityType; subject: string; body?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!input.subject.trim()) return { ok: false, error: "Subject is required." };
  if (!configured())
    return { ok: false, error: "Demo mode — connect Supabase to save." };
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("activities").insert({
      org_id: orgId,
      type: input.type,
      subject: input.subject.trim(),
      body: input.body?.trim() || null,
      created_by: user?.id ?? null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/companies/${orgId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
