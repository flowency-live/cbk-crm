import { redirect } from "next/navigation";
import { getPortalContext, type PortalDoc, type JobTask, type Deadline } from "@/lib/portal/data";
import { JOB_STATUS } from "@/lib/portal/status";
import { DEADLINE_KIND_META } from "@/lib/types";
import { UploadArea } from "@/components/portal/upload-area";
import { PortalTaskList } from "@/components/portal/portal-task-list";

const MONTHS = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDeadlineDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getDeadlineRag(deadline: Deadline): "green" | "amber" | "red" | "neutral" {
  if (deadline.completed) return "green";
  const now = new Date();
  const due = new Date(deadline.due_date);
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "red";
  if (daysUntil <= 14) return "amber";
  return "neutral";
}

const RAG_STYLES = {
  green: "border-accent bg-accent-soft text-accent",
  amber: "border-warning bg-[#E0A75C26] text-warning",
  red: "border-danger bg-[#C8553D26] text-danger",
  neutral: "border-border bg-surface text-foreground",
};

export default async function PortalHome() {
  const ctx = await getPortalContext();
  if (!ctx) redirect("/portal/login");

  const { org, job, tasks, documents, deadlines } = ctx;
  const meta = job ? JOB_STATUS[job.status] : null;
  const actionNeeded = meta?.clientActionNeeded ?? false;

  // Get client tasks for the current job
  const jobTasks = job ? tasks.filter((t: JobTask) => t.job_id === job.id) : [];
  const clientTasks = jobTasks.filter((t: JobTask) => t.owner === "client");

  // Filter upcoming deadlines (not completed, ordered by due_date)
  const upcomingDeadlines = deadlines.filter((d: Deadline) => !d.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {org?.name ?? "Your bookkeeping"}
        </h1>
        <p className="mt-1 text-sm text-muted">Everything in one secure place.</p>
      </div>

      {/* Current status */}
      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Current status
        </p>
        {job && meta ? (
          <div className="mt-2">
            <p className="text-lg font-semibold">
              <span aria-hidden>{meta.emoji}</span> {meta.client}
            </p>
            <p className="text-sm text-muted">{meta.clientSub}</p>
            <p className="mt-2 text-sm">
              {job.title}
              {job.period_label ? ` · ${job.period_label}` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No active job yet — your bookkeeper will set things up shortly.
          </p>
        )}
      </section>

      {/* What we need from you */}
      {actionNeeded && meta && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold">What we need from you</p>
          <p className="mt-1 text-sm text-muted">{meta.clientSub}</p>
        </section>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm font-semibold">Upcoming deadlines</p>
          <ul className="mt-3 space-y-2">
            {upcomingDeadlines.slice(0, 5).map((d: Deadline) => {
              const rag = getDeadlineRag(d);
              const kindMeta = DEADLINE_KIND_META[d.kind];
              return (
                <li
                  key={d.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${RAG_STYLES[rag]}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{kindMeta.icon}</span>
                    <span className="text-sm font-medium">{d.title}</span>
                  </div>
                  <span className="text-xs font-medium">
                    {formatDeadlineDate(d.due_date)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Client Tasks */}
      {clientTasks.length > 0 && (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm font-semibold">Your tasks</p>
          <p className="mb-3 text-xs text-muted">
            Things we need you to complete.
          </p>
          <PortalTaskList tasks={clientTasks} />
        </section>
      )}

      {/* Job Progress */}
      {jobTasks.length > 0 && (
        <section className="rounded-xl border border-border bg-elevated p-5">
          <p className="text-sm font-semibold">Job progress</p>
          <div className="mt-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="flex-1 rounded-full bg-border h-2 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{
                    width: `${Math.round((jobTasks.filter((t: JobTask) => t.status === "done").length / jobTasks.length) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted">
                {jobTasks.filter((t: JobTask) => t.status === "done").length}/{jobTasks.length}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Upload */}
      <UploadArea />

      {/* Recent documents */}
      <section className="rounded-xl border border-border bg-elevated p-5">
        <p className="text-sm font-semibold">Recent documents</p>
        {documents.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing uploaded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border text-sm">
            {documents.map((d: PortalDoc) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span className="truncate">{d.file_name}</span>
                <span className="ml-3 shrink-0 text-xs text-muted">
                  {d.period_month ? `${MONTHS[d.period_month]} ` : ""}
                  {d.period_year ?? ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
