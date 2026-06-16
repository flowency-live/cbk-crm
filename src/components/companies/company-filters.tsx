"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { key: "all", label: "All" },
  { key: "client", label: "Clients" },
  { key: "prospect", label: "Prospects" },
  { key: "dormant", label: "Dormant" },
];

export function CompanyFilters({
  sectors,
  q,
  status,
  sector,
  showing,
}: {
  sectors: string[];
  q: string;
  status: string;
  sector: string;
  total: number;
  showing: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all" || value === "") next.delete(key);
      else next.set(key, value);
      router.replace(`/companies?${next.toString()}`, { scroll: false });
    },
    [params, router]
  );

  // debounce free-text search
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

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
      <div className="flex min-w-[240px] max-w-[360px] flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3 py-2">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Name, contact, location, sector…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          aria-label="Search companies"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Chip
            key={s.key}
            active={status === s.key}
            onClick={() => setParam("status", s.key)}
          >
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip accent active={sector === "all"} onClick={() => setParam("sector", "all")}>
          All sectors
        </Chip>
        {sectors.map((s) => (
          <Chip key={s} accent active={sector === s} onClick={() => setParam("sector", s)}>
            {s}
          </Chip>
        ))}
      </div>

      <span className="ml-auto whitespace-nowrap text-[12.5px] text-muted">
        {showing} compan{showing === 1 ? "y" : "ies"}
      </span>
    </div>
  );
}

function Chip({
  children,
  active,
  accent,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? accent
            ? "border-accent bg-accent text-white"
            : "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted hover:border-primary hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
