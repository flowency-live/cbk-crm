import Link from "next/link";
import { Info, Phone, Mail, Calendar, CheckSquare, MessageSquare } from "lucide-react";
import { getActivities, type ActivityRow } from "@/lib/data/activities";
import { ToolbarSearch } from "@/components/toolbar-search";
import { ActivityFilters } from "@/components/activities/activity-filters";
import { timeAgo } from "@/lib/utils";
import type { ActivityType } from "@/lib/types";

export const dynamic = "force-dynamic";

const ICON: Record<ActivityType, React.ComponentType<{ size?: number }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckSquare,
  note: MessageSquare,
};

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "all";
  const { rows, demo } = await getActivities({ q: sp.q ?? "", type });

  return (
    <div className="px-7 py-6">
      <h1 className="mb-1 font-brand text-2xl font-bold">Activities</h1>
      <p className="mb-5 text-[13px] text-muted">
        Calls, emails, meetings, tasks and notes across every company.
      </p>

      {demo && (
        <div className="mb-4 flex items-center gap-2.5 rounded-md border border-accent bg-accent-soft px-3.5 py-2.5 text-[12.5px] font-medium text-accent">
          <Info size={16} />
          Demo data — connect Supabase to use live records.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <ToolbarSearch basePath="/activities" placeholder="Search activities…" />
        <ActivityFilters active={type} />
        <span className="ml-auto whitespace-nowrap text-[12.5px] text-muted">
          {rows.length} item{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-elevated px-4 py-16 text-center shadow-panel">
          <div className="font-brand text-lg">Nothing logged yet</div>
          <div className="text-sm text-muted">Try a different filter or search.</div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-elevated p-2 shadow-panel">
          {rows.map((a) => (
            <ActivityItem key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ a }: { a: ActivityRow }) {
  const Icon = ICON[a.type] ?? MessageSquare;
  return (
    <div className="flex gap-3 rounded-md px-3 py-3 transition-colors hover:bg-surface">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px]">
          <span className="font-semibold">{a.subject}</span>
          {a.body ? <span className="text-muted"> — {a.body}</span> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
          <span className="capitalize">{a.type}</span>
          <span>·</span>
          <span>{timeAgo(a.created_at)}</span>
          {a.company_name && a.org_id && (
            <>
              <span>·</span>
              <Link
                href={`/companies/${a.org_id}`}
                className="font-medium text-primary hover:underline"
              >
                {a.company_name}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
