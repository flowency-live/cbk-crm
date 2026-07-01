"use client";

import { useState, useTransition } from "react";
import { sendClientMessage } from "@/lib/actions/messages";

export function MessageComposer() {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      const res = await sendClientMessage(body);
      if (res.ok) {
        setBody("");
      } else {
        setError(res.error ?? "Failed to send message.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border p-4"
    >
      {error && (
        <p className="mb-2 text-sm text-danger">{error}</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          disabled={pending}
          className="flex-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted focus:border-[var(--brand-primary)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{
            background: "var(--brand-primary)",
            color: "var(--brand-ink)",
          }}
        >
          {pending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
