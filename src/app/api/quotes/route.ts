import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { sendEmail, getInternalRecipient } from "@/lib/email";

function formatQuoteHtml(data: {
  name: string;
  email: string;
  phone?: string | null;
  modelSlug?: string | null;
  landState?: string | null;
  landZip?: string | null;
  landDescription?: string | null;
  powerPreference?: string | null;
  waterPreference?: string | null;
  septicSituation?: string | null;
  timeline?: string | null;
  budgetRange?: string | null;
  message?: string | null;
}) {
  const fields: Array<[string, string | null | undefined]> = [
    ["Email", data.email],
    ["Phone", data.phone],
    ["Model", data.modelSlug],
    ["Land State", data.landState],
    ["Land ZIP", data.landZip],
    ["Power", data.powerPreference],
    ["Water", data.waterPreference],
    ["Septic", data.septicSituation],
    ["Timeline", data.timeline],
    ["Budget", data.budgetRange],
  ];

  const fieldHtml = fields
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`) 
    .join("\n");

  return `
    <h1 style="margin-bottom:16px;">New Quote Request</h1>
    <p><strong>Name:</strong> ${data.name}</p>
    ${fieldHtml}
    ${data.landDescription ? `<p><strong>Land description:</strong><br/>${data.landDescription}</p>` : ""}
    ${data.message ? `<p><strong>Message:</strong><br/>${data.message}</p>` : ""}
  `;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = quoteRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid quote request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const quote = await prisma.quoteRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        modelSlug: data.modelSlug ?? null,
        landState: data.landState ?? null,
        landZip: data.landZip ?? null,
        landDescription: data.landDescription ?? null,
        powerPreference: data.powerPreference ?? null,
        waterPreference: data.waterPreference ?? null,
        septicSituation: data.septicSituation ?? null,
        timeline: data.timeline ?? null,
        budgetRange: data.budgetRange ?? null,
        message: data.message ?? null,
      },
    });

    const html = formatQuoteHtml(quote);
    const internalRecipient = getInternalRecipient();

    await Promise.allSettled([
      sendEmail({
        to: internalRecipient,
        subject: `Quote request from ${quote.name}`,
        html,
        text: `Quote request from ${quote.name} (${quote.email}). Model: ${quote.modelSlug ?? "n/a"}`,
      }),
      sendEmail({
        to: quote.email,
        subject: "Ready Built Containers quote request received",
        html: `
          <p>Hi ${quote.name},</p>
          <p>Thanks for sending over the details on your site. We&apos;ll review access, utilities, and build timeline, then reply with a detailed proposal.</p>
          <p>If you have survey maps or photos, reply to this email and we&apos;ll add them to your project file.</p>
          <p>— Ready Built Containers</p>
        `,
        text: `Hi ${quote.name},\n\nThanks for sending over your site details. We'll review everything and reply with a full proposal.\n\n— Ready Built Containers`,
      }),
    ]);

    return NextResponse.json({ success: true, quoteId: quote.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating quote request", error);
    return NextResponse.json({ error: "Failed to submit quote request" }, { status: 500 });
  }
}


