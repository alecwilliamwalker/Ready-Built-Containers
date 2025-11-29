import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { sendEmail, getInternalRecipient } from "@/lib/email";

function formatLeadHtml(data: {
  name: string;
  email: string;
  phone?: string | null;
  state?: string | null;
  zip?: string | null;
  modelSlug?: string | null;
  timeline?: string | null;
  source: string;
  message?: string | null;
}) {
  return `
    <h1 style="margin-bottom:16px;">New Lead Submission</h1>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
    ${data.state ? `<p><strong>State:</strong> ${data.state}</p>` : ""}
    ${data.zip ? `<p><strong>ZIP:</strong> ${data.zip}</p>` : ""}
    ${data.modelSlug ? `<p><strong>Model Interest:</strong> ${data.modelSlug}</p>` : ""}
    ${data.timeline ? `<p><strong>Timeline:</strong> ${data.timeline}</p>` : ""}
    <p><strong>Source:</strong> ${data.source}</p>
    ${data.message ? `<p><strong>Message:</strong><br/>${data.message}</p>` : ""}
  `;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = leadSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid lead submission",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        state: data.state ?? null,
        zip: data.zip ?? null,
        modelSlug: data.modelSlug ?? null,
        timeline: data.timeline ?? null,
        source: data.source,
        message: data.message ?? null,
      },
    });

    const html = formatLeadHtml(lead);
    const internalRecipient = getInternalRecipient();

    await Promise.allSettled([
      sendEmail({
        to: internalRecipient,
        subject: `New lead from ${lead.name}`,
        html,
        text: `New lead from ${lead.name} (${lead.email}). Source: ${lead.source}`,
      }),
      sendEmail({
        to: lead.email,
        subject: "We received your Ready Built Containers inquiry",
        html: `
          <p>Hi ${lead.name},</p>
          <p>Thanks for reaching out about Ready Built Containers. Our founders personally review every inquiry and will respond within one business day with pricing and availability.</p>
          <p>If you have site photos or measurements, reply to this email so we can provide the most accurate delivery plan.</p>
          <p>— Ready Built Containers</p>
        `,
        text: `Hi ${lead.name},\n\nThanks for reaching out about Ready Built Containers. We'll respond within one business day with pricing and availability.\n\n— Ready Built Containers`,
      }),
    ]);

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead", error);
    return NextResponse.json({ error: "Failed to submit lead" }, { status: 500 });
  }
}


