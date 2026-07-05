"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "apple";

function nextTarget(): string {
  if (typeof window === "undefined") return "/portal";
  return new URLSearchParams(window.location.search).get("next") || "/portal";
}
function redirectTo(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth/callback?next=${encodeURIComponent(nextTarget())}`;
}

export default function PortalLoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"request" | "verify">("request");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show errors from auth callback (e.g., expired link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setErr(decodeURIComponent(urlError));
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: redirectTo(), shouldCreateUser: false },
      });
      if (error) throw error;
      setMsg("Check your email for a secure sign-in link. Open it in this browser.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function signInOAuth(provider: OAuthProvider) {
    setErr(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectTo() },
      });
      if (error) throw error;
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function sendSms(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setPhoneStep("verify");
      setMsg("We've texted you a 6-digit code.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verifySms(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      window.location.assign(nextTarget());
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-sm">
      <h1 className="text-xl font-semibold">Sign in to your portal</h1>
      <p className="mb-6 mt-1 text-sm text-muted">No passwords — pick a method below.</p>

      {!configured ? (
        <div className="rounded-md border border-accent bg-accent-soft px-3.5 py-3 text-sm text-accent">
          Sign-in isn&apos;t configured yet.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => signInOAuth("google")}
              className="w-full rounded-md border border-border bg-elevated py-2.5 text-sm font-semibold hover:bg-surface"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => signInOAuth("apple")}
              className="w-full rounded-md border border-border bg-elevated py-2.5 text-sm font-semibold hover:bg-surface"
            >
              Continue with Apple
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <div className="mb-4 flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setTab("email")}
              className={`flex-1 rounded-md py-1.5 ${tab === "email" ? "bg-surface font-semibold" : "text-muted"}`}
            >
              Email link
            </button>
            <button
              type="button"
              onClick={() => setTab("phone")}
              className={`flex-1 rounded-md py-1.5 ${tab === "phone" ? "bg-surface font-semibold" : "text-muted"}`}
            >
              Text code
            </button>
          </div>

          {tab === "email" ? (
            <form onSubmit={sendMagicLink} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.co.uk"
                className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                style={{ background: "var(--brand-primary)" }}
              >
                {loading ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          ) : phoneStep === "request" ? (
            <form onSubmit={sendSms} className="space-y-3">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+447700900000"
                className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                style={{ background: "var(--brand-primary)" }}
              >
                {loading ? "Sending…" : "Text me a code"}
              </button>
            </form>
          ) : (
            <form onSubmit={verifySms} className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-foreground"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md py-2.5 text-sm font-semibold text-black disabled:opacity-50"
                style={{ background: "var(--brand-primary)" }}
              >
                {loading ? "Verifying…" : "Verify & sign in"}
              </button>
            </form>
          )}

          {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}
          {err && <p className="mt-4 text-sm text-danger">{err}</p>}
        </>
      )}
    </div>
  );
}
