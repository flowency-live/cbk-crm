import Link from "next/link";
import {
  Building2,
  Users,
  Briefcase,
  Sparkles,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { getCompanies } from "@/lib/data/companies";
import { getContacts } from "@/lib/data/contacts";
import { getActivities } from "@/lib/data/activities";
import { formatDate, timeAgo } from "@/lib/utils";
import type { CompanyListRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ rows: companies }, { rows: contacts }, { rows: activities }] =
    await Promise.all([
      getCompanies(),
      getContacts(),
      getActivities({ limit: 6 }),
    ]);

  const clients = companies.filter((c) => c.status === "client").length;
  const prospects = companies.filter((c) => c.status === "prospect").length;

  const sectors = topCounts(companies.map((c) => c.sector));
  const deadlines = upcomingDeadlines(companies);

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">Dashboard</h1>
      <p className="mb-5 text-[13px] text-muted">
        Your book of business at a glance.
      </p>

      {/* KPI cards */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <Kpi href="/companies" icon={Building2} label="Companies" value={companies.length} />
        <Kpi href="/companies?status=client" icon={Briefcase} label="Clients" value={clients} accent />
        <Kpi href="/companies?status=prospect" icon={Sparkles} label="Prospects" value={prospects} />
        <Kpi href="/contacts" icon={Users} label="Contacts" value={contacts.length} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: breakdowns */}
        <div className="space-y-5 lg:col-span-2">
          <Card title="Pipeline">
            <StatusBar companies={companies} />
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
              <Legend color="var(--accent)" label="Clients" value={clients} />
              <Legend color="var(--primary)" label="Prospects" value={prospects} />
              <Legend
                color="var(--muted)"
                label="Dormant / lost"
                value={companies.length - clients - prospects}
              />
            </div>
          </Card>

          <Card title="Top sectors">
            {sectors.length === 0 ? (
              <p className="text-sm text-muted">No sector data yet.</p>
            ) : (
              <div className="space-y-2.5">
                {sectors.map(([sector, count]) => (
                  <div key={sector} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-[13px]">{sector}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${(count / sectors[0][1]) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-muted">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: recent activity + deadlines */}
        <div className="space-y-5">
          <Card title="Recent activity" action={{ href: "/activities", label: "All" }}>
            {activities.length === 0 ? (
              <p className="text-sm text-muted">Nothing logged yet.</p>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="text-[13px]">
                    <div className="font-medium">{a.subject}</div>
                    <div className="text-[11.5px] text-muted">
                      {a.company_name ?? "—"} · {timeAgo(a.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Upcoming CH deadlines">
            {deadlines.length === 0 ? (
              <p className="text-sm text-muted">No upcoming deadlines in range.</p>
            ) : (
              <div className="space-y-3">
                {deadlines.map((d) => (
                  <Link
                    key={d.id + d.kind}
                    href={`/companies/${d.id}`}
                    className="flex items-start gap-2.5 text-[13px] hover:opacity-80"
                  >
                    <CalendarClock size={15} className="mt-0.5 shrink-0 text-warning" />
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-[11.5px] text-muted">
                        {d.kind} · {formatDate(d.date)}{" "}
                        <span className={d.days <= 30 ? "font-semibold text-warning" : ""}>
                          ({d.days}d)
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function topCounts(values: (string | null)[], limit = 6): [string, number][] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

interface Deadline {
  id: string;
  name: string;
  kind: string;
  date: string;
  days: number;
}

function upcomingDeadlines(companies: CompanyListRow[], limit = 6): Deadline[] {
  const now = Date.now();
  const horizon = now + 180 * 86_400_000;
  const out: Deadline[] = [];
  for (const c of companies) {
    const add = (date: string | null, kind: string) => {
      if (!date) return;
      const t = new Date(date).getTime();
      if (isNaN(t) || t < now || t > horizon) return;
      out.push({
        id: c.id,
        name: c.name,
        kind,
        date,
        days: Math.ceil((t - now) / 86_400_000),
      });
    };
    add(c.accounts_next_due, "Accounts");
    add(c.confirmation_next_due, "Confirmation statement");
  }
  return out.sort((a, b) => a.days - b.days).slice(0, limit);
}

/* ---------- presentational ---------- */

function Kpi({
  href,
  icon: Icon,
  label,
  value,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-elevated p-4 shadow-panel transition-colors hover:border-primary"
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-md ${
          accent ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary"
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="font-brand text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[12.5px] text-muted">{label}</div>
    </Link>
  );
}

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="rounded-lg border border-border bg-elevated p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wide text-muted">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
          >
            {action.label} <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function StatusBar({ companies }: { companies: CompanyListRow[] }) {
  const total = companies.length || 1;
  const clients = companies.filter((c) => c.status === "client").length;
  const prospects = companies.filter((c) => c.status === "prospect").length;
  const other = companies.length - clients - prospects;
  const seg = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
      <div style={{ width: seg(clients), background: "var(--accent)" }} />
      <div style={{ width: seg(prospects), background: "var(--primary)" }} />
      <div style={{ width: seg(other), background: "var(--muted)" }} />
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="font-medium text-foreground">{value}</span> {label}
    </span>
  );
}
