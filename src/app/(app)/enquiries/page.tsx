import Link from "next/link";
import { Info } from "lucide-react";
import { getEnquiries } from "@/lib/data/enquiries";
import { EnquiriesList } from "@/components/enquiries/enquiries-list";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "new", label: "New" },
  { key: "reviewed", label: "Reviewed" },
  { key: "converted", label: "Converted" },
  { key: "spam", label: "Spam" },
  { key: "all", label: "All" },
];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "new";
  const items = await getEnquiries(status);

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">Enquiries</h1>
      <p className="mb-5 text-[13px] text-muted">
        Contact-form submissions from hivisbooks.co.uk. Convert good ones into
        prospects in a click.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/enquiries?status=${t.key}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              status === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted hover:border-primary hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
        <span className="ml-auto text-[12.5px] text-muted">{items.length} shown</span>
      </div>

      <div className="mb-4 flex items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-2.5 text-[12.5px] text-muted">
        <Info size={15} />
        Submissions arrive automatically from the website forms — no setup needed.
      </div>

      <EnquiriesList items={items} />
    </div>
  );
}
