import { NextResponse } from "next/server";
import { chSearch, isCHConfigured, type CHSearchItem } from "@/lib/companies-house";

export const dynamic = "force-dynamic";

// Demo results so the Add flow is clickable before a CH key is configured.
const DEMO: CHSearchItem[] = [
  { company_number: "15201847", title: "PRESTBURY GARDEN DESIGN LTD", company_status: "active", company_type: "ltd", address_snippet: "14 The Village, Prestbury, Macclesfield, SK10 4DG", date_of_creation: "2024-01-03" },
  { company_number: "14773320", title: "PRESTBURY PROPERTY HOLDINGS LIMITED", company_status: "active", company_type: "ltd", address_snippet: "Bridge House, Prestbury, SK10 4DR", date_of_creation: "2023-09-19" },
  { company_number: "13998210", title: "FRODSHAM FARM SHOP LTD", company_status: "active", company_type: "ltd", address_snippet: "Main Street, Frodsham, WA6 7AB", date_of_creation: "2022-02-22" },
  { company_number: "09112763", title: "TARPORLEY VETERINARY GROUP LTD", company_status: "active", company_type: "ltd", address_snippet: "High Street, Tarporley, CW6 0AG", date_of_creation: "2014-07-08" },
];

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ items: [], demo: !isCHConfigured() });

  if (!isCHConfigured()) {
    const items = DEMO.filter(
      (d) => d.title.toLowerCase().includes(q.toLowerCase()) || d.company_number.includes(q)
    );
    return NextResponse.json({ items, demo: true });
  }

  try {
    const items = await chSearch(q);
    return NextResponse.json({ items, demo: false });
  } catch (e) {
    return NextResponse.json(
      { items: [], error: (e as Error).message },
      { status: 502 }
    );
  }
}
