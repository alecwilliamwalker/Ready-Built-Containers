/**
 * PDF Export for Design Studio
 * Generates a comprehensive PDF with floor plan, fixture list, and BOM breakdown
 */

import jsPDF from "jspdf";
import type { DesignConfig, ModuleCatalogItem } from "@/types/design";
import type { BOMSelections, BOMCalculation } from "@/types/bom";
import { calculateBOM, getDesignAnalysis } from "./bom-calculator";

export type PDFExportOptions = {
  designName: string;
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  bomSelections: BOMSelections;
  canvasElement?: HTMLElement | null;
};

/**
 * Capture SVG element as a PNG image using direct serialization
 * Rotates 90 degrees clockwise to display vertically on portrait pages
 */
async function captureSVG(containerElement: HTMLElement): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Find the SVG element inside the container
    const svgElement = containerElement.querySelector("svg");
    if (!svgElement) {
      reject(new Error("No SVG element found in container"));
      return;
    }

    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Get the computed dimensions
    const bbox = svgElement.getBoundingClientRect();
    const scale = 3; // 3x for higher quality
    const origWidth = bbox.width * scale;
    const origHeight = bbox.height * scale;
    
    // Set explicit dimensions on the clone (remove percentage-based sizing)
    svgClone.setAttribute("width", String(origWidth));
    svgClone.setAttribute("height", String(origHeight));
    svgClone.style.width = `${origWidth}px`;
    svgClone.style.height = `${origHeight}px`;
    
    // Get all elements from both original and clone using tree walker for exact matching
    const originalElements = Array.from(svgElement.querySelectorAll("*"));
    const cloneElements = Array.from(svgClone.querySelectorAll("*"));
    
    // Key SVG presentation attributes to inline
    const svgAttributes = [
      "fill", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin",
      "opacity", "fill-opacity", "stroke-opacity", "transform",
      "font-family", "font-size", "font-weight", "font-style",
      "text-anchor", "dominant-baseline", "letter-spacing",
      "visibility", "display"
    ];
    
    // Inline styles by matching elements at the same index (tree order)
    cloneElements.forEach((cloneEl, index) => {
      const originalEl = originalElements[index];
      if (!originalEl || !(cloneEl instanceof SVGElement)) return;
      
      const computedStyle = window.getComputedStyle(originalEl);
      
      // Copy computed styles as inline styles
      svgAttributes.forEach((prop) => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== "none" && value !== "") {
          // Set as attribute for better SVG compatibility
          const attrName = prop; // SVG attributes use kebab-case
          if (!cloneEl.hasAttribute(attrName) || cloneEl.getAttribute(attrName) === "") {
            cloneEl.setAttribute(attrName, value);
          }
        }
      });
      
      // Ensure stroke and fill are properly set if they exist
      if (originalEl instanceof SVGElement) {
        const origStroke = originalEl.getAttribute("stroke");
        const origFill = originalEl.getAttribute("fill");
        const origStrokeWidth = originalEl.getAttribute("stroke-width");
        const origStrokeDasharray = originalEl.getAttribute("stroke-dasharray");
        
        if (origStroke) cloneEl.setAttribute("stroke", origStroke);
        if (origFill) cloneEl.setAttribute("fill", origFill);
        if (origStrokeWidth) cloneEl.setAttribute("stroke-width", origStrokeWidth);
        if (origStrokeDasharray) cloneEl.setAttribute("stroke-dasharray", origStrokeDasharray);
      }
    });

    // Also handle group elements that may have inherited styles
    const groupElements = svgClone.querySelectorAll("g");
    const originalGroups = svgElement.querySelectorAll("g");
    groupElements.forEach((g, index) => {
      const origG = originalGroups[index];
      if (!origG) return;
      
      // Copy stroke/fill from group to children if group has them
      const groupStroke = origG.getAttribute("stroke");
      const groupStrokeWidth = origG.getAttribute("stroke-width");
      const groupFill = origG.getAttribute("fill");
      
      if (groupStroke) g.setAttribute("stroke", groupStroke);
      if (groupStrokeWidth) g.setAttribute("stroke-width", groupStrokeWidth);
      if (groupFill) g.setAttribute("fill", groupFill);
    });

    // Add xmlns namespace if missing
    if (!svgClone.hasAttribute("xmlns")) {
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    
    // Create a data URL from the SVG (use base64 for better compatibility)
    const base64 = btoa(unescape(encodeURIComponent(svgString)));
    const svgDataUrl = `data:image/svg+xml;base64,${base64}`;
    
    // Create an image from the SVG
    const img = new Image();
    img.onload = () => {
      // First canvas: render the SVG
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = origWidth;
      tempCanvas.height = origHeight;
      const tempCtx = tempCanvas.getContext("2d");
      
      if (!tempCtx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      // Fill with background color first
      tempCtx.fillStyle = "#020617"; // Match the SVG background
      tempCtx.fillRect(0, 0, origWidth, origHeight);
      
      // Draw the SVG image
      tempCtx.drawImage(img, 0, 0, origWidth, origHeight);
      
      // Second canvas: rotate 90 degrees clockwise
      // After rotation, width and height are swapped
      const rotatedCanvas = document.createElement("canvas");
      rotatedCanvas.width = origHeight;  // Swapped
      rotatedCanvas.height = origWidth;  // Swapped
      const rotatedCtx = rotatedCanvas.getContext("2d");
      
      if (!rotatedCtx) {
        reject(new Error("Could not get rotated canvas context"));
        return;
      }
      
      // Fill background
      rotatedCtx.fillStyle = "#020617";
      rotatedCtx.fillRect(0, 0, rotatedCanvas.width, rotatedCanvas.height);
      
      // Rotate 90 degrees clockwise
      rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedCtx.rotate(Math.PI / 2);
      rotatedCtx.drawImage(tempCanvas, -origWidth / 2, -origHeight / 2);
      
      // Return rotated image with its new dimensions
      resolve({
        dataUrl: rotatedCanvas.toDataURL("image/png"),
        width: rotatedCanvas.width,
        height: rotatedCanvas.height
      });
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load SVG as image"));
    };
    
    img.src = svgDataUrl;
  });
}

/**
 * Format currency from cents
 */
function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate PDF export
 */
export async function generatePDF(options: PDFExportOptions): Promise<void> {
  const { designName, design, catalog, bomSelections, canvasElement } = options;
  
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
  pdf.text(`Generated: ${new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, margin, 95);

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
  pdf.text(`${analysis.shellLengthFt}' × ${analysis.shellWidthFt}' × ${analysis.shellHeightFt}' High Cube Container`, margin + 8, 133);
  pdf.text(`Floor Area: ${analysis.floorSqft} sq ft  |  ${design.fixtures.length} Fixtures  |  ${design.zones.length} Zones`, margin + 8, 141);

  // Total Price Box
  pdf.setFillColor(245, 158, 11); // amber-500
  pdf.roundedRect(margin, 160, contentWidth, 45, 3, 3, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Estimated Project Total", margin + 8, 175);
  
  pdf.setFontSize(28);
  const priceText = formatCurrency(bom.grandTotalCents);
  const priceTextWidth = pdf.getTextWidth(priceText); // Calculate width while font is still 28pt
  pdf.text(priceText, margin + 8, 195);
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("(includes 10% contingency)", margin + 8 + priceTextWidth + 5, 195);

  // ============================================
  // PAGE 2: Floor Plan (if canvas available)
  // ============================================
  
  if (canvasElement) {
    pdf.addPage();
    
    // Header
    pdf.setFillColor(15, 23, 42);
    pdf.rect(0, 0, pageWidth, 25, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Floor Plan", margin, 17);

    try {
      const captured = await captureSVG(canvasElement);
      
      // Calculate dimensions to fit the page while preserving aspect ratio
      // The image is now rotated 90° so it displays vertically
      const maxWidth = contentWidth;
      const maxHeight = pageHeight - 50; // More space for the rotated image
      
      // Calculate aspect ratio from the rotated image dimensions
      const aspectRatio = captured.width / captured.height;
      let imgWidth = maxWidth;
      let imgHeight = maxWidth / aspectRatio;
      
      // If height exceeds max, scale down based on height
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
      }
      
      // Center the image horizontally
      const imgX = margin + (contentWidth - imgWidth) / 2;
      
      // Center vertically in the available space
      const availableHeight = pageHeight - 35;
      const imgY = 35 + (availableHeight - imgHeight) / 2;
      
      // Add the rotated image centered on the page
      pdf.addImage(captured.dataUrl, "PNG", imgX, imgY, imgWidth, imgHeight, undefined, "FAST");
    } catch (error) {
      console.error("Error capturing canvas:", error);
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(12);
      pdf.text("Floor plan image could not be captured.", margin, 50);
    }
  }

  // ============================================
  // PAGE 3: Fixture List
  // ============================================
  
  pdf.addPage();
  
  // Header
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageWidth, 25, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("Fixture List", margin, 17);

  let yPos = 40;

  // Group fixtures by category
  const fixturesByCategory: Record<string, Array<{ name: string; count: number }>> = {};
  
  design.fixtures.forEach(fixture => {
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) return;
    
    const category = catalogItem.category;
    if (!fixturesByCategory[category]) {
      fixturesByCategory[category] = [];
    }
    
    const existing = fixturesByCategory[category].find(f => f.name === catalogItem.label);
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
      const categoryLabel = category.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      pdf.text(index === 0 ? categoryLabel : "", margin + 3, yPos + 1);
      pdf.setTextColor(30, 41, 59);
      pdf.text(fixture.name, margin + 50, yPos + 1);
      pdf.text(fixture.count.toString(), pageWidth - margin - 12, yPos + 1);
      yPos += 7;
    });
    yPos += 3;
  });

  // ============================================
  // PAGE 4+: BOM Breakdown
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
    { label: "Labor", cost: bom.labor.costCents, details: `${bom.labor.totalHours} hours` },
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
    const truncatedDetails = pdf.getTextWidth(details) > maxDetailsWidth 
      ? details.substring(0, 40) + "..." 
      : details;
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
  // Footer on all pages
  // ============================================
  
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Ready Built Containers  |  ${designName}  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  // Save the PDF
  pdf.save(`${designName.replace(/[^a-z0-9]/gi, "_")}_Proposal.pdf`);
}

