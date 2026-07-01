import { redirect } from "next/navigation";
import { getCisContext } from "@/lib/portal/data";

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export default async function CisCentrePage() {
  const ctx = await getCisContext();
  if (!ctx) redirect("/portal/login");

  const { subcontractors, records } = ctx;

  // Calculate totals
  const totalSuffered = records.reduce((sum, r) => sum + (r.suffered ?? 0), 0);
  const totalDeducted = records.reduce((sum, r) => sum + (r.deducted ?? 0), 0);

  // Group records by period for statements view
  const statementsByPeriod = records.map((r) => ({
    ...r,
    periodLabel: `${MONTHS[r.period_month]} ${r.period_year}`,
    hasStatement: !!r.statement_document_id,
  }));

  const activeSubcontractors = subcontractors.filter(
    (s) => s.status === "active"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">CIS Centre</h1>
        <p className="mt-1 text-sm text-muted">
          Your CIS deductions and subcontractor records.
        </p>
      </div>

      {/* Totals Summary */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Total Suffered
          </p>
          <p className="mt-2 text-2xl font-semibold text-danger">
            {formatCurrency(totalSuffered)}
          </p>
          <p className="mt-1 text-xs text-muted">
            CIS deducted from your payments
          </p>
        </div>
        <div className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Total Deducted
          </p>
          <p className="mt-2 text-2xl font-semibold text-accent">
            {formatCurrency(totalDeducted)}
          </p>
          <p className="mt-1 text-xs text-muted">
            CIS you&apos;ve deducted from subbies
          </p>
        </div>
      </section>

      {/* Statements Panel */}
      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-sm font-semibold">Monthly Statements</p>
        {statementsByPeriod.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No CIS records yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {statementsByPeriod.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm">{r.periodLabel}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    r.hasStatement
                      ? "bg-accent-soft text-accent"
                      : "bg-[#C8553D26] text-danger"
                  }`}
                >
                  {r.hasStatement ? "Uploaded" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Registered Subcontractors */}
      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-sm font-semibold">Registered Subcontractors</p>
        {activeSubcontractors.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No registered subcontractors.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">UTR</th>
                  <th className="pb-2 font-medium">Verification</th>
                  <th className="pb-2 font-medium text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeSubcontractors.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-2 font-medium">{sub.name}</td>
                    <td className="py-2 font-mono text-xs">
                      {sub.utr ?? "—"}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {sub.verification_number ?? "—"}
                    </td>
                    <td className="py-2 text-right">
                      {sub.cis_rate !== null ? `${sub.cis_rate}%` : "—"}
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
