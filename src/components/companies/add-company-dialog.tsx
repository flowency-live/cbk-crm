"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plus, X, Zap, Pencil, Check, Loader2 } from "lucide-react";
import { createCompany, type NewCompanyInput } from "@/lib/actions/companies";
import { CATEGORIES, type CompanyStatus } from "@/lib/types";

interface CHItem {
  company_number: string;
  title: string;
  company_status: string;
  company_type: string;
  address_snippet: string;
  date_of_creation?: string;
}

const EMPTY: NewCompanyInput = {
  name: "",
  status: "prospect",
  category: "Construction & Trades",
};

export function AddCompanyDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"ch" | "manual">("ch");
  const [chQ, setChQ] = useState("");
  const [results, setResults] = useState<CHItem[]>([]);
  const [demoCH, setDemoCH] = useState(false);
  const [picked, setPicked] = useState(false);
  const [form, setForm] = useState<NewCompanyInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  function reset() {
    setMode("ch");
    setChQ("");
    setResults([]);
    setPicked(false);
    setForm(EMPTY);
    setMsg(null);
  }

  // debounced CH search
  useEffect(() => {
    if (!open || mode !== "ch" || picked) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (chQ.trim().length < 2) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/companies-house/search?q=${encodeURIComponent(chQ)}`
        );
        const data = await res.json();
        setResults(data.items ?? []);
        setDemoCH(!!data.demo);
      } catch {
        setResults([]);
      }
    }, 220);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [chQ, open, mode, picked]);

  async function pick(item: CHItem) {
    const parts = item.address_snippet.split(",").map((s) => s.trim());
    setForm((f) => ({
      ...f,
      name: item.title,
      company_number: item.company_number,
      company_type: item.company_type,
      ch_status: item.company_status,
      incorporated_on: item.date_of_creation,
      address_line1: parts[0],
      town: parts.length >= 2 ? parts[parts.length - 2] : "",
      postcode: parts[parts.length - 1],
    }));
    setPicked(true);
    setResults([]);
    setChQ(item.title);

    // live enrichment (SIC, due dates, officers) when a key is configured
    if (!demoCH) {
      try {
        const res = await fetch(
          `/api/companies-house/company/${item.company_number}`
        );
        if (res.ok) {
          const data = await res.json();
          setForm((f) => ({ ...f, ...data.mapped }));
        }
      } catch {
        /* keep the basic fields */
      }
    }
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const result = await createCompany(form);
    setSaving(false);
    if (result.ok) {
      setOpen(false);
      reset();
      router.refresh();
      if (result.id) router.push(`/companies/${result.id}`);
    } else {
      setMsg(result.error ?? "Something went wrong.");
    }
  }

  const set =
    (k: keyof NewCompanyInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }) as NewCompanyInput);

  return (
    <>
      <button
        onClick={() => {
          reset();
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <Plus size={16} strokeWidth={2.4} /> Add company
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex animate-fade-in justify-center bg-black/45 pt-[7vh]"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="flex max-h-[84vh] w-[600px] max-w-[94vw] flex-col overflow-hidden rounded-lg border border-border bg-background shadow-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="font-brand text-lg font-bold">Add a company</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-1 px-6 pt-4">
              <ModeBtn active={mode === "ch"} onClick={() => setMode("ch")} icon={Zap}>
                Companies House lookup
              </ModeBtn>
              <ModeBtn active={mode === "manual"} onClick={() => { setMode("manual"); setPicked(true); }} icon={Pencil}>
                Manual entry
              </ModeBtn>
            </div>

            <div className="overflow-y-auto px-6 py-4">
              {mode === "ch" && !picked && (
                <>
                  <input
                    autoFocus
                    value={chQ}
                    onChange={(e) => setChQ(e.target.value)}
                    placeholder="Start typing a company name or number…"
                    className="w-full rounded-md border border-border bg-surface px-3.5 py-3 outline-none focus:border-primary"
                  />
                  <p className="mb-1.5 mt-2 flex items-center gap-1.5 text-[12px] text-muted">
                    <Zap size={13} className="text-accent" />
                    {demoCH
                      ? "Demo lookup — try “prestbury”, “frodsham”, “tarporley”."
                      : "Live lookup against the Companies House register."}
                  </p>
                  {results.length > 0 && (
                    <div className="mt-1.5 overflow-hidden rounded-md border border-border">
                      {results.map((r) => (
                        <button
                          key={r.company_number}
                          onClick={() => pick(r)}
                          className="block w-full border-b border-border px-3.5 py-2.5 text-left last:border-0 hover:bg-surface"
                        >
                          <div className="text-[13.5px] font-semibold">{r.title}</div>
                          <div className="text-[12px] text-muted">
                            No. {r.company_number} · {r.company_status} · {r.address_snippet}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {picked && (
                <>
                  {mode === "ch" && form.company_number && (
                    <div className="mb-3.5 flex items-center gap-2 rounded-md border border-accent bg-accent-soft px-3 py-2.5 text-[12.5px] font-semibold text-accent">
                      <Check size={15} /> Auto-filled from Companies House — review and add your
                      CRM details.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3.5">
                    <FormField className="col-span-2" label="Company name">
                      <input value={form.name} onChange={set("name")} className={inputCls} />
                    </FormField>
                    <FormField label="Company number">
                      <input value={form.company_number ?? ""} onChange={set("company_number")} placeholder="(blank if not registered)" className={inputCls} />
                    </FormField>
                    <FormField label="Status">
                      <select value={form.status} onChange={set("status")} className={inputCls}>
                        <option value="prospect">Prospect</option>
                        <option value="active_lead">Active Lead</option>
                        <option value="client">Client</option>
                        <option value="closed">Closed</option>
                      </select>
                    </FormField>
                    <FormField label="Category">
                      <select
                        value={form.category ?? "Construction & Trades"}
                        onChange={set("category")}
                        className={inputCls}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Primary contact">
                      <input value={form.contact_name ?? ""} onChange={set("contact_name")} className={inputCls} />
                    </FormField>
                    <FormField label="Email">
                      <input value={form.contact_email ?? ""} onChange={set("contact_email")} placeholder="name@company.co.uk" className={inputCls} />
                    </FormField>
                    <FormField label="Location / town">
                      <input value={form.town ?? ""} onChange={set("town")} className={inputCls} />
                    </FormField>
                    <FormField label="Postcode">
                      <input value={form.postcode ?? ""} onChange={set("postcode")} className={inputCls} />
                    </FormField>
                    <FormField className="col-span-2" label="Sector / SIC">
                      <input value={form.sic_code ?? form.sector ?? ""} onChange={set("sic_code")} className={inputCls} />
                    </FormField>
                    <FormField className="col-span-2" label="Tags (comma separated)">
                      <input value={form.tags ?? ""} onChange={set("tags")} placeholder="VAT, Monthly, Lead…" className={inputCls} />
                    </FormField>
                  </div>
                </>
              )}

              {msg && <p className="mt-3 text-[12.5px] font-medium text-danger">{msg}</p>}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-[13.5px] font-semibold hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13.5px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                Save company
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

function FormField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11.5px] font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-[13px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border text-muted hover:text-foreground"
      }`}
    >
      <Icon size={15} /> {children}
    </button>
  );
}
