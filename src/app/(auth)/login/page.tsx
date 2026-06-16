"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";

// Usernames map to an internal email so you can sign in with just a username.
const USERNAME_DOMAIN = "cheshirebookkeeping.app";

// Brand sticker colours (from the Cheshire Bookkeeping marketing style).
const TEAL = "#5FC2B4";
const LILAC = "#C3A9DE";

export default function LoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const email = username.includes("@")
        ? username.trim().toLowerCase()
        : `${username.trim().toLowerCase()}@${USERNAME_DOMAIN}`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.assign("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Incorrect username or password.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ---------- Brand panel ---------- */}
      <aside
        className="relative hidden flex-col overflow-hidden p-12 lg:flex"
        style={{
          background:
            "linear-gradient(140deg,#f4eefb 0%,#eaf6f3 55%,#f3eaf9 100%)",
        }}
      >
        {/* soft decorative blobs */}
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: TEAL }}
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-20 h-96 w-96 rounded-full opacity-40 blur-3xl"
          style={{ background: LILAC }}
        />

        {/* logo — front and centre */}
        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <Logo
            size={300}
            priority
            className="mb-8 drop-shadow-[0_12px_32px_rgba(0,0,0,0.10)]"
          />

          <p className="mb-3 text-[12px] font-semibold uppercase tracking-[2px] text-[#6b6b76]">
            Client Relationship Manager
          </p>
          <h1 className="font-brand text-4xl font-bold leading-[1.15] text-[#1c1c1c]">
            Welcome{" "}
            <span
              className="inline-block -rotate-2 rounded-xl px-3 py-0.5 text-[#1c1c1c]"
              style={{ background: LILAC }}
            >
              back
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-[#4a4a55]">
            Your clients, prospects and Companies House data — all in one calm,
            searchable place.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Sticker color={TEAL}>Making Tax Digital</Sticker>
            <Sticker color={LILAC}>Xero Certified</Sticker>
            <Sticker color={TEAL}>Companies House synced</Sticker>
          </div>
        </div>

        {/* footer tagline */}
        <div className="relative flex items-end justify-between text-[#6b6b76]">
          <p className="font-brand text-sm font-semibold">
            Supporting clients digitally across the UK
          </p>
          <span className="text-[11px] tracking-widest">EST 2026</span>
        </div>
      </aside>

      {/* ---------- Form panel ---------- */}
      <main className="flex items-center justify-center bg-background px-6 py-10">
        <div className="w-full max-w-sm">
          {/* mobile brand header */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo size={140} priority />
          </div>

          <h2 className="font-brand text-2xl font-bold">Sign in</h2>
          <p className="mb-6 mt-1 text-[13px] text-muted">
            Enter your details to continue.
          </p>

          {!configured ? (
            <div className="rounded-md border border-accent bg-accent-soft px-3.5 py-3 text-[13px] text-accent">
              Supabase isn&apos;t configured yet — running in demo mode.{" "}
              <a href="/dashboard" className="font-semibold underline">
                Continue to the demo
              </a>
              .
            </div>
          ) : (
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold text-muted">
                  Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sarah.powell"
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-semibold text-muted">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
              {error && <p className="text-[12.5px] text-danger">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-[11.5px] text-muted">
            Cheshire Bookkeeping CRM · EST 2026
          </p>
        </div>
      </main>
    </div>
  );
}

function Sticker({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className="inline-block rounded-lg px-3 py-1 font-brand text-[13px] font-bold text-[#1c1c1c]"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}
