"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OAuthProvider = "google" | "apple";

/** Optional extra providers, e.g. NEXT_PUBLIC_AUTH_PROVIDERS="google,apple". Default: none. */
const EXTRA_PROVIDERS = (process.env.NEXT_PUBLIC_AUTH_PROVIDERS ?? "")
  .split(",")
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is OAuthProvider => p === "google" || p === "apple");

function nextTarget(): string {
  if (typeof window === "undefined") return "/portal";
  return new URLSearchParams(window.location.search).get("next") || "/portal";
}
function redirectTo(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/auth/callback?next=${encodeURIComponent(nextTarget())}`;
}

/** Accepts "07700 900123", "+447700900123", "0044…" — returns E.164 or null. */
function normaliseUkPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, "");
  if (/^\+44\d{10}$/.test(digits)) return digits;
  if (/^0044\d{10}$/.test(digits)) return `+44${digits.slice(4)}`;
  if (/^07\d{9}$/.test(digits)) return `+44${digits.slice(1)}`;
  if (/^\+\d{8,15}$/.test(digits)) return digits; // non-UK, already E.164
  return null;
}

const FRIENDLY: Record<string, string> = {
  "Signups not allowed for otp":
    "We couldn't find an account for those details. Check you've used the email or mobile number we have on file — or get in touch and we'll sort it.",
  "Token has expired or is invalid":
    "That code didn't match or has expired — request a fresh one and try again.",
};

function friendly(message: string): string {
  for (const [k, v] of Object.entries(FRIENDLY)) {
    if (message.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return message;
}

export default function PortalLoginPage() {
  const configured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Phone code is the default path — simplest for on-site clients.
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"request" | "verify">("request");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchTab(next: "phone" | "email") {
    setTab(next);
    setErr(null);
    setMsg(null);
    setPhoneStep("request");
    setCode("");
  }

  async function sendSms(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    const e164 = normaliseUkPhone(phone);
    if (!e164) {
      setErr("That doesn't look like a mobile number — try the format 07700 900123.");
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setPhoneStep("verify");
      setMsg("We've texted you a 6-digit code — it can take a few seconds to arrive.");
    } catch (e) {
      setErr(friendly((e as Error).message));
    } finally {
      setLoading(false);
    }
  }

  async function verifySms(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const e164 = normaliseUkPhone(phone);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: e164 ?? phone.trim(),
        token: code.trim(),
        type: "sms",
      });
      if (error) throw error;
      window.location.assign(nextTarget());
    } catch (e) {
      setErr(friendly((e as Error).message));
      setLoading(false);
    }
  }

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
      setMsg(
        "Done — check your email and tap the sign-in link. If it's not there in a minute, check spam."
      );
    } catch (e) {
      setErr(friendly((e as Error).message));
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
      setErr(friendly((e as Error).message));
    }
  }

  return (
    <div className="mx-auto w-full" style={{ maxWidth: 430 }}>
      <h1 className="page-title">Sign in</h1>
      <p className="page-sub">
        No passwords here — we&apos;ll send you a code or a link instead.
      </p>

      {!configured ? (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
          Sign-in isn&apos;t configured yet.
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-border bg-elevated p-6">
          {/* Method toggle — phone first */}
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              onClick={() => switchTab("phone")}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold"
              style={
                tab === "phone"
                  ? { background: "var(--hv-yellow)", color: "var(--hv-ink)" }
                  : { background: "var(--hv-paper)", color: "var(--hv-muted)" }
              }
            >
              Text me a code
            </button>
            <button
              type="button"
              onClick={() => switchTab("email")}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold"
              style={
                tab === "email"
                  ? { background: "var(--hv-yellow)", color: "var(--hv-ink)" }
                  : { background: "var(--hv-paper)", color: "var(--hv-muted)" }
              }
            >
              Email me a link
            </button>
          </div>

          {tab === "phone" && phoneStep === "request" && (
            <form onSubmit={sendSms} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="login-phone">
                  Your mobile number
                </label>
                <input
                  id="login-phone"
                  className="field-input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07700 900123"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-yellow w-full">
                {loading ? "Sending…" : "Text me a code"}
              </button>
            </form>
          )}

          {tab === "phone" && phoneStep === "verify" && (
            <form onSubmit={verifySms} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="login-code">
                  Enter the 6-digit code
                </label>
                <input
                  id="login-code"
                  className="field-input text-center tracking-[0.4em]"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-yellow w-full">
                {loading ? "Checking…" : "Sign in"}
              </button>
              <button
                type="button"
                className="w-full text-center text-sm font-semibold"
                style={{ color: "var(--hv-teal-dark)", background: "none", border: 0, cursor: "pointer" }}
                onClick={(e) => {
                  setPhoneStep("request");
                  setCode("");
                  void sendSms(e as unknown as React.FormEvent);
                }}
              >
                Didn&apos;t get it? Send a new code
              </button>
            </form>
          )}

          {tab === "email" && (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="login-email">
                  Your email address
                </label>
                <input
                  id="login-email"
                  className="field-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.co.uk"
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-yellow w-full">
                {loading ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          )}

          {EXTRA_PROVIDERS.length > 0 && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs" style={{ color: "var(--hv-muted)" }}>
                <span className="h-px flex-1" style={{ background: "var(--hv-line)" }} /> or{" "}
                <span className="h-px flex-1" style={{ background: "var(--hv-line)" }} />
              </div>
              <div className="flex flex-col gap-2">
                {EXTRA_PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => signInOAuth(p)}
                    className="w-full rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold"
                  >
                    Continue with {p === "google" ? "Google" : "Apple"}
                  </button>
                ))}
              </div>
            </>
          )}

          {msg && (
            <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(47,138,123,.09)", color: "var(--hv-teal-dark)" }}>
              {msg}
            </p>
          )}
          {err && (
            <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: "rgba(200,85,61,.09)", color: "#a3442f" }}>
              {err}
            </p>
          )}
        </div>
      )}

      <p className="mt-5 text-sm" style={{ color: "var(--hv-muted)" }}>
        Once you&apos;re signed in on this device, you&apos;ll stay signed in — next
        time the portal will open straight away. Any trouble, email us and
        we&apos;ll get you in.
      </p>
    </div>
  );
}
