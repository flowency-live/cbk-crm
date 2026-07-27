"use client";

import { useState, useTransition } from "react";
import { updateMyDetails } from "@/lib/actions/details";

export function MyDetailsForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await updateMyDetails({ full_name: name, phone });
      if (res.ok) setMsg("Saved — thanks for keeping us up to date.");
      else setErr(res.error ?? "Couldn't save.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-elevated p-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
        Contact details
      </p>
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="det-name">Your name</label>
          <input
            id="det-name"
            className="field-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="det-phone">Phone number</label>
          <input
            id="det-phone"
            className="field-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07700 900123"
            autoComplete="tel"
          />
        </div>
        <button type="submit" disabled={pending} className="btn btn-yellow">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      {msg && (
        <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(47,138,123,.09)", color: "var(--hv-teal-dark)" }}>
          {msg}
        </p>
      )}
      {err && (
        <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(200,85,61,.09)", color: "#a3442f" }}>
          {err}
        </p>
      )}
    </form>
  );
}
