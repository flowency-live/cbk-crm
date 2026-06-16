"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  STATUS_META,
  type Activity,
  type ActivityType,
  type Contact,
  type Note,
  type Organization,
} from "@/lib/types";
import { cn, formatDate, initials, timeAgo } from "@/lib/utils";
import { addActivity, addNote } from "@/lib/actions/companies";

const TABS = ["Overview", "Contacts", "Companies House", "Activities", "Notes"] as const;
type Tab = (typeof TABS)[number];

export function CompanyDetail({
  org,
  contacts,
  activities,
  notes,
}: {
  org: Organization;
  contacts: Contact[];
  activities: Activity[];
  notes: Note[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("Overview");
  const [refreshing, setRefreshing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const meta = STATUS_META[org.status];

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
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
                  meta.className
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {meta.label}
              </span>
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
        {tab === "Contacts" && <People contacts={contacts} />}
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
        <Field label="Sector" value={org.sector} />
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

function People({ contacts }: { contacts: Contact[] }) {
  if (!contacts.length)
    return <p className="text-sm text-muted">No contacts yet.</p>;
  return (
    <div>
      <SectionTitle>People ({contacts.length})</SectionTitle>
      {contacts.map((c) => (
        <div key={c.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 mt-5 text-[13px] font-bold first:mt-0">{children}</div>;
}
