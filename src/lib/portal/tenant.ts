// Adapter over the canonical tenant lookup in @/lib/data/portal.
import { getDefaultTenant } from "@/lib/data/portal";
import type { Tenant } from "@/lib/types";

export type { Tenant };

export async function getActiveTenant(): Promise<Tenant> {
  return getDefaultTenant();
}
