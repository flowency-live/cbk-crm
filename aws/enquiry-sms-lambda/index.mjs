// AWS Lambda (Node.js 20) — enquiry-sms
// Trigger: a Lambda Function URL (POST), called by a Supabase Database Webhook
//          on INSERT into public.website_enquiries.
// IAM execution role needs: sns:Publish  (no static keys required).
// Env vars: SMS_TO (E.164, default +447834830404), WEBHOOK_SECRET, SNS_SENDER_ID (optional).

import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({});
const TO = process.env.SMS_TO || "+447834830404";
const SECRET = process.env.WEBHOOK_SECRET;

export const handler = async (event) => {
  const headers = event.headers || {};
  // Shared-secret check so only our Supabase webhook can invoke this.
  if (SECRET && headers["x-webhook-secret"] !== SECRET) {
    return { statusCode: 401, body: "unauthorized" };
  }

  let rec;
  try {
    const payload = JSON.parse(event.body || "{}");
    rec = payload.record || payload; // DB webhook sends { type, table, record, ... }
  } catch {
    return { statusCode: 400, body: "bad payload" };
  }
  if (!rec || !rec.name) return { statusCode: 200, body: "no record" };

  const business = rec.business_name ? ` (${rec.business_name})` : "";
  const service = rec.service_interest ? ` — ${rec.service_interest}` : "";
  const contact = [rec.email, rec.phone].filter(Boolean).join(" / ");
  const message =
    `New Hi-Vis enquiry: ${rec.name}${business}${service}. ${contact}. ` +
    `Via ${rec.page_source || "website"}. Open the CRM to convert.`;

  const MessageAttributes = {
    "AWS.SNS.SMS.SMSType": { DataType: "String", StringValue: "Transactional" },
  };
  if (process.env.SNS_SENDER_ID) {
    MessageAttributes["AWS.SNS.SMS.SenderID"] = {
      DataType: "String",
      StringValue: process.env.SNS_SENDER_ID,
    };
  }

  await sns.send(
    new PublishCommand({ PhoneNumber: TO, Message: message, MessageAttributes })
  );
  return { statusCode: 200, body: "sent" };
};
