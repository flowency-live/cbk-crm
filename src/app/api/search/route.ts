import { NextResponse } from "next/server";
import { getCompanies } from "@/lib/data/companies";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const { rows } = await getCompanies({ q });

  const companies = rows.slice(0, 8).map((r) => ({
    id: r.id,
    name: r.name,
    town: r.town,
    sector: r.sector,
    company_number: r.company_number,
    matched: matchField(r, q),
  }));

  const contacts = rows
    .filter((r) => r.primary_contact_name)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      name: r.primary_contact_name!,
      email: r.primary_contact_email,
      companyName: r.name,
    }));

  return NextResponse.json({ companies, contacts });
}

function matchField(r: { name: string; town: string | null; sector: string | null; postcode: string | null; company_number: string | null }, q: string) {
  const n = q.trim().toLowerCase();
  if (!n) return "";
  if (r.name.toLowerCase().includes(n)) return "";
  if (r.town?.toLowerCase().includes(n)) return "location";
  if (r.sector?.toLowerCase().includes(n)) return "sector";
  if (r.postcode?.toLowerCase().includes(n)) return "postcode";
  if (r.company_number?.includes(n)) return "number";
  return "";
}
