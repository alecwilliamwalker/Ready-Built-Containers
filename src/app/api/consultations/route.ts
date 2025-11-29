import { NextResponse } from "next/server";
import { consultationRequestSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { sendEmail, getInternalRecipient } from "@/lib/email";

function formatConsultationHtml(data: {
  name: string;
  email: string;
  phone?: string | null;
  preferredModel?: string | null;
  preferredDate?: Date | null;
  timeZone?: string | null;
  notes?: string | null;
}) {
  return `
    <h1 style="margin-bottom:16px;">New Consultation Request</h1>
    <p><strong>Name:</strong> ${data.name}</p>
    <p><strong>Email:</strong> ${data.email}</p>
    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
    ${data.preferredModel ? `<p><strong>Preferred model:</strong> ${data.preferredModel}</p>` : ""}
    ${data.preferredDate ? `<p><strong>Preferred date:</strong> ${data.preferredDate.toISOString()}</p>` : ""}
    ${data.timeZone ? `<p><strong>Time zone:</strong> ${data.timeZone}</p>` : ""}
    ${data.notes ? `<p><strong>Notes:</strong><br/>${data.notes}</p>` : ""}
  `;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = consultationRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid consultation request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const preferredDate = data.preferredDate ? new Date(data.preferredDate) : null;

    const consultation = await prisma.consultationRequest.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        preferredModel: data.preferredModel ?? null,
        preferredDate,
        timeZone: data.timeZone ?? null,
        notes: data.notes ?? null,
      },
    });

    const html = formatConsultationHtml(consultation);
    const internalRecipient = getInternalRecipient();

    await Promise.allSettled([
      sendEmail({
        to: internalRecipient,
        subject: `Consultation requested by ${consultation.name}`,
        html,
        text: `Consultation requested by ${consultation.name} (${consultation.email}). Preferred model: ${consultation.preferredModel ?? "n/a"}`,
      }),
      sendEmail({
        to: consultation.email,
        subject: "Ready Built Containers consultation request received",
        html: `
          <p>Hi ${consultation.name},</p>
          <p>Thanks for booking time with Ready Built Containers. We&apos;ll reply shortly to confirm your consultation and share prep tips so we can make the most of the call.</p>
          <p>Feel free to reply with site photos, measurements, or any specific questions.</p>
          <p>— Ready Built Containers</p>
        `,
        text: `Hi ${consultation.name},\n\nThanks for booking a consultation with Ready Built Containers. We'll confirm the meeting shortly.\n\n— Ready Built Containers`,
      }),
    ]);

    return NextResponse.json({ success: true, consultationId: consultation.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating consultation request", error);
    return NextResponse.json({ error: "Failed to submit consultation request" }, { status: 500 });
  }
}


