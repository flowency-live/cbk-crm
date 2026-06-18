"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Dark-theme-styled dropdown. Single-select closes on pick; multi-select keeps
 * open with checkboxes. Replaces native <select> so the option list is themed.
 */
export function SelectMenu({
  options,
  value,
  onChange,
  multiple = false,
  label,
  placeholder = "Any",
  className,
  menuWidth = "w-56",
}: {
  options: SelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  multiple?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  menuWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.filter((o) => value.includes(o.value));
  const display =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((o) => o.label).join(", ")
        : `${selected.length} selected`;

  function toggle(v: string) {
    if (multiple) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    } else {
      onChange([v]);
      setOpen(false);
    }
  }

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-[13px] font-medium text-foreground outline-none transition-colors hover:border-primary"
      >
        {label && <span className="text-muted">{label}:</span>}
        <span className="max-w-[180px] truncate">{display}</span>
        <ChevronDown size={14} className="ml-0.5 shrink-0 text-muted" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-11 z-50 max-h-72 overflow-auto rounded-lg border border-border bg-elevated p-1 shadow-card",
            menuWidth
          )}
        >
          {options.map((o) => {
            const on = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-surface",
                  on ? "text-foreground" : "text-muted"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {on && <Check size={11} strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
