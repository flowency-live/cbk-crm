import type { CSSProperties } from "react";
import Link from "next/link";
import { getActiveTenant } from "@/lib/portal/tenant";
import { PortalNav } from "@/components/portal/portal-nav";

/**
 * Branded shell for the client portal. Brand tokens come from the tenant record
 * (no hard-coded brand) and are exposed as CSS vars for the portal subtree.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getActiveTenant();
  const theme = tenant.theme ?? {};
  const brandVars = {
    "--brand-primary": theme.primary ?? "#FACC15",
    "--brand-ink": theme.ink ?? "#1C1C1C",
    "--brand-accent": theme.accent ?? "#3FA89B",
  } as unknown as CSSProperties;

  return (
    <div style={brandVars} className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/portal" className="flex items-center gap-3">
            <span
              className="inline-block h-7 w-7 rounded-lg"
              style={{ background: "var(--brand-primary)" }}
              aria-hidden
            />
            <span className="font-semibold">
              {theme.portal_name ?? tenant.name}
            </span>
          </Link>
        </div>
        <PortalNav />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
