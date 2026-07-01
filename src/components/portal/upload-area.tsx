"use client";

import { useState, useTransition } from "react";
import { uploadDocuments } from "@/lib/actions/portal";

export function UploadArea() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await uploadDocuments(fd);
      if (res.ok) {
        setMsg(`Uploaded ${res.count} file${res.count === 1 ? "" : "s"}.`);
        form.reset();
      } else {
        setErr(res.error ?? "Upload failed.");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-dashed border-border bg-surface p-5"
    >
      <p className="text-sm font-semibold">Upload documents</p>
      <p className="mb-3 mt-1 text-xs text-muted">
        Bank statements, invoices, receipts, CIS statements. Photos from your phone are fine.
      </p>
      <input
        name="files"
        type="file"
        multiple
        accept="image/*,application/pdf"
        capture="environment"
        className="block w-full text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-md py-2 px-4 text-sm font-semibold text-black disabled:opacity-50"
        style={{ background: "var(--brand-primary)" }}
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {msg && <p className="mt-3 text-sm text-accent">{msg}</p>}
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
    </form>
  );
}
