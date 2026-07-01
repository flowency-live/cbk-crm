import { redirect } from "next/navigation";
import { getVatContext } from "@/lib/portal/data";
import { VAT_STATUS_META } from "@/lib/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default async function VatCentrePage() {
  const ctx = await getVatContext();
  if (!ctx) redirect("/portal/login");

  const { periods } = ctx;
  const currentPeriod = periods.find(
    (p) => p.status === "open" || p.status === "under_review" || p.status === "awaiting_approval"
  );
  const previousPeriods = periods.filter(
    (p) => p.status === "submitted" || p.status === "closed"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">VAT Centre</h1>
        <p className="mt-1 text-sm text-muted">
          Your VAT returns and submission status.
        </p>
      </div>

      {/* Current Period Card */}
      {currentPeriod ? (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Current Period
          </p>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">
                {formatDate(currentPeriod.period_start)} – {formatDate(currentPeriod.period_end)}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  VAT_STATUS_META[currentPeriod.status].className
                }`}
              >
                {VAT_STATUS_META[currentPeriod.status].label}
              </span>
            </div>
            {currentPeriod.estimated_due !== null && (
              <div className="text-right">
                <p className="text-xs text-muted">Estimated Due</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(currentPeriod.estimated_due)}
                </p>
              </div>
            )}
          </div>

          {/* Key Dates */}
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted">Submission Deadline</p>
              <p className="text-sm font-medium">
                {formatDate(currentPeriod.submission_due)}
              </p>
            </div>
            {currentPeriod.submitted_at && (
              <div>
                <p className="text-xs text-muted">Submitted</p>
                <p className="text-sm font-medium">
                  {formatDate(currentPeriod.submitted_at)}
                </p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">
            No active VAT period. Your bookkeeper will set one up when needed.
          </p>
        </section>
      )}

      {/* Previous Returns */}
      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-sm font-semibold">Previous Returns</p>
        {previousPeriods.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No previous returns yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">HMRC Reference</th>
                  <th className="pb-2 font-medium text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previousPeriods.map((period) => (
                  <tr key={period.id}>
                    <td className="py-2">
                      {formatDate(period.period_start)} – {formatDate(period.period_end)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          VAT_STATUS_META[period.status].className
                        }`}
                      >
                        {VAT_STATUS_META[period.status].label}
                      </span>
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {period.hmrc_reference ?? "—"}
                    </td>
                    <td className="py-2 text-right text-muted">
                      {formatDate(period.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
