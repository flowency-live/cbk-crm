"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  ClipboardList,
  FileText,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/activities", label: "Activities", icon: CalendarDays },
  { href: "/backlog", label: "Backlog", icon: ClipboardList },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="grid h-screen grid-cols-[230px_1fr] grid-rows-[60px_1fr] max-[820px]:grid-cols-[64px_1fr]">
      {/* Logo cell (row 1, col 1) */}
      <div className="flex items-center gap-2.5 border-b border-r border-border px-3">
        <Logo size={42} priority className="shrink-0" />
        <div className="font-brand text-base font-bold leading-none max-[820px]:hidden">
          Cheshire
          <span className="mt-0.5 block text-[8.5px] font-semibold tracking-[3px] text-muted">
            BOOKKEEPING
          </span>
        </div>
      </div>

      {/* Top bar (row 1, col 2) */}
      <header className="flex items-center gap-3.5 border-b border-border px-5">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex max-w-[520px] flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3.5 py-2 text-muted transition-colors hover:border-primary"
        >
          <Search size={17} />
          <span className="flex-1 text-left text-sm">
            Search companies, contacts, anything…
          </span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[11px]">
            ⌘K
          </kbd>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell size={19} />
          </button>
          <UserMenu />
        </div>
      </header>

      {/* Sidebar (row 2, col 1) */}
      <nav className="flex flex-col gap-0.5 border-r border-border p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground",
                active && "bg-primary-soft font-semibold text-primary hover:bg-primary-soft hover:text-primary"
              )}
            >
              {active && (
                <span className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon size={18} className="shrink-0" />
              <span className="max-[820px]:hidden">{label}</span>
            </Link>
          );
        })}
        <div className="my-2.5 h-px bg-border" />
        <Link
          href="/reports"
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <FileText size={18} className="shrink-0" />
          <span className="max-[820px]:hidden">Reports</span>
        </Link>
        <div className="mt-auto px-3 py-2.5 text-[11px] text-muted max-[820px]:hidden">
          Cheshire CRM · EST 2026
        </div>
      </nav>

      {/* Main (row 2, col 2) */}
      <main className="overflow-y-auto">{children}</main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
