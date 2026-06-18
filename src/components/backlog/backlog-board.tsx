"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AUTOMATION_META,
  BACKLOG_COLUMNS,
  PHASE_META,
  PRIORITY_META,
  type BacklogItem,
  type BacklogStatus,
} from "@/lib/types";
import { updateBacklogStatus } from "@/lib/actions/backlog";

const PHASES = ["all", "phase_1", "phase_2", "phase_3"];
const PRIORITIES = ["all", "must", "should", "could", "wont"];

export function BacklogBoard({ items }: { items: BacklogItem[] }) {
  const [phase, setPhase] = useState("all");
  const [priority, setPriority] = useState("all");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (phase === "all" || i.phase === phase) &&
          (priority === "all" || i.priority === priority)
      ),
    [items, phase, priority]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <Chips label="Phase" value={phase} set={setPhase} options={PHASES} render={(o) => (o === "all" ? "All phases" : PHASE_META[o])} />
        <Chips label="Priority" value={priority} set={setPriority} options={PRIORITIES} render={(o) => (o === "all" ? "All" : PRIORITY_META[o].label)} accent />
        <span className="ml-auto text-[12.5px] text-muted">{filtered.length} items</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BACKLOG_COLUMNS.map((col) => {
          const colItems = filtered.filter((i) => i.status === col.key);
          return (
            <div key={col.key} className="rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                <span className="text-[12px] font-bold uppercase tracking-wide text-muted">{col.label}</span>
                <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted">{colItems.length}</span>
              </div>
              <div className="space-y-2.5 p-2.5">
                {colItems.length === 0 && (
                  <p className="px-1 py-6 text-center text-[12px] text-muted">Nothing here</p>
                )}
                {colItems.map((item) => (
                  <Card key={item.id} item={item} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ item }: { item: BacklogItem }) {
  const router = useRouter();
  const [status, setStatus] = useState<BacklogStatus>(item.status);
  const [saving, setSaving] = useState(false);
  const prio = PRIORITY_META[item.priority] ?? PRIORITY_META.should;
  const auto = item.automation ? AUTOMATION_META[item.automation] : null;

  async function move(next: BacklogStatus) {
    setStatus(next);
    setSaving(true);
    const res = await updateBacklogStatus(item.id, next);
    setSaving(false);
    if (res.ok) router.refresh();
    else setStatus(item.status);
  }

  return (
    <div className={cn("rounded-md border border-border bg-elevated p-3 shadow-panel", saving && "opacity-60")}>
      <div className="mb-1.5 flex items-center gap-2">
        {item.ref && <span className="text-[10.5px] font-bold text-muted">{item.ref}</span>}
        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", prio.className)}>{prio.label}</span>
      </div>
      <div className="text-[13.5px] font-semibold leading-snug">{item.title}</div>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-[12px] text-muted">{item.description}</p>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-muted">{item.epic}</span>
        <span className="rounded bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-muted">{PHASE_META[item.phase]}</span>
        {auto && <span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold", auto.className)}>{auto.label}</span>}
        {item.effort && <span className="rounded bg-surface px-1.5 py-0.5 text-[10.5px] font-medium text-muted">{item.effort}</span>}
      </div>
      <select
        value={status}
        onChange={(e) => move(e.target.value as BacklogStatus)}
        disabled={saving}
        className="mt-2.5 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-primary"
      >
        {BACKLOG_COLUMNS.map((c) => (
          <option key={c.key} value={c.key}>
            Move to: {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Chips<T extends string>({
  label,
  value,
  set,
  options,
  render,
  accent,
}: {
  label: string;
  value: T;
  set: (v: T) => void;
  options: readonly T[];
  render: (o: T) => string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}:</span>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => set(o)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors",
            value === o
              ? accent
                ? "border-accent bg-accent text-white"
                : "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted hover:border-primary hover:text-foreground"
          )}
        >
          {render(o)}
        </button>
      ))}
    </div>
  );
}
