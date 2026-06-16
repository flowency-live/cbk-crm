import { Info } from "lucide-react";
import { getContacts } from "@/lib/data/contacts";
import { ToolbarSearch } from "@/components/toolbar-search";
import { ContactsTable } from "@/components/contacts/contacts-table";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const { rows, demo } = await getContacts({ q: sp.q ?? "" });

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">Contacts</h1>
      <p className="mb-5 text-[13px] text-muted">
        Everyone across your companies and prospects.
      </p>

      {demo && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-accent bg-accent-soft px-3.5 py-2.5 text-[12.5px] font-medium text-accent">
          <Info size={16} />
          Demo data — connect Supabase to use live records.
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <ToolbarSearch basePath="/contacts" placeholder="Name, email, company…" />
        <span className="ml-auto whitespace-nowrap text-[12.5px] text-muted">
          {rows.length} contact{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <ContactsTable rows={rows} />
    </div>
  );
}
