"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [initials, setInitials] = useState("CB");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return; // demo mode, no session
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const meta = (user.user_metadata ?? {}) as { full_name?: string };
      const addr = user.email ?? "";
      setEmail(addr);
      const local = addr.split("@")[0] ?? "";
      const parts = (meta.full_name || local)
        .split(/[.\-_\s]+/)
        .filter(Boolean);
      const ini =
        (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "");
      setInitials(ini.toUpperCase() || addr.slice(0, 2).toUpperCase());
      setName(
        meta.full_name ||
          parts.map((p) => p[0].toUpperCase() + p.slice(1)).join(" ")
      );
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function signOut() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    window.location.assign("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-md border border-border bg-elevated shadow-card">
          <div className="border-b border-border px-3.5 py-3">
            <div className="text-[13px] font-semibold">{name || "Signed in"}</div>
            {email && (
              <div className="truncate text-[11.5px] text-muted">{email}</div>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
