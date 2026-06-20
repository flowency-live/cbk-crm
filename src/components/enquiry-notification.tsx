"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Inbox } from "lucide-react";

interface EnquiryNotificationProps {
  count: number;
}

export function EnquiryNotification({ count }: EnquiryNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Show notification after a short delay if there are new enquiries and not on the enquiries page
    if (count > 0 && pathname !== "/enquiries" && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [count, pathname, dismissed]);

  function dismiss() {
    setVisible(false);
    setDismissed(true);
  }

  function viewEnquiries() {
    router.push("/enquiries");
    dismiss();
  }

  if (!visible || count === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex min-w-[320px] items-start gap-3 rounded-lg border border-primary bg-elevated p-4 shadow-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Inbox size={18} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">
            {count} new {count === 1 ? "enquiry" : "enquiries"}
          </div>
          <p className="mt-0.5 text-[13px] text-muted">
            Website submissions waiting for review
          </p>
          <button
            onClick={viewEnquiries}
            className="mt-2.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            View now
          </button>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded p-1 text-muted hover:bg-surface hover:text-foreground"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}