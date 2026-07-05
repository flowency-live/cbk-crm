// Domain-based tenant resolver for the client portal.
// Reads the Host header and looks up the tenant by domain.
import { headers } from "next/headers";
import { getDefaultTenant, getTenantByDomain } from "@/lib/data/portal";
import type { Tenant } from "@/lib/types";

export type { Tenant };

/**
 * Extracts the base domain from a hostname.
 * "portal.hivisbooks.co.uk" -> "hivisbooks.co.uk"
 * "localhost:3000" -> "localhost"
 */
function extractBaseDomain(host: string): string {
  // Remove port
  const hostname = host.split(":")[0];

  // Handle localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return hostname;
  }

  // For *.vercel.app domains, return as-is
  if (hostname.endsWith(".vercel.app")) {
    return hostname;
  }

  // Extract base domain (last 2 parts for .co.uk, .com, etc.)
  const parts = hostname.split(".");

  // Handle .co.uk style TLDs (3+ parts where second-to-last is "co")
  if (parts.length >= 3 && parts[parts.length - 2] === "co") {
    return parts.slice(-3).join(".");
  }

  // Standard TLDs (.com, .uk, etc.)
  if (parts.length >= 2) {
    return parts.slice(-2).join(".");
  }

  return hostname;
}

/**
 * Resolves the active tenant based on the request's Host header.
 * Falls back to the default tenant if no match is found.
 */
export async function getActiveTenant(): Promise<Tenant> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "";

  // Extract base domain from host
  const baseDomain = extractBaseDomain(host);

  // Try to find tenant by domain
  const tenant = await getTenantByDomain(baseDomain);
  if (tenant) {
    return tenant;
  }

  // Try with full hostname (for portal.hivisbooks.co.uk -> hivisbooks.co.uk)
  if (host !== baseDomain) {
    const tenantByHost = await getTenantByDomain(host.split(":")[0]);
    if (tenantByHost) {
      return tenantByHost;
    }
  }

  // Fallback to default tenant
  return getDefaultTenant();
}
