"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { STATUS_META, type CompanyListRow } from "@/lib/types";
import { initials, timeAgo } from "@/lib/utils";

export function CompaniesTable({ rows }: { rows: CompanyListRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const columns = useMemo<ColumnDef<CompanyListRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-sm bg-primary-soft text-[12px] font-bold text-primary">
                {initials(c.name)}
              </div>
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-[12px] font-normal text-muted">
                  {c.company_number ? `No. ${c.company_number}` : "—"}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: "contact",
        accessorFn: (r) => r.primary_contact_name ?? "",
        header: "Primary contact",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div>{c.primary_contact_name ?? "—"}</div>
              <div className="text-[12px] text-muted">{c.primary_contact_email ?? ""}</div>
            </div>
          );
        },
      },
      {
        id: "location",
        accessorFn: (r) => r.town ?? "",
        header: "Location",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div>{c.town ?? "—"}</div>
              <div className="text-[12px] text-muted">{c.postcode ?? ""}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => row.original.category ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "last",
        accessorFn: (r) => r.last_activity_at ?? "",
        header: "Last activity",
        cell: ({ row }) => (
          <span className="text-muted">{timeAgo(row.original.last_activity_at)}</span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-elevated shadow-panel">
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  onClick={h.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none border-b border-border bg-surface px-4 py-3 text-left text-[11.5px] font-semibold uppercase tracking-wide text-muted hover:text-foreground"
                >
                  <span className="inline-flex items-center gap-1.5">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    <ArrowUpDown size={12} className="opacity-50" />
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center">
                <div className="font-brand text-lg">No companies match</div>
                <div className="text-sm text-muted">Try clearing filters or your search.</div>
              </td>
            </tr>
          )}
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => router.push(`/companies/${row.original.id}`)}
              className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-[13.5px]">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: CompanyListRow["status"] }) {
  const meta = STATUS_META[status] ?? { label: status ?? "Unknown", className: "bg-[#9993] text-muted" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${meta.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}
