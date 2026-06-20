"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Phone, ArrowRight, Ban, Check } from "lucide-react";
import { ENQUIRY_STATUS_META, type WebsiteEnquiry } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { convertEnquiry, setEnquiryStatus } from "@/lib/actions/enquiries";

export function EnquiriesList({ items }: { items: WebsiteEnquiry[] }) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-16 text-center shadow-panel">
        <div className="font-brand text-lg">No enquiries here</div>
        <div className="text-sm text-muted">
          New contact-form submissions from the website will land here.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((e) => (
        <EnquiryCard key={e.id} e={e} />
      ))}
    </div>
  );
}

function EnquiryCard({ e }: { e: WebsiteEnquiry }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const meta = ENQUIRY_STATUS_META[e.status] ?? ENQUIRY_STATUS_META.new;

  async function convert() {
    setBusy(true);
    setErr(null);
    const res = await convertEnquiry(e.id);
    setBusy(false);
    if (res.ok && res.orgId) router.push(`/companies/${res.orgId}`);
    else setErr(res.error ?? "Couldn't convert.");
  }
  async function mark(status: string) {
    setBusy(true);
    setErr(null);
    const res = await setEnquiryStatus(e.id, status);
    setBusy(false);
    if (res.ok) router.refresh();
    else setErr(res.error ?? "Couldn't update.");
  }

  return (
    <div className={cn("rounded-lg border border-border bg-elevated p-4 shadow-panel", busy && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold">{e.name}</span>
            {e.business_name && (
              <span className="text-[13px] text-muted">· {e.business_name}</span>
            )}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>
              {meta.label}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Mail size={13} /> {e.email}
            </a>
            {e.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={13} /> {e.phone}
              </span>
            )}
            {e.service_interest && <span>🏷 {e.service_interest}</span>}
            <span>via {e.page_source ?? "website"}</span>
            <span>· {timeAgo(e.created_at)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {e.status === "converted" && e.converted_org_id ? (
            <Link
              href={`/companies/${e.converted_org_id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-semibold hover:bg-surface"
            >
              View company <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              {e.status !== "spam" && (
                <button
                  onClick={convert}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  <Check size={14} /> Convert to prospect
                </button>
              )}
              <button
                onClick={() => mark(e.status === "spam" ? "new" : "spam")}
                disabled={busy}
                title={e.status === "spam" ? "Restore" : "Mark as spam"}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[13px] font-medium text-muted hover:bg-surface"
              >
                <Ban size={14} /> {e.status === "spam" ? "Restore" : "Spam"}
              </button>
            </>
          )}
        </div>
      </div>

      {e.message && (
        <p className="mt-3 rounded-md border border-border bg-surface p-3 text-[13px]">
          {e.message}
        </p>
      )}
      {err && <p className="mt-2 text-[12.5px] text-danger">{err}</p>}
    </div>
  );
}
