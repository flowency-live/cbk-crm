"use client";

import { useRouter } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import type { ContactRow } from "@/lib/data/contacts";
import { initials } from "@/lib/utils";

export function ContactsTable({ rows }: { rows: ContactRow[] }) {
  const router = useRouter();

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-16 text-center shadow-panel">
        <div className="font-brand text-lg">No contacts found</div>
        <div className="text-sm text-muted">Try a different search.</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-elevated shadow-panel">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Contact", "Company", "Email", "Phone", "Role"].map((h) => (
              <th
                key={h}
                className="border-b border-border bg-surface px-4 py-3 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr
              key={c.id}
              onClick={() => c.org_id && router.push(`/companies/${c.org_id}`)}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                    {initials(c.full_name)}
                  </div>
                  <span className="font-semibold">
                    {c.full_name}
                    {c.is_primary && (
                      <span className="ml-2 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                        Primary
                      </span>
                    )}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-[13.5px]">{c.company_name ?? "—"}</td>
              <td className="px-4 py-3 text-[13.5px]">
                {c.email ? (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Mail size={13} /> {c.email}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-[13.5px]">
                {c.phone ? (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Phone size={13} /> {c.phone}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-[13.5px] text-muted">{c.title ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
