import { SNSClient, PublishCommand } from "npm:@aws-sdk/client-sns@3"
import { Webhook } from "npm:standardwebhooks@1"

const snsClient = new SNSClient({
  region: Deno.env.get("AWS_REGION") ?? "eu-west-2",
  credentials: {
    accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY")!,
  },
})

interface SmsHookPayload {
  user: {
    id: string
    phone: string
  }
  sms: {
    otp: string
  }
}

// Supabase Auth hook secret (Dashboard -> Auth -> Hooks, shown as "v1,whsec_...").
// When set, every request must carry a valid standard-webhooks signature —
// without this, anyone who finds the URL can send SMS through our AWS account.
const rawHookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? ""
const hookSecret = rawHookSecret.replace("v1,whsec_", "")

Deno.serve(async (req) => {
  try {
    const bodyText = await req.text()

    if (hookSecret) {
      try {
        const wh = new Webhook(hookSecret)
        wh.verify(bodyText, {
          "webhook-id": req.headers.get("webhook-id") ?? "",
          "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
          "webhook-signature": req.headers.get("webhook-signature") ?? "",
        })
      } catch {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
        })
      }
    } else {
      console.warn(
        "SEND_SMS_HOOK_SECRET not set — hook signature NOT verified. Set it from Auth -> Hooks."
      )
    }

    const payload: SmsHookPayload = JSON.parse(bodyText)

    // Supabase delivers phone without the leading '+'; SNS needs E.164.
    const rawPhone = payload.user.phone
    const phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`
    const code = payload.sms.otp
    const message = `Your Hi-Vis Books verification code is: ${code}`

    const command = new PublishCommand({
      PhoneNumber: phone,
      Message: message,
      MessageAttributes: {
        "AWS.SNS.SMS.SMSType": {
          DataType: "String",
          StringValue: "Transactional",
        },
      },
    })

    await snsClient.send(command)

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Error sending SMS:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to send SMS",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
