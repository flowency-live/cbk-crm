"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Building2, User } from "lucide-react";
import { initials } from "@/lib/utils";

interface PaletteCompany {
  id: string;
  name: string;
  town: string | null;
  sector: string | null;
  company_number: string | null;
  matched: string;
}
interface PaletteContact {
  id: string;
  name: string;
  email: string | null;
  companyName: string;
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [companies, setCompanies] = useState<PaletteCompany[]>([]);
  const [contacts, setContacts] = useState<PaletteContact[]>([]);

  // global hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setCompanies(data.companies ?? []);
        setContacts(data.contacts ?? []);
      } catch {
        setCompanies([]);
        setContacts([]);
      }
    }, 160);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  const go = (id: string) => {
    onOpenChange(false);
    router.push(`/companies/${id}`);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex animate-fade-in justify-center bg-black/45 pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <Command
        shouldFilter={false}
        className="h-fit w-[580px] max-w-[92vw] overflow-hidden rounded-lg border border-border bg-background shadow-card"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search size={18} className="text-muted" />
          <Command.Input
            value={q}
            onValueChange={setQ}
            autoFocus
            placeholder="Search across all companies, contacts and fields…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted">
            esc
          </kbd>
        </div>

        <Command.List className="max-h-[380px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center">
            <div className="font-brand text-lg">Nothing found</div>
            <div className="text-sm text-muted">
              No companies or contacts match “{q}”.
            </div>
          </Command.Empty>

          {companies.length > 0 && (
            <Command.Group
              heading="Companies"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted"
            >
              {companies.map((c) => (
                <Command.Item
                  key={c.id}
                  value={`co-${c.id}`}
                  onSelect={() => go(c.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 data-[selected=true]:bg-surface"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary-soft text-[11px] font-bold text-primary">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{c.name}</div>
                    <div className="truncate text-[12px] text-muted">
                      {[c.town, c.sector, c.company_number ? `No. ${c.company_number}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  {c.matched && (
                    <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-accent">
                      matched: {c.matched}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {contacts.length > 0 && (
            <Command.Group
              heading="Contacts"
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted"
            >
              {contacts.map((c) => (
                <Command.Item
                  key={`ct-${c.id}-${c.name}`}
                  value={`ct-${c.id}-${c.name}`}
                  onSelect={() => go(c.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 data-[selected=true]:bg-surface"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                    {initials(c.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{c.name}</div>
                    <div className="truncate text-[12px] text-muted">
                      {[c.companyName, c.email].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
