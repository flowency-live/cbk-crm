import { NextResponse } from "next/server";
import {
  chOfficers,
  chProfile,
  chProfileToOrg,
  isCHConfigured,
} from "@/lib/companies-house";
import { isSupabaseConfigured } from "@/lib/data/companies";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;

  if (!isCHConfigured()) {
    return NextResponse.json(
      { error: "Companies House API key not configured", demo: true },
      { status: 501 }
    );
  }

  try {
    const [profile, officers] = await Promise.all([
      chProfile(number),
      chOfficers(number),
    ]);
    const mapped = chProfileToOrg(profile);

    // Cache + update the stored org (if it exists) using the privileged client.
    if (isSupabaseConfigured()) {
      try {
        const svc = createServiceClient();
        await svc.from("companies_house_cache").upsert({
          company_number: number,
          payload: profile,
          fetched_at: new Date().toISOString(),
        });
        await svc
          .from("organizations")
          .update({
            ...mapped,
            enriched_at: new Date().toISOString(),
            enriched_by: "companies_house",
          })
          .eq("company_number", number);
      } catch {
        // non-fatal — still return the fresh data
      }
    }

    return NextResponse.json({ profile, officers, mapped });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
