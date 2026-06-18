// Demo fallback so the app is fully clickable before Supabase is connected.
// Used automatically when NEXT_PUBLIC_SUPABASE_URL is unset, or if a query fails.

import type { Activity, CompanyListRow, Contact, Note } from "./types";

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

function org(p: Partial<CompanyListRow> & { id: string; name: string }): CompanyListRow {
  return {
    trading_name: null,
    company_number: null,
    company_type: "Private limited",
    status: "prospect",
    sector: null,
    sic_code: null,
    category: "Other",
    address_line1: null,
    address_line2: null,
    town: null,
    county: null,
    postcode: null,
    incorporated_on: null,
    ch_status: "Active",
    accounts_next_due: null,
    confirmation_next_due: null,
    owner_id: null,
    website: null,
    phone: null,
    enriched_at: null,
    enriched_by: null,
    enrichment: {},
    deleted_at: null,
    created_at: daysAgo(120),
    updated_at: daysAgo(2),
    primary_contact_name: null,
    primary_contact_email: null,
    last_activity_at: null,
    tags: [],
    ...p,
  };
}

export const demoCompanies: CompanyListRow[] = [
  org({ id: "1", name: "Bollington Brew Co Ltd", company_number: "09832145", status: "client", sector: "Hospitality", sic_code: "11050 - Manufacture of beer", town: "Bollington", county: "Cheshire East", postcode: "SK10 5JH", incorporated_on: "2016-03-12", accounts_next_due: "2026-12-31", confirmation_next_due: "2027-03-26", phone: "01625 573214", primary_contact_name: "Sarah Mellor", primary_contact_email: "sarah@bollingtonbrew.co.uk", last_activity_at: daysAgo(2), tags: ["VAT", "Monthly"] }),
  org({ id: "2", name: "Wilmslow Wellness Studio Ltd", company_number: "12044871", status: "client", sector: "Health & Fitness", sic_code: "93130 - Fitness facilities", town: "Wilmslow", county: "Cheshire East", postcode: "SK9 1BX", incorporated_on: "2019-08-04", accounts_next_due: "2027-04-30", confirmation_next_due: "2026-08-18", phone: "01625 449082", primary_contact_name: "Priya Shah", primary_contact_email: "priya@wilmslowwellness.com", last_activity_at: daysAgo(1), tags: ["Self-assessment"] }),
  org({ id: "3", name: "Chester Timber & Joinery Ltd", company_number: "08120934", status: "client", sector: "Construction", sic_code: "16230 - Builders carpentry", town: "Chester", county: "Cheshire West", postcode: "CH1 3AE", incorporated_on: "2012-06-21", accounts_next_due: "2026-09-30", confirmation_next_due: "2026-07-05", phone: "01244 320118", primary_contact_name: "Mark Ridley", primary_contact_email: "accounts@chestertimber.co.uk", last_activity_at: daysAgo(3), tags: ["CIS", "VAT"] }),
  org({ id: "4", name: "Knutsford Kitchen Studio Ltd", company_number: "13567229", status: "prospect", sector: "Retail", sic_code: "47591 - Retail of furniture", town: "Knutsford", county: "Cheshire East", postcode: "WA16 6DA", incorporated_on: "2021-09-15", accounts_next_due: "2026-12-31", confirmation_next_due: "2026-09-14", phone: "01565 651120", primary_contact_name: "Helen Carter", primary_contact_email: "helen@knutsfordkitchens.co.uk", last_activity_at: daysAgo(7), tags: ["Lead"] }),
  org({ id: "5", name: "Crewe Auto Repairs Ltd", company_number: "10299384", status: "client", sector: "Automotive", sic_code: "45200 - Maintenance of motor vehicles", town: "Crewe", county: "Cheshire East", postcode: "CW1 2QP", incorporated_on: "2017-01-30", accounts_next_due: "2026-10-31", confirmation_next_due: "2027-02-12", phone: "01270 215583", primary_contact_name: "Dave Hollins", primary_contact_email: "dave@creweauto.co.uk", last_activity_at: daysAgo(4), tags: ["VAT", "Cash basis"] }),
  org({ id: "6", name: "Nantwich Digital Ltd", company_number: "14002271", status: "prospect", sector: "Technology", sic_code: "62012 - Business software development", town: "Nantwich", county: "Cheshire East", postcode: "CW5 5AS", incorporated_on: "2022-02-02", accounts_next_due: "2027-02-28", confirmation_next_due: "2027-02-01", phone: "01270 887441", primary_contact_name: "Olivia Grant", primary_contact_email: "olivia@nantwichdigital.com", last_activity_at: daysAgo(14), tags: ["Lead", "R&D"] }),
  org({ id: "7", name: "Macclesfield Print House Ltd", company_number: "07788321", status: "dormant", sector: "Manufacturing", sic_code: "18129 - Printing n.e.c.", town: "Macclesfield", county: "Cheshire East", postcode: "SK11 6LF", incorporated_on: "2011-11-18", confirmation_next_due: "2026-11-22", phone: "01625 612009", primary_contact_name: "Geoff Barlow", primary_contact_email: "geoff@maccprint.co.uk", last_activity_at: daysAgo(90), tags: ["Dormant"] }),
  org({ id: "8", name: "Sandbach Florals Ltd", company_number: "13881204", status: "client", sector: "Retail", sic_code: "47760 - Retail of flowers & plants", town: "Sandbach", county: "Cheshire East", postcode: "CW11 1AT", incorporated_on: "2021-12-09", accounts_next_due: "2026-09-30", confirmation_next_due: "2026-12-08", phone: "01270 768432", primary_contact_name: "Emma Whitlow", primary_contact_email: "hello@sandbachflorals.co.uk", last_activity_at: daysAgo(6), tags: ["VAT", "Seasonal"] }),
  org({ id: "9", name: "Northwich Care Services Ltd", company_number: "11540982", status: "client", sector: "Healthcare", sic_code: "88100 - Social work without accommodation", town: "Northwich", county: "Cheshire West", postcode: "CW9 5BT", incorporated_on: "2018-08-25", accounts_next_due: "2027-05-31", confirmation_next_due: "2026-08-30", phone: "01606 331207", primary_contact_name: "Rachel Owen", primary_contact_email: "rachel@northwichcare.co.uk", last_activity_at: daysAgo(0), tags: ["Payroll", "VAT exempt"] }),
  org({ id: "10", name: "Alderley Edge Interiors Ltd", company_number: "12993017", status: "prospect", sector: "Retail", sic_code: "74100 - Specialised design", town: "Alderley Edge", county: "Cheshire East", postcode: "SK9 7DZ", incorporated_on: "2020-05-11", accounts_next_due: "2027-05-31", confirmation_next_due: "2027-05-10", phone: "01625 590112", primary_contact_name: "Charlotte Dean", primary_contact_email: "charlotte@aeinteriors.co.uk", last_activity_at: daysAgo(5), tags: ["Lead"] }),
];

const C = (org_id: string, full_name: string, email: string | null, title: string, is_primary = false): Contact => ({
  id: `${org_id}-${full_name}`, org_id, full_name, email, phone: null, title, is_primary, source: "companies_house", deleted_at: null, created_at: daysAgo(100), updated_at: daysAgo(100),
});

export const demoContacts: Record<string, Contact[]> = {
  "1": [C("1", "Sarah Mellor", "sarah@bollingtonbrew.co.uk", "Director", true), C("1", "James Mellor", null, "Director")],
  "2": [C("2", "Priya Shah", "priya@wilmslowwellness.com", "Director", true)],
  "3": [C("3", "Mark Ridley", "accounts@chestertimber.co.uk", "Director", true), C("3", "Anne Ridley", null, "Director")],
  "4": [C("4", "Helen Carter", "helen@knutsfordkitchens.co.uk", "Director", true)],
  "5": [C("5", "Dave Hollins", "dave@creweauto.co.uk", "Director", true)],
  "6": [C("6", "Olivia Grant", "olivia@nantwichdigital.com", "Director", true), C("6", "Sam Grant", null, "Director")],
  "7": [C("7", "Geoff Barlow", "geoff@maccprint.co.uk", "Director", true)],
  "8": [C("8", "Emma Whitlow", "hello@sandbachflorals.co.uk", "Director", true)],
  "9": [C("9", "Rachel Owen", "rachel@northwichcare.co.uk", "Director", true), C("9", "Paul Owen", null, "Director")],
  "10": [C("10", "Charlotte Dean", "charlotte@aeinteriors.co.uk", "Director", true)],
};

const A = (org_id: string, type: Activity["type"], subject: string, body: string, days: number): Activity => ({
  id: `${org_id}-${subject}`, org_id, contact_id: null, deal_id: null, type, subject, body, due_at: null, completed_at: null, created_by: null, created_at: daysAgo(days),
});

export const demoActivities: Record<string, Activity[]> = {
  "1": [A("1", "call", "Discussed Q2 VAT return", "Confirmed figures with Sarah", 2), A("1", "email", "Sent payroll summary", "8 staff", 7)],
  "2": [A("2", "meeting", "Year-end planning", "Reviewed approach", 1)],
  "3": [A("3", "call", "CIS subcontractor query", "6 subcontractors", 3), A("3", "task", "Chase missing receipts", "", 5)],
  "4": [A("4", "email", "Sent proposal", "Awaiting response", 7)],
  "5": [A("5", "call", "Quarterly catch-up", "All on track", 4)],
  "6": [A("6", "email", "Intro email", "Possible R&D claim", 14)],
  "7": [A("7", "task", "Filed dormant accounts", "Submitted to CH", 90)],
  "8": [A("8", "call", "Valentine stock financing", "Cashflow plan agreed", 6)],
  "9": [A("9", "meeting", "Payroll for 22 carers", "Variable hours setup", 0)],
  "10": [A("10", "email", "Sent welcome pack", "Referred by Knutsford", 5)],
};

const N = (org_id: string, body: string): Note => ({
  id: `${org_id}-note`, org_id, body, created_by: null, created_at: daysAgo(2),
});

export const demoNotes: Record<string, Note[]> = {
  "1": [N("1", "Prefers Xero. Quarterly VAT, monthly payroll for 8 staff.")],
  "2": [N("2", "Sole director. Wants help with self-assessment too.")],
  "3": [N("3", "CIS scheme - 6 subcontractors. Confirmation statement due soon.")],
  "4": [N("4", "Warm lead from networking event. Unhappy with current national firm.")],
  "5": [N("5", "Cash-heavy business, watch reconciliations.")],
  "6": [N("6", "May qualify for R&D tax credits. Follow up.")],
  "7": [N("7", "Trading paused 2025. Filing dormant accounts only.")],
  "8": [N("8", "Highly seasonal - peaks Feb & May. Plan cashflow around it.")],
  "9": [N("9", "Large payroll - 22 staff, variable hours. VAT exempt supplies.")],
  "10": [N("10", "High-end interior design. Referred by Knutsford Kitchen Studio.")],
};
