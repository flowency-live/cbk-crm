import { getCompanies } from "@/lib/data/companies";
import { CompanyFilters } from "@/components/companies/company-filters";
import { CompaniesTable } from "@/components/companies/companies-table";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = sp.status ?? "all";
  const category = sp.category ?? "all";

  const { rows, demo } = await getCompanies({ q, status, category });

  return (
    <div className="px-7 py-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="font-brand text-2xl font-bold">Companies</h1>
        <AddCompanyDialog />
      </div>
      <p className="mb-5 text-[13px] text-muted">
        Search, filter and manage every client and prospect.
      </p>

      {demo && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-accent bg-accent-soft px-3.5 py-2.5 text-[12.5px] font-medium text-accent">
          <Info size={16} />
          Demo data — connect Supabase (set env vars) to use live records.
        </div>
      )}

      <CompanyFilters
        q={q}
        status={status}
        category={category}
        showing={rows.length}
      />

      <CompaniesTable rows={rows} />
    </div>
  );
}
