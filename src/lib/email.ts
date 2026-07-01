/**
 * Email utility — env-gated so the app works without a provider configured.
 * Uses Resend when RESEND_API_KEY is set; otherwise logs and skips.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Send a transactional email. No-ops cleanly if RESEND_API_KEY is unset.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@hivisbooks.co.uk";

  if (!apiKey) {
    console.log("[email] Skipped (no RESEND_API_KEY):", options.subject, "→", options.to);
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend error:", res.status, text);
      return { ok: false, error: `Resend ${res.status}: ${text}` };
    }

    console.log("[email] Sent:", options.subject, "→", options.to);
    return { ok: true };
  } catch (err) {
    console.error("[email] Failed:", err);
    return { ok: false, error: (err as Error).message };
  }
}
