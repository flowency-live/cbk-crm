"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { getReportDownloadUrl } from "@/lib/actions/reports";

interface ReportDownloadButtonProps {
  storagePath: string;
}

export function ReportDownloadButton({ storagePath }: ReportDownloadButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDownload() {
    setError(null);
    startTransition(async () => {
      const res = await getReportDownloadUrl(storagePath);
      if (res.ok && res.url) {
        window.open(res.url, "_blank");
      } else {
        setError(res.error ?? "Failed to get download link.");
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary disabled:opacity-50"
        style={{
          background: "var(--brand-primary)",
          color: "var(--brand-ink)",
          borderColor: "var(--brand-primary)",
        }}
      >
        <Download size={14} />
        {pending ? "Loading..." : "Download"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
