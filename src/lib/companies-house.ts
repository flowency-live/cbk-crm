// Companies House Public Data API client — SERVER ONLY.
// Free key: https://developer.company-information.service.gov.uk/
// Auth: HTTP Basic with the API key as the username (blank password).
// Rate limit: 600 requests / 5 min. All calls are proxied through our /api routes
// so the key never reaches the browser.

const BASE = "https://api.company-information.service.gov.uk";

function authHeader() {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new Error("COMPANIES_HOUSE_API_KEY is not set");
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export interface CHSearchItem {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  address_snippet: string;
  date_of_creation?: string;
}

export interface CHProfile {
  company_name: string;
  company_number: string;
  company_status: string;
  type: string;
  date_of_creation: string;
  sic_codes?: string[];
  registered_office_address?: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
  };
  accounts?: { next_due?: string };
  confirmation_statement?: { next_due?: string };
}

export interface CHOfficer {
  name: string;
  officer_role: string;
  appointed_on?: string;
}

export async function chSearch(query: string, limit = 10): Promise<CHSearchItem[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`,
    { headers: { Authorization: authHeader() }, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Companies House search failed (${res.status})`);
  const data = await res.json();
  return (data.items ?? []).map((i: Record<string, unknown>) => ({
    company_number: i.company_number,
    title: i.title,
    company_status: i.company_status,
    company_type: i.company_type,
    address_snippet: i.address_snippet,
    date_of_creation: i.date_of_creation,
  }));
}

export async function chProfile(number: string): Promise<CHProfile> {
  const res = await fetch(`${BASE}/company/${encodeURIComponent(number)}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Companies House profile failed (${res.status})`);
  return res.json();
}

export async function chOfficers(number: string): Promise<CHOfficer[]> {
  const res = await fetch(
    `${BASE}/company/${encodeURIComponent(number)}/officers?items_per_page=35`,
    { headers: { Authorization: authHeader() }, cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map((o: Record<string, unknown>) => ({
    name: o.name,
    officer_role: o.officer_role,
    appointed_on: o.appointed_on,
  }));
}

/** Map a CH profile into our organization shape for the Add form. */
export function chProfileToOrg(p: CHProfile) {
  const a = p.registered_office_address ?? {};
  return {
    name: p.company_name,
    company_number: p.company_number,
    company_type: p.type,
    ch_status: p.company_status,
    incorporated_on: p.date_of_creation,
    sic_code: p.sic_codes?.[0] ?? null,
    address_line1: a.address_line_1 ?? null,
    address_line2: a.address_line_2 ?? null,
    town: a.locality ?? null,
    county: a.region ?? null,
    postcode: a.postal_code ?? null,
    accounts_next_due: p.accounts?.next_due ?? null,
    confirmation_next_due: p.confirmation_statement?.next_due ?? null,
  };
}

export function isCHConfigured() {
  return !!process.env.COMPANIES_HOUSE_API_KEY;
}
