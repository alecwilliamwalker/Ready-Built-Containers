import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";
import { sendEmail, getInternalRecipient, type EmailAttachment } from "@/lib/email";
import { formatCurrencyCents } from "@/lib/format";
import { calculateBOM } from "@/lib/design/bom-calculator";
import { generatePDFBuffer } from "@/lib/design/pdf-export-server";
import { generateExcelBuffer } from "@/lib/design/excel-export-server";
import type { DesignConfig, ModuleCatalogItem, FixtureCategory } from "@/types/design";
import type { BOMSelections } from "@/types/bom";
import { DEFAULT_BOM_SELECTIONS } from "@/types/bom";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const design = await prisma.design.findFirst({ where: { id, userId: session.sub }, include: { user: true } });
  if (!design) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const notes = typeof payload?.notes === "string" ? payload.notes.slice(0, 2000) : null;

  try {
    const submission = await prisma.designSubmission.create({
      data: {
        designId: design.id,
        status: "pending",
        notes,
      },
    });

    // Load module catalog for BOM calculation
    const moduleCatalog = await prisma.moduleCatalog.findMany();
    const catalog: Record<string, ModuleCatalogItem> = {};
    for (const module of moduleCatalog) {
      catalog[module.key] = {
        key: module.key,
        label: module.name,
        category: module.category as FixtureCategory,
        footprintFt: (module.schemaJson as { footprintFt?: { width: number; length: number } })?.footprintFt ?? { width: 2, length: 2 },
        priceRule: { baseCents: 0, ...(module.priceRuleJson as { baseCents?: number; perLinearFtCents?: number }) },
      };
    }

    // Get BOM selections from design or use defaults
    const bomSelections: BOMSelections = (design.bomSelectionsJson as BOMSelections) ?? DEFAULT_BOM_SELECTIONS;
    const designConfig = design.configJson as DesignConfig;

    // Calculate BOM for accurate pricing
    const bom = calculateBOM(designConfig, catalog, bomSelections);

    const internalRecipient = getInternalRecipient();
    const fixtureCount = designConfig.fixtures?.length ?? 0;

    const summary = `
      <p><strong>Design:</strong> ${design.name}</p>
      <p><strong>User:</strong> ${session.email}</p>
      <p><strong>Shell:</strong> ${design.shellLengthFt}'</p>
      <p><strong>BOM Grand Total:</strong> ${formatCurrencyCents(bom.grandTotalCents)}</p>
      <p><strong>Fixtures:</strong> ${fixtureCount}</p>
      <p><strong>Labor:</strong> ${bom.labor.totalHours} hours</p>
      ${bomSelections.deliveryZip ? `<p><strong>Delivery ZIP:</strong> ${bomSelections.deliveryZip}</p>` : ""}
      ${notes ? `<p><strong>Notes:</strong><br/>${notes}</p>` : ""}
      <p style="margin-top: 20px; color: #666;"><em>PDF proposal and Excel BOM attached.</em></p>
    `;

    // Generate PDF and Excel attachments
    const sanitizedName = design.name.replace(/[^a-z0-9]/gi, "_");
    const attachments: EmailAttachment[] = [];

    try {
      const pdfBuffer = generatePDFBuffer({
        designName: design.name,
        design: designConfig,
        catalog,
        bomSelections,
      });
      attachments.push({
        filename: `${sanitizedName}_Proposal.pdf`,
        content: pdfBuffer,
      });
    } catch (pdfError) {
      console.error("Error generating PDF attachment:", pdfError);
    }

    try {
      const excelBuffer = generateExcelBuffer({
        designName: design.name,
        bom,
        selections: bomSelections,
      });
      attachments.push({
        filename: `${sanitizedName}_BOM.xlsx`,
        content: excelBuffer,
      });
    } catch (excelError) {
      console.error("Error generating Excel attachment:", excelError);
    }

    await Promise.allSettled([
      sendEmail({
        to: internalRecipient,
        subject: `New custom design submission: ${design.name}`,
        html: summary,
        text: `Design ${design.name} submitted by ${session.email}. Shell ${design.shellLengthFt}', ${fixtureCount} fixtures. BOM Total: ${formatCurrencyCents(bom.grandTotalCents)}.`,
        attachments,
      }),
      sendEmail({
        to: session.email,
        subject: "We received your custom design",
        html: `
          <p>Thanks for submitting ${design.name}. Our fabrication team will review the layout and reply with next steps.</p>
          <p>Reference ID: ${submission.id}</p>
        `,
      }),
    ]);

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error submitting design", error);
    return NextResponse.json({ error: "Failed to submit design" }, { status: 500 });
  }
}

