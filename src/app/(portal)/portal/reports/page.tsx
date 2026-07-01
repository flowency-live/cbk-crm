import { redirect } from "next/navigation";
import { getReportsContext } from "@/lib/portal/data";
import { REPORT_TYPE_META } from "@/lib/types";
import { ReportDownloadButton } from "@/components/portal/report-download-button";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ReportsPage() {
  const ctx = await getReportsContext();
  if (!ctx) redirect("/portal/login");

  const { reports } = ctx;

  // Group reports by period_label or type
  const groupedByPeriod = reports.reduce(
    (acc, r) => {
      const key = r.period_label ?? "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    },
    {} as Record<string, typeof reports>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted">
          Your financial reports and statements.
        </p>
      </div>

      {reports.length === 0 ? (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm text-muted">
            No reports available yet. Your bookkeeper will upload them here.
          </p>
        </section>
      ) : (
        Object.entries(groupedByPeriod).map(([period, periodReports]) => (
          <section
            key={period}
            className="rounded-xl border border-border bg-elevated p-5"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {period}
            </p>
            <div className="space-y-3">
              {periodReports.map((report) => {
                const typeMeta = REPORT_TYPE_META[report.type];
                return (
                  <div
                    key={report.id}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{report.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${typeMeta.className}`}
                          >
                            {typeMeta.label}
                          </span>
                          <span className="text-xs text-muted">
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                      </div>
                      <ReportDownloadButton storagePath={report.storage_path} />
                    </div>
                    {report.ai_commentary && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-medium text-primary">
                          View AI Commentary
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                          {report.ai_commentary}
                        </p>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
