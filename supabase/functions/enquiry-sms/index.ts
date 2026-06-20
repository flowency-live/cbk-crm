// Supabase Edge Function: enquiry-sms
// Fires from a Database Webhook on INSERT into public.website_enquiries and
// texts Sarah via Twilio. Secrets are set with `supabase secrets set` (or in the
// dashboard): TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, SMS_TO, WEBHOOK_SECRET.

Deno.serve(async (req: Request) => {
  // Simple shared-secret check so only our DB webhook can call this.
  const expected = Deno.env.get("WEBHOOK_SECRET");
  if (expected && req.headers.get("x-webhook-secret") !== expected) {
    return new Response("unauthorized", { status: 401 });
  }

  let record: Record<string, unknown> | undefined;
  try {
    const payload = await req.json();
    record = payload.record ?? payload; // DB webhook sends { type, table, record, ... }
  } catch {
    return new Response("bad payload", { status: 400 });
  }
  if (!record || !record.name) return new Response("no record", { status: 200 });

  const sid = Deno.env.get("TWILIO_SID");
  const token = Deno.env.get("TWILIO_TOKEN");
  const from = Deno.env.get("TWILIO_FROM"); // a Twilio number or alphanumeric sender ID
  const to = Deno.env.get("SMS_TO") ?? "+447834830404";
  if (!sid || !token || !from) {
    return new Response("sms not configured", { status: 500 });
  }

  const name = String(record.name ?? "");
  const business = record.business_name ? ` (${record.business_name})` : "";
  const service = record.service_interest ? ` — ${record.service_interest}` : "";
  const contact = [record.email, record.phone].filter(Boolean).join(" / ");
  const via = record.page_source ?? "website";
  const body =
    `New Hi-Vis enquiry: ${name}${business}${service}. ${contact}. ` +
    `Via ${via}. Open the CRM to convert.`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${sid}:${token}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    return new Response(`twilio error: ${detail}`, { status: 502 });
  }
  return new Response("sent", { status: 200 });
});
