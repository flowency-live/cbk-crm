"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, STATUS_FLOW, STATUS_META } from "@/lib/types";
import { SelectMenu } from "@/components/ui/select-menu";

const FIT_OPTIONS = [
  { value: "all", label: "All fits" },
  { value: "qualified", label: "Qualified" },
  { value: "review", label: "Review" },
  { value: "disqualified", label: "Disqualified" },
  { value: "unreviewed", label: "Not reviewed" },
];

export function CompanyFilters({
  q,
  status,
  category,
  fit,
  showing,
}: {
  q: string;
  status: string; // comma-separated list of statuses
  category: string;
  fit: string;
  showing: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.replace(`/companies?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (text !== q) setParam("q", text);
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const statusValues = status.split(",").map((s) => s.trim()).filter(Boolean);
  const statusOptions = STATUS_FLOW.map((s) => ({
    value: s,
    label: STATUS_META[s].label,
  }));
  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
      <div className="flex min-w-[230px] max-w-[320px] flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Name, contact, location…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          aria-label="Search companies"
        />
      </div>

      <SelectMenu
        label="Status"
        multiple
        options={statusOptions}
        value={statusValues}
        onChange={(next) => setParam("status", next.join(","))}
        placeholder="All"
        menuWidth="w-52"
      />

      <SelectMenu
        label="Category"
        options={categoryOptions}
        value={[category]}
        onChange={(next) => setParam("category", next[0] ?? "all")}
        menuWidth="w-60"
      />

      <SelectMenu
        label="Fit"
        options={FIT_OPTIONS}
        value={[fit]}
        onChange={(next) => setParam("fit", next[0] ?? "all")}
        menuWidth="w-48"
      />

      <span className="ml-auto whitespace-nowrap text-[12.5px] text-muted">
        {showing} compan{showing === 1 ? "y" : "ies"}
      </span>
    </div>
  );
}
