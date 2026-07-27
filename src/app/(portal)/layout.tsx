import type { CSSProperties } from "react";
import { getActiveTenant } from "@/lib/portal/tenant";
import { createClient } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalFooter } from "@/components/portal/portal-footer";
import "./portal.css";

/**
 * Website-look shell for the client portal. Mirrors the public site's
 * header, footer, fonts and palette so the portal reads as an extension of
 * the website. All brand values resolve from the tenant record — no
 * hard-coded brand — with Hi Vis website defaults.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getActiveTenant();
  const theme = tenant.theme ?? {};

  // Tenant overrides for the website palette (Hi Vis values are the CSS defaults)
  const brandVars: Record<string, string> = {};
  if (theme.primary) brandVars["--hv-yellow"] = theme.primary;
  if (theme.ink) brandVars["--hv-ink"] = theme.ink;
  if (theme.accent) brandVars["--hv-teal"] = theme.accent;
  if (theme.secondary) brandVars["--hv-teal-dark"] = theme.secondary;

  const brandName = theme.portal_name ?? tenant.name;
  const logoUrl = theme.logo_url ?? "/brand/hi-vis/logo-wordmark.png";
  const footerLogoUrl =
    tenant.slug === "hi-vis" ? "/brand/hi-vis/footer-logo.png" : theme.logo_url ?? null;
  const websiteUrl = tenant.domain
    ? `https://www.${tenant.domain}`
    : "https://www.hivisbooks.co.uk";
  const supportEmail = tenant.support_email ?? "hello@hivisbooks.co.uk";

  // Signed-in state decides whether the nav renders
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
  }

  return (
    <div className="portal-shell" style={brandVars as CSSProperties}>
      <div className="brushbar" />
      <PortalHeader
        logoUrl={logoUrl}
        brandName={brandName}
        websiteUrl={websiteUrl}
        signedIn={signedIn}
      />
      <main className="wrap" style={{ maxWidth: 860, paddingTop: 36, paddingBottom: 56 }}>
        {children}
      </main>
      <PortalFooter
        brandName={brandName}
        websiteUrl={websiteUrl}
        supportEmail={supportEmail}
        footerLogoUrl={footerLogoUrl}
      />
    </div>
  );
}
