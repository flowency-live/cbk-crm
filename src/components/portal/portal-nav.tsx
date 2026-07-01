"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/portal", label: "Home" },
  { href: "/portal/reports", label: "Reports" },
  { href: "/portal/vat", label: "VAT" },
  { href: "/portal/cis", label: "CIS" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/onboarding", label: "Setup" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pb-2">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[var(--brand-primary)] text-[var(--brand-ink)]"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
