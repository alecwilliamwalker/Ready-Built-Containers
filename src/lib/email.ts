import { Resend } from "resend";
import { env } from "@/lib/env";

const fromAddress = env.EMAIL_FROM_ADDRESS ?? "sales@readybuiltcontainers.com";
const fromName = env.EMAIL_FROM_NAME ?? "Ready Built Containers";

const resendClient = env.EMAIL_API_KEY ? new Resend(env.EMAIL_API_KEY) : null;

export type EmailAttachment = {
  filename: string;
  content: Buffer;
};

type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  attachments?: EmailAttachment[];
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  attachments,
}: SendEmailArgs) {
  if (!resendClient) {
    console.warn("Email API key not configured. Skipping email send.", {
      to,
      subject,
      attachmentCount: attachments?.length ?? 0,
    });
    return { id: "local-dev" };
  }

  // Convert Buffer attachments to base64 for Resend
  const resendAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: att.content.toString("base64"),
  }));

  const response = await resendClient.emails.send({
    from: `${fromName} <${fromAddress}>`,
    to,
    subject,
    html,
    text,
    replyTo,
    attachments: resendAttachments,
  });

  if (response.error) {
    console.error("Error sending email", response.error);
    throw new Error(response.error.message);
  }

  return response.data;
}

export function getInternalRecipient() {
  return env.INTERNAL_NOTIFICATIONS_EMAIL ?? fromAddress;
}

