"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  RefreshCw,
  ChevronDown,
  UserPlus,
  Briefcase,
  Plus,
  FileText,
  Clock,
  Shield,
  Check,
  X,
  Upload,
} from "lucide-react";
import {
  STATUS_META,
  STATUS_FLOW,
  CATEGORIES,
  REPORT_TYPE_META,
  DEADLINE_KIND_META,
  AML_DECISION_META,
  type Activity,
  type ActivityType,
  type AmlCheck,
  type AmlDecision,
  type CompanyStatus,
  type Contact,
  type Deadline,
  type DeadlineKind,
  type Job,
  type JobTask,
  type JobTaskStatus,
  type Note,
  type Organization,
  type Report,
  type ReportType,
} from "@/lib/types";
import { JOB_STATUS, JOB_STATUS_ORDER, type JobStatus } from "@/lib/portal/status";
import { cn, formatDate, initials, timeAgo } from "@/lib/utils";
import {
  addActivity,
  addNote,
  updateCompanyStatus,
  updateCompanyCategory,
} from "@/lib/actions/companies";
import { inviteClientToPortal } from "@/lib/actions/portal";
import { createJob, updateJobStatus } from "@/lib/actions/jobs";
import { instantiateWorkflow, updateJobTaskStatus } from "@/lib/actions/workflow";
import { uploadReport } from "@/lib/actions/reports";
import { createDeadline, completeDeadline } from "@/lib/actions/deadlines";
import { createAmlCheck, recordAmlDecision } from "@/lib/actions/aml";
import { SelectMenu } from "@/components/ui/select-menu";

const TABS = ["Overview", "Contacts", "Jobs", "Reports", "Deadlines", "AML", "Companies House", "Activities", "Notes"] as const;
type Tab = (typeof TABS)[number];

const WORKFLOW_TEMPLATES = [
  { key: "monthly_bookkeeping", label: "Monthly Bookkeeping (13 tasks)" },
  { key: "vat", label: "VAT Return (12 tasks)" },
  { key: "cleanup", label: "Cleanup (17 tasks)" },
  { key: "cis_registration", label: "CIS Registration (11 tasks)" },
  { key: "cis_compliance", label: "CIS Compliance (14 tasks)" },
];

export function CompanyDetail({
  org,
  contacts,
  activities,
  notes,
  jobs,
  jobTasks,
  reports,
  deadlines,
  amlChecks,
}: {
  org: Organization;
  contacts: Contact[];
  activities: Activity[];
  notes: Note[];
  jobs: Job[];
  jobTasks: JobTask[];
  reports: Report[];
  deadlines: Deadline[];
  amlChecks: AmlCheck[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [refreshing, setRefreshing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function refreshFromCH() {
    if (!org.company_number) return;
    setRefreshing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`/api/companies-house/company/${org.company_number}`);
      if (!res.ok) throw new Error();
      setSyncMsg("Synced from Companies House");
      router.refresh();
    } catch {
      setSyncMsg("Couldn't reach Companies House (check API key)");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="px-7 py-6">
      <Link
        href="/companies"
        className="mb-4 inline-flex items-center gap-2 text-[13px] text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Companies
      </Link>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary-soft text-base font-bold text-primary">
            {initials(org.name)}
          </div>
          <div>
            <h1 className="font-brand text-[22px] font-bold leading-tight">{org.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[13px] text-muted">
              <StatusSelect orgId={org.id} value={org.status} />
              {org.town && <span>📍 {[org.town, org.county].filter(Boolean).join(", ")}</span>}
              {org.sector && <span>🏷 {org.sector}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-0.5 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3.5 py-3 text-[13px] font-semibold transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {tab === "Overview" && <Overview org={org} />}
        {tab === "Contacts" && <People orgId={org.id} contacts={contacts} />}
        {tab === "Jobs" && <Jobs orgId={org.id} jobs={jobs} jobTasks={jobTasks} />}
        {tab === "Reports" && <Reports orgId={org.id} reports={reports} jobs={jobs} />}
        {tab === "Deadlines" && <Deadlines orgId={org.id} deadlines={deadlines} />}
        {tab === "AML" && <AmlPanel orgId={org.id} amlChecks={amlChecks} />}
        {tab === "Companies House" && (
          <CompaniesHouse
            org={org}
            contacts={contacts}
            refreshing={refreshing}
            onRefresh={refreshFromCH}
            syncMsg={syncMsg}
          />
        )}
        {tab === "Activities" && (
          <Activities orgId={org.id} activities={activities} />
        )}
        {tab === "Notes" && <Notes orgId={org.id} notes={notes} />}
      </div>
    </div>
  );
}

function StatusSelect({
  orgId,
  value,
}: {
  orgId: string;
  value: CompanyStatus;
}) {
  const router = useRouter();
  const [val, setVal] = useState<CompanyStatus>(value);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = STATUS_META[val] ?? STATUS_META.prospect;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function pick(next: CompanyStatus) {
    setOpen(false);
    if (next === val) return;
    const prev = val;
    setVal(next);
    setSaving(true);
    const res = await updateCompanyStatus(orgId, next);
    setSaving(false);
    if (res.ok) router.refresh();
    else setVal(prev);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        aria-label="Change status"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold transition hover:brightness-95",
          meta.className,
          saving && "opacity-60"
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {meta.label}
        <ChevronDown size={13} className="opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 top-9 z-50 w-52 overflow-hidden rounded-lg border border-border bg-elevated p-1 shadow-card">
          {STATUS_FLOW.map((s) => {
            const m = STATUS_META[s];
            return (
              <button
                key={s}
                onClick={() => pick(s)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface",
                  s === val && "bg-surface"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
                    m.className
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategorySelect({
  orgId,
  value,
}: {
  orgId: string;
  value: string | null;
}) {
  const router = useRouter();
  const [val, setVal] = useState<string>(value ?? "Other");
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    const prev = val;
    setVal(next);
    setSaving(true);
    const res = await updateCompanyCategory(orgId, next);
    setSaving(false);
    if (res.ok) router.refresh();
    else setVal(prev);
  }

  return (
    <span className={saving ? "opacity-60" : undefined}>
      <SelectMenu
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        value={[val]}
        onChange={(next) => change(next[0] ?? "Other")}
        menuWidth="w-60"
      />
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="text-sm font-medium">{value || "—"}</div>
    </div>
  );
}

function Overview({ org }: { org: Organization }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        <Field label="Company number" value={org.company_number} />
        <Field label="Type" value={org.company_type} />
        <Field label="Incorporated" value={formatDate(org.incorporated_on)} />
        <Field label="Phone" value={org.phone} />
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Category
          </div>
          <CategorySelect orgId={org.id} value={org.category} />
        </div>
        <Field label="Trade" value={org.sector} />
        <Field label="SIC code" value={org.sic_code} />
        <div className="col-span-2">
          <Field
            label="Registered office"
            value={[org.address_line1, org.town, org.county, org.postcode]
              .filter(Boolean)
              .join(", ")}
          />
        </div>
      </div>
    </>
  );
}

function People({ orgId, contacts }: { orgId: string; contacts: Contact[] }) {
  const router = useRouter();
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteMsg, setInviteMsg] = useState<Record<string, string>>({});

  async function invite(contactId: string, email: string) {
    setInviting(contactId);
    setInviteMsg((m) => ({ ...m, [contactId]: "" }));
    const res = await inviteClientToPortal({ orgId, email, contactId });
    setInviting(null);
    if (res.ok) {
      setInviteMsg((m) => ({ ...m, [contactId]: "Invited!" }));
      router.refresh();
    } else {
      setInviteMsg((m) => ({ ...m, [contactId]: res.error ?? "Failed" }));
    }
  }

  if (!contacts.length)
    return <p className="text-sm text-muted">No contacts yet.</p>;
  return (
    <div>
      <SectionTitle>People ({contacts.length})</SectionTitle>
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
              {initials(c.full_name)}
            </div>
            <div>
              <div className="font-semibold">
                {c.full_name}
                {c.is_primary && (
                  <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    Primary
                  </span>
                )}
              </div>
              <div className="text-[12px] text-muted">
                {[c.title, c.email].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inviteMsg[c.id] && (
              <span className={cn("text-[11px]", inviteMsg[c.id] === "Invited!" ? "text-accent" : "text-danger")}>
                {inviteMsg[c.id]}
              </span>
            )}
            {c.email && (
              <button
                onClick={() => invite(c.id, c.email!)}
                disabled={inviting === c.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:border-primary disabled:opacity-50"
                title="Invite to client portal"
              >
                <UserPlus size={13} />
                {inviting === c.id ? "Inviting…" : "Invite to Portal"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CompaniesHouse({
  org,
  contacts,
  refreshing,
  onRefresh,
  syncMsg,
}: {
  org: Organization;
  contacts: Contact[];
  refreshing: boolean;
  onRefresh: () => void;
  syncMsg: string | null;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-[12px] text-muted">
        <span>
          {org.company_number
            ? "Registration data from Companies House"
            : "No company number — not registered / sole trader"}
        </span>
        {org.company_number && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px] font-medium hover:border-primary disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing…" : "Refresh from CH"}
          </button>
        )}
      </div>
      {syncMsg && <div className="mb-3 text-[12px] font-medium text-accent">{syncMsg}</div>}

      <div className="rounded-md border border-border bg-surface p-4">
        <CHRow label="Company number" value={org.company_number} />
        <CHRow label="Status" value={org.ch_status} accent />
        <CHRow label="Type" value={org.company_type} />
        <CHRow label="Incorporated" value={formatDate(org.incorporated_on)} />
        <CHRow label="SIC code" value={org.sic_code} />
        <CHRow label="Accounts next due" value={formatDate(org.accounts_next_due)} />
        <CHRow
          label="Confirmation statement due"
          value={formatDate(org.confirmation_next_due)}
        />
      </div>

      {contacts.length > 0 && (
        <>
          <SectionTitle>Officers</SectionTitle>
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
                {initials(c.full_name)}
              </div>
              <div>
                <div className="font-semibold">{c.full_name}</div>
                <div className="text-[12px] text-muted">{c.title}</div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function CHRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between border-b border-border py-2 text-[13px] last:border-0">
      <span className="text-muted">{label}</span>
      <b className={accent ? "text-accent" : ""}>{value || "—"}</b>
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityType, React.ComponentType<{ size?: number }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: MessageSquare,
  note: MessageSquare,
};

function Activities({
  orgId,
  activities,
}: {
  orgId: string;
  activities: Activity[];
}) {
  const router = useRouter();
  const [type, setType] = useState<ActivityType>("call");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!subject.trim()) return;
    setSaving(true);
    setErr(null);
    const res = await addActivity(orgId, { type, subject, body });
    setSaving(false);
    if (res.ok) {
      setSubject("");
      setBody("");
      router.refresh();
    } else {
      setErr(res.error ?? "Couldn't save.");
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-md border border-border bg-surface p-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
          >
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
          </select>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g. Discussed Q2 VAT return)"
            className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details (optional)"
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-primary"
        />
        <div className="mt-2 flex items-center justify-between">
          {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
          <button
            onClick={save}
            disabled={saving || !subject.trim()}
            className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log activity"}
          </button>
        </div>
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-muted">No activity logged yet.</p>
      ) : (
        activities.map((a) => {
          const Icon = ACTIVITY_ICON[a.type] ?? MessageSquare;
          return (
            <div key={a.id} className="flex gap-3 border-b border-border py-3 last:border-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent">
                <Icon size={15} />
              </div>
              <div className="text-[13px]">
                <b>{a.subject}</b>
                {a.body ? ` — ${a.body}` : ""}
                <div className="mt-0.5 text-[11.5px] capitalize text-muted">
                  {a.type} · {timeAgo(a.created_at)}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function Notes({ orgId, notes }: { orgId: string; notes: Note[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!body.trim()) return;
    setSaving(true);
    setErr(null);
    const res = await addNote(orgId, body);
    setSaving(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    } else {
      setErr(res.error ?? "Couldn't save.");
    }
  }

  return (
    <div>
      <div className="mb-5 rounded-md border border-border bg-surface p-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <div className="mt-2 flex items-center justify-between">
          {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
          <button
            onClick={save}
            disabled={saving || !body.trim()}
            className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        notes.map((n) => (
          <div key={n.id} className="mb-2.5 rounded-md border border-border bg-surface p-3 text-[13px]">
            {n.body}
            <div className="mt-2 text-[11.5px] text-muted">{timeAgo(n.created_at)}</div>
          </div>
        ))
      )}
    </div>
  );
}

function Jobs({ orgId, jobs, jobTasks }: { orgId: string; jobs: Job[]; jobTasks: JobTask[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    const res = await createJob(orgId, { title, serviceType, periodLabel });
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setServiceType("");
      setPeriodLabel("");
      setShowForm(false);
      router.refresh();
    } else {
      setErr(res.error ?? "Couldn't create job.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Jobs ({jobs.length})</SectionTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} /> Create Job
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-md border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Job title (e.g. June 2026 Bookkeeping)"
              className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">Service type</option>
              <option value="monthly_bookkeeping">Monthly Bookkeeping</option>
              <option value="vat">VAT Return</option>
              <option value="cis">CIS</option>
              <option value="year_end">Year End</option>
            </select>
          </div>
          <input
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="Period (e.g. June 2026)"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between">
            {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
            <button
              onClick={save}
              disabled={saving || !title.trim()}
              className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="text-sm text-muted">No jobs yet. Create one to track work for this client.</p>
      ) : (
        jobs.map((job) => (
          <JobRow key={job.id} job={job} tasks={jobTasks.filter((t) => t.job_id === job.id)} />
        ))
      )}
    </div>
  );
}

const TASK_STATUS_COLORS: Record<JobTaskStatus, string> = {
  pending: "bg-[#9993] text-muted",
  in_progress: "bg-primary-soft text-primary",
  blocked: "bg-[#C8553D26] text-danger",
  done: "bg-accent-soft text-accent",
};

const OWNER_LABELS: Record<string, string> = {
  client: "Client",
  bookkeeper: "Bookkeeper",
  ai: "AI",
};

function JobRow({ job, tasks }: { job: Job; tasks: JobTask[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [startingWorkflow, setStartingWorkflow] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState("monthly_bookkeeping");
  const meta = JOB_STATUS[status];

  const hasTasks = tasks.length > 0;
  const tasksByStage = tasks.reduce((acc, t) => {
    if (!acc[t.stage]) acc[t.stage] = [];
    acc[t.stage].push(t);
    return acc;
  }, {} as Record<string, JobTask[]>);

  async function changeStatus(next: JobStatus) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    const res = await updateJobStatus(job.id, next);
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      setStatus(prev);
    }
  }

  async function startWorkflow() {
    setStartingWorkflow(true);
    setWorkflowError(null);
    const res = await instantiateWorkflow(job.id, selectedTemplate);
    setStartingWorkflow(false);
    if (res.ok) {
      setExpanded(true);
      router.refresh();
    } else {
      setWorkflowError(res.error ?? "Failed to start workflow.");
    }
  }

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary hover:bg-primary/20"
          >
            <Briefcase size={16} />
          </button>
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-left font-semibold hover:text-primary"
            >
              {job.title}
              {hasTasks && (
                <span className="ml-2 text-[11px] text-muted">
                  ({tasks.filter((t) => t.status === "done").length}/{tasks.length} tasks)
                </span>
              )}
            </button>
            <div className="text-[12px] text-muted">
              {job.service_type && <span className="capitalize">{job.service_type.replace(/_/g, " ")}</span>}
              {job.period_label && <span> · {job.period_label}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasTasks && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={startingWorkflow}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] outline-none focus:border-primary disabled:opacity-50"
              >
                {WORKFLOW_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                onClick={startWorkflow}
                disabled={startingWorkflow}
                className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:border-primary disabled:opacity-50"
              >
                {startingWorkflow ? "Starting…" : "Start"}
              </button>
            </div>
          )}
          <div className={cn("relative", saving && "opacity-60")}>
            <select
              value={status}
              onChange={(e) => changeStatus(e.target.value as JobStatus)}
              disabled={saving}
              className="appearance-none rounded-full border-0 bg-transparent py-1 pl-7 pr-6 text-[11.5px] font-semibold outline-none"
              style={{ background: meta.rag === "green" ? "#d1fae5" : meta.rag === "amber" ? "#fef3c7" : "#fee2e2" }}
            >
              {JOB_STATUS_ORDER.map((s: JobStatus) => (
                <option key={s} value={s}>
                  {JOB_STATUS[s].emoji} {JOB_STATUS[s].internal}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm">
              {meta.emoji}
            </span>
          </div>
        </div>
      </div>

      {workflowError && (
        <p className="mt-2 text-[12px] text-danger">{workflowError}</p>
      )}

      {expanded && hasTasks && (
        <div className="mt-4 space-y-4 pl-12">
          {Object.entries(tasksByStage).map(([stage, stageTasks]) => (
            <div key={stage}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {stage.replace(/_/g, " ")}
              </p>
              <div className="space-y-1">
                {stageTasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: JobTask }) {
  const router = useRouter();
  const [status, setStatus] = useState<JobTaskStatus>(task.status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: JobTaskStatus) {
    const prev = status;
    setStatus(next);
    setSaving(true);
    const res = await updateJobTaskStatus(task.id, next);
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      setStatus(prev);
    }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
            TASK_STATUS_COLORS[status]
          )}
        >
          {status.replace(/_/g, " ")}
        </span>
        <span className="text-[13px]">{task.title}</span>
        <span className="text-[10px] text-muted">
          ({OWNER_LABELS[task.owner] ?? task.owner})
        </span>
      </div>
      <select
        value={status}
        onChange={(e) => changeStatus(e.target.value as JobTaskStatus)}
        disabled={saving}
        className={cn(
          "rounded border-0 bg-transparent py-0.5 text-[11px] outline-none",
          saving && "opacity-50"
        )}
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 mt-5 text-[13px] font-bold first:mt-0">{children}</div>;
}

// ---------- Reports Tab ----------

function Reports({ orgId, reports, jobs }: { orgId: string; reports: Report[]; jobs: Job[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReportType>("management");
  const [periodLabel, setPeriodLabel] = useState("");
  const [jobId, setJobId] = useState("");
  const [aiCommentary, setAiCommentary] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fileRef.current?.files?.[0]) return;
    setSaving(true);
    setErr(null);
    const fd = new FormData();
    fd.append("file", fileRef.current.files[0]);
    fd.append("title", title);
    fd.append("type", type);
    fd.append("period_label", periodLabel);
    fd.append("job_id", jobId);
    fd.append("ai_commentary", aiCommentary);
    const res = await uploadReport(orgId, fd);
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setPeriodLabel("");
      setJobId("");
      setAiCommentary("");
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } else {
      setErr(res.error ?? "Upload failed.");
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Reports ({reports.length})</SectionTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Upload size={14} /> Add Report
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="mb-5 rounded-md border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report title"
              className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
            >
              {Object.entries(REPORT_TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
              placeholder="Period (e.g. June 2026)"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
            >
              <option value="">Link to job (optional)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="mt-2 block w-full text-sm"
          />
          <textarea
            value={aiCommentary}
            onChange={(e) => setAiCommentary(e.target.value)}
            placeholder="AI commentary (optional)"
            rows={2}
            className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none placeholder:text-muted focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between">
            {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      )}

      {reports.length === 0 ? (
        <p className="text-sm text-muted">No reports yet.</p>
      ) : (
        reports.map((r) => {
          const meta = REPORT_TYPE_META[r.type];
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="font-semibold">{r.title}</div>
                  <div className="text-[12px] text-muted">
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.className}`}>
                      {meta.label}
                    </span>
                    {r.period_label && <span className="ml-2">{r.period_label}</span>}
                  </div>
                </div>
              </div>
              <span className="text-[12px] text-muted">{timeAgo(r.created_at)}</span>
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------- Deadlines Tab ----------

function Deadlines({ orgId, deadlines }: { orgId: string; deadlines: Deadline[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<DeadlineKind>("vat");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    setErr(null);
    const res = await createDeadline(orgId, { kind, title, due_date: dueDate });
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setDueDate("");
      setShowForm(false);
      router.refresh();
    } else {
      setErr(res.error ?? "Failed.");
    }
  }

  async function markComplete(id: string) {
    await completeDeadline(id);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>Deadlines ({deadlines.length})</SectionTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} /> Add Deadline
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-md border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DeadlineKind)}
              className="rounded-md border border-border bg-background px-2.5 py-2 text-[13px] outline-none focus:border-primary"
            >
              {Object.entries(DEADLINE_KIND_META).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deadline title"
              className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between">
            {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
            <button
              onClick={save}
              disabled={saving || !title.trim() || !dueDate}
              className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {deadlines.length === 0 ? (
        <p className="text-sm text-muted">No deadlines yet.</p>
      ) : (
        deadlines.map((d) => {
          const meta = DEADLINE_KIND_META[d.kind];
          const isOverdue = !d.completed && new Date(d.due_date) < new Date();
          return (
            <div
              key={d.id}
              className={cn(
                "flex items-center justify-between gap-3 border-b border-border py-3 last:border-0",
                d.completed && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md",
                  d.completed ? "bg-accent-soft text-accent" : isOverdue ? "bg-[#C8553D26] text-danger" : "bg-primary-soft text-primary"
                )}>
                  <Clock size={16} />
                </div>
                <div>
                  <div className={cn("font-semibold", d.completed && "line-through")}>
                    {meta.icon} {d.title}
                  </div>
                  <div className={cn("text-[12px]", isOverdue ? "text-danger" : "text-muted")}>
                    Due: {formatDate(d.due_date)}
                    {d.completed && " · Completed"}
                  </div>
                </div>
              </div>
              {!d.completed && (
                <button
                  onClick={() => markComplete(d.id)}
                  className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium hover:border-accent hover:text-accent"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ---------- AML Panel (Staff only) ----------

function AmlPanel({ orgId, amlChecks }: { orgId: string; amlChecks: AmlCheck[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("");
  const [reference, setReference] = useState("");
  const [result, setResult] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    if (!provider.trim() || !reference.trim() || !result.trim()) return;
    setSaving(true);
    setErr(null);
    const res = await createAmlCheck(orgId, {
      provider,
      reference,
      result,
      evidence_url: evidenceUrl || undefined,
    });
    setSaving(false);
    if (res.ok) {
      setProvider("");
      setReference("");
      setResult("");
      setEvidenceUrl("");
      setShowForm(false);
      router.refresh();
    } else {
      setErr(res.error ?? "Failed.");
    }
  }

  async function decide(checkId: string, decision: "cleared" | "rejected") {
    await recordAmlDecision(checkId, decision);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle>AML Checks ({amlChecks.length})</SectionTitle>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} /> Add Check
        </button>
      </div>

      {showForm && (
        <div className="mb-5 rounded-md border border-border bg-surface p-3">
          <div className="flex flex-wrap gap-2">
            <input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Provider (e.g. Sumsub, Onfido)"
              className="min-w-[150px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reference / ID"
              className="min-w-[150px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
            />
          </div>
          <input
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="Result summary"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <input
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="Evidence URL (optional)"
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
          <div className="mt-2 flex items-center justify-between">
            {err ? <span className="text-[12px] text-danger">{err}</span> : <span />}
            <button
              onClick={save}
              disabled={saving || !provider.trim() || !reference.trim() || !result.trim()}
              className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {amlChecks.length === 0 ? (
        <p className="text-sm text-muted">No AML checks recorded.</p>
      ) : (
        amlChecks.map((c) => {
          const decisionMeta = c.decision ? AML_DECISION_META[c.decision] : null;
          return (
            <div key={c.id} className="border-b border-border py-3 last:border-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md",
                    c.decision === "cleared" ? "bg-accent-soft text-accent" :
                    c.decision === "rejected" ? "bg-[#C8553D26] text-danger" :
                    "bg-[#E0A75C26] text-warning"
                  )}>
                    <Shield size={16} />
                  </div>
                  <div>
                    <div className="font-semibold">{c.provider} · {c.reference}</div>
                    <div className="text-[12px] text-muted">{c.result}</div>
                  </div>
                </div>
                {decisionMeta ? (
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", decisionMeta.className)}>
                    {decisionMeta.label}
                  </span>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={() => decide(c.id, "cleared")}
                      className="rounded-md bg-accent-soft px-2.5 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/20"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => decide(c.id, "rejected")}
                      className="rounded-md bg-[#C8553D26] px-2.5 py-1.5 text-[11px] font-medium text-danger hover:bg-danger/20"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              {c.evidence_url && (
                <a
                  href={c.evidence_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[12px] text-primary hover:underline"
                >
                  View evidence →
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
