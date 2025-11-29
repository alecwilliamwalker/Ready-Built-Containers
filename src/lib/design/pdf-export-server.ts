/**
 * Server-side PDF Export for BOM
 * Generates a PDF buffer that can be attached to emails
 * 
 * Note: This version does not include the floor plan image since that
 * requires browser APIs (canvas, DOM). It includes cover page, fixture list,
 * and full BOM breakdown.
 */

import jsPDF from "jspdf";
import type { DesignConfig, ModuleCatalogItem } from "@/types/design";
import type { BOMSelections, BOMCalculation } from "@/types/bom";
import { calculateBOM, getDesignAnalysis } from "./bom-calculator";

export type PDFExportServerOptions = {
  designName: string;
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  bomSelections: BOMSelections;
};

/**
 * Format currency from cents
 */
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate PDF buffer for email attachment
 * Returns a Buffer that can be attached to emails
 */
export function generatePDFBuffer(options: PDFExportServerOptions): Buffer {
  const { designName, design, catalog, bomSelections } = options;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Calculate BOM data
  const bom = calculateBOM(design, catalog, bomSelections);
  const analysis = getDesignAnalysis(design, catalog);

  // ============================================
  // PAGE 1: Cover Page
  // ============================================

  // Header
  pdf.setFillColor(15, 23, 42); // slate-950
  pdf.rect(0, 0, pageWidth, 60, "F");

  pdf.setTextColor(245, 158, 11); // amber-500
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("Ready Built Containers", margin, 30);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Custom Container Design Proposal", margin, 42);

  // Design Name
  pdf.setTextColor(30, 41, 59); // slate-800
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(designName, margin, 85);

  // Date
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `Generated: ${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    margin,
    95
  );

  // Shell Dimensions Box
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin, 110, contentWidth, 35, 3, 3, "F");

  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Container Specifications", margin + 8, 122);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.text(
    `${analysis.shellLengthFt}' × ${analysis.shellWidthFt}' × ${analysis.shellHeightFt}' High Cube Container`,
    margin + 8,
    133
  );
  pdf.text(
    `Floor Area: ${analysis.floorSqft} sq ft  |  ${design.fixtures.length} Fixtures  |  ${design.zones?.length ?? 0} Zones`,
    margin + 8,
    141
  );

  // Total Price Box
  pdf.setFillColor(245, 158, 11); // amber-500
  pdf.roundedRect(margin, 160, contentWidth, 45, 3, 3, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Estimated Project Total", margin + 8, 175);

  pdf.setFontSize(28);
  const priceText = formatCurrency(bom.grandTotalCents);
  const priceTextWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, margin + 8, 195);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("(includes 10% contingency)", margin + 8 + priceTextWidth + 5, 195);

  // Material Selections Summary
  pdf.setTextColor(30, 41, 59);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Material Selections", margin, 230);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105);
  let yPos = 240;

  const materialDetails = [
    `Insulation: ${bomSelections.insulation.replace(/-/g, " ")}`,
    `Interior Finish: ${bomSelections.interiorFinish.replace(/-/g, " ")}`,
    `Flooring: ${bomSelections.flooring.replace(/-/g, " ")}`,
    `Exterior Finish: ${bomSelections.exteriorFinish.replace(/-/g, " ")}`,
    `Roofing: Membrane${bomSelections.roofingDeckPrep ? " + Deck Prep" : ""}${bomSelections.roofingSolarRails ? " + Solar Rails" : ""}`,
  ];

  materialDetails.forEach((detail) => {
    pdf.text(detail, margin + 8, yPos);
    yPos += 6;
  });

  // ============================================
  // PAGE 2: Fixture List
  // ============================================

  pdf.addPage();

  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 25, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Fixture List", margin, 17);

  yPos = 40;

  // Group fixtures by category
  const fixturesByCategory: Record<string, Array<{ name: string; count: number }>> = {};

  design.fixtures.forEach((fixture) => {
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) return;

    const category = catalogItem.category;
    if (!fixturesByCategory[category]) {
      fixturesByCategory[category] = [];
    }

    const existing = fixturesByCategory[category].find((f) => f.name === catalogItem.label);
    if (existing) {
      existing.count++;
    } else {
      fixturesByCategory[category].push({ name: catalogItem.label, count: 1 });
    }
  });

  // Table header
  pdf.setFillColor(241, 245, 249); // slate-100
  pdf.rect(margin, yPos, contentWidth, 8, "F");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Category", margin + 3, yPos + 5.5);
  pdf.text("Item", margin + 50, yPos + 5.5);
  pdf.text("Qty", pageWidth - margin - 15, yPos + 5.5);
  yPos += 10;

  // Fixture rows
  pdf.setFont("helvetica", "normal");
  Object.entries(fixturesByCategory).forEach(([category, fixtures]) => {
    fixtures.forEach((fixture, index) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 30;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPos - 3, contentWidth, 7, "F");
      }

      pdf.setTextColor(71, 85, 105);
      const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      pdf.text(index === 0 ? categoryLabel : "", margin + 3, yPos + 1);
      pdf.setTextColor(30, 41, 59);
      pdf.text(fixture.name, margin + 50, yPos + 1);
      pdf.text(fixture.count.toString(), pageWidth - margin - 12, yPos + 1);
      yPos += 7;
    });
    yPos += 3;
  });

  // ============================================
  // PAGE 3+: BOM Breakdown
  // ============================================

  pdf.addPage();

  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 25, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Bill of Materials", margin, 17);

  yPos = 40;

  const bomItems = [
    { label: "Container Shell", cost: bom.container.costCents, details: bom.container.details },
    { label: "Fixtures & Appliances", cost: bom.fixtures.costCents, details: bom.fixtures.details },
    { label: "Walls & Insulation", cost: bom.wallsInsulation.costCents, details: bom.wallsInsulation.details },
    { label: "Flooring", cost: bom.flooring.costCents, details: bom.flooring.details },
    { label: "Electrical", cost: bom.electrical.costCents, details: bom.electrical.details },
    { label: "Plumbing", cost: bom.plumbing.costCents, details: bom.plumbing.details },
    { label: "Exterior Finish", cost: bom.exteriorFinish.costCents, details: bom.exteriorFinish.details },
    { label: "Roofing", cost: bom.roofing.costCents, details: bom.roofing.details },
    { label: "Labor", cost: bom.labor.costCents, details: `${bom.labor.totalHours} hours @ $${(bomSelections.laborRateCents / 100).toFixed(2)}/hr` },
    { label: "Delivery", cost: bom.delivery.costCents, details: bom.delivery.details },
  ];

  // Table header
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margin, yPos, contentWidth, 8, "F");
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Category", margin + 3, yPos + 5.5);
  pdf.text("Details", margin + 55, yPos + 5.5);
  pdf.text("Cost", pageWidth - margin - 25, yPos + 5.5);
  yPos += 10;

  // BOM rows
  pdf.setFont("helvetica", "normal");
  bomItems.forEach((item, index) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = 30;
    }

    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos - 3, contentWidth, 8, "F");
    }

    pdf.setTextColor(30, 41, 59);
    pdf.setFont("helvetica", "bold");
    pdf.text(item.label, margin + 3, yPos + 2);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 116, 139);

    // Truncate details if too long
    const details = item.details || "";
    const maxDetailsWidth = 70;
    const truncatedDetails = pdf.getTextWidth(details) > maxDetailsWidth ? details.substring(0, 40) + "..." : details;
    pdf.text(truncatedDetails, margin + 55, yPos + 2);

    pdf.setTextColor(30, 41, 59);
    pdf.text(formatCurrency(item.cost), pageWidth - margin - 25, yPos + 2);
    yPos += 9;
  });

  // Totals section
  yPos += 5;
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Subtotal
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(11);
  pdf.text("Subtotal", margin + 3, yPos);
  pdf.text(formatCurrency(bom.subtotalCents), pageWidth - margin - 25, yPos);
  yPos += 7;

  // Contingency
  pdf.text("Contingency (10%)", margin + 3, yPos);
  pdf.text(formatCurrency(bom.contingencyCents), pageWidth - margin - 25, yPos);
  yPos += 10;

  // Grand Total
  pdf.setFillColor(245, 158, 11);
  pdf.roundedRect(margin, yPos - 3, contentWidth, 12, 2, 2, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("GRAND TOTAL", margin + 5, yPos + 5);
  pdf.text(formatCurrency(bom.grandTotalCents), pageWidth - margin - 25, yPos + 5);

  // ============================================
  // PAGE 4: Labor Breakdown (if labor hours exist)
  // ============================================

  if (bom.labor.breakdown.length > 0) {
    pdf.addPage();

    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 25, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Labor Breakdown", margin, 17);

    yPos = 40;

    // Table header
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, yPos, contentWidth, 8, "F");
    pdf.setTextColor(71, 85, 105);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Task", margin + 3, yPos + 5.5);
    pdf.text("Description", margin + 70, yPos + 5.5);
    pdf.text("Hours", pageWidth - margin - 20, yPos + 5.5);
    yPos += 10;

    // Labor rows
    pdf.setFont("helvetica", "normal");
    bom.labor.breakdown.forEach((item, index) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = 30;
      }

      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPos - 3, contentWidth, 7, "F");
      }

      pdf.setTextColor(30, 41, 59);
      pdf.text(item.label, margin + 3, yPos + 1);
      pdf.setTextColor(100, 116, 139);
      pdf.text(item.description || "", margin + 70, yPos + 1);
      pdf.setTextColor(30, 41, 59);
      pdf.text(item.hours.toFixed(1), pageWidth - margin - 17, yPos + 1);
      yPos += 7;
    });

    // Total hours
    yPos += 5;
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 41, 59);
    pdf.text("Total Hours", margin + 3, yPos);
    pdf.text(bom.labor.totalHours.toFixed(1), pageWidth - margin - 17, yPos);
    yPos += 7;
    pdf.text("Labor Cost", margin + 3, yPos);
    pdf.text(formatCurrency(bom.labor.costCents), pageWidth - margin - 25, yPos);
  }

  // ============================================
  // Footer on all pages
  // ============================================

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.setFont("helvetica", "normal");
    pdf.text(`Ready Built Containers  |  ${designName}  |  Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
      align: "center",
    });
  }

  // Return as buffer
  const arrayBuffer = pdf.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

