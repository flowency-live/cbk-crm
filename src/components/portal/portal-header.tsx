"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/portal", label: "Home" },
  { href: "/portal/reports", label: "Reports" },
  { href: "/portal/vat", label: "VAT" },
  { href: "/portal/cis", label: "CIS" },
  { href: "/portal/messages", label: "Messages" },
  { href: "/portal/onboarding", label: "Setup" },
  { href: "/portal/details", label: "My details" },
];

/**
 * Website-style sticky header for the portal — mirrors the public site's
 * header (wordmark, nav typography, burger) so the portal feels like the
 * same website. Nav renders only when signed in.
 */
export function PortalHeader({
  logoUrl,
  brandName,
  websiteUrl,
  signedIn,
}: {
  logoUrl: string;
  brandName: string;
  websiteUrl: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/portal/login");
      router.refresh();
    }
  }

  return (
    <header className="site">
      <div className="wrap">
        <nav>
          <a className="brand" href={websiteUrl} aria-label={`${brandName} website`}>
            <Image src={logoUrl} alt={brandName} width={220} height={72} priority />
          </a>
          {signedIn && (
            <>
              <button
                className="nav-toggle"
                aria-label="Menu"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
              >
                &#9776;
              </button>
              <div className={`nav-links${open ? " open" : ""}`} id="portal-navlinks">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    item.href === "/portal"
                      ? pathname === "/portal"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={isActive ? "active" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <button type="button" className="btn btn-yellow" onClick={signOut}>
                  Sign out
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
