"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/companies`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-elevated p-8 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground">
            <span className="font-brand text-base font-bold">C</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="font-brand text-lg font-bold leading-none">
            Cheshire
            <span className="mt-0.5 block text-[8.5px] font-semibold tracking-[3px] text-muted">
              BOOKKEEPING
            </span>
          </div>
        </div>

        <h1 className="font-brand text-xl font-bold">Sign in</h1>
        <p className="mb-5 mt-1 text-[13px] text-muted">
          We&apos;ll email you a magic link — no password needed.
        </p>

        {!configured ? (
          <div className="rounded-md border border-accent bg-accent-soft px-3.5 py-3 text-[13px] text-accent">
            Supabase isn&apos;t configured yet. The app is running in demo mode —{" "}
            <a href="/companies" className="font-semibold underline">
              continue to the demo
            </a>
            .
          </div>
        ) : sent ? (
          <div className="rounded-md border border-accent bg-accent-soft px-3.5 py-3 text-[13px] text-accent">
            Check your inbox — a sign-in link is on its way to {email}.
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@cheshirebookkeeping.co.uk"
              className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary"
            />
            {error && <p className="text-[12.5px] text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
