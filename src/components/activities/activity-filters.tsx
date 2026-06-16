"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const TYPES = [
  { key: "all", label: "All" },
  { key: "call", label: "Calls" },
  { key: "email", label: "Emails" },
  { key: "meeting", label: "Meetings" },
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
];

export function ActivityFilters({ active }: { active: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (type: string) => {
    const next = new URLSearchParams(params.toString());
    if (type === "all") next.delete("type");
    else next.set("type", type);
    router.replace(`/activities?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {TYPES.map((t) => (
        <button
          key={t.key}
          onClick={() => set(t.key)}
          className={cn(
            "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
            active === t.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted hover:border-primary hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
