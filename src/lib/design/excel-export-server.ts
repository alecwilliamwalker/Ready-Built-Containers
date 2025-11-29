/**
 * Server-side Excel Export for BOM
 * Generates an Excel buffer that can be attached to emails
 */

import XLSX from "xlsx-js-style";
import type { BOMCalculation, BOMSelections } from "@/types/bom";

export type ExcelExportOptions = {
  designName: string;
  bom: BOMCalculation;
  selections: BOMSelections;
};

/**
 * Generate Excel buffer for BOM
 * Returns a Buffer that can be attached to emails
 */
export function generateExcelBuffer(options: ExcelExportOptions): Buffer {
  const { designName, bom, selections } = options;

  // Style definitions
  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "2D5016" } }, // Forest green
    alignment: { horizontal: "center", vertical: "center" },
  };
  const headerStyle = {
    font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4A7C23" } }, // Lighter green
    alignment: { horizontal: "left" },
    border: {
      bottom: { style: "medium", color: { rgb: "2D5016" } },
    },
  };
  const dataStyle = {
    font: { sz: 10 },
    alignment: { horizontal: "left", vertical: "center" },
    border: {
      bottom: { style: "thin", color: { rgb: "E0E0E0" } },
    },
  };
  const costStyle = {
    ...dataStyle,
    alignment: { horizontal: "right", vertical: "center" },
  };
  const subtotalStyle = {
    font: { bold: true, sz: 10 },
    fill: { fgColor: { rgb: "F5F5F5" } },
    alignment: { horizontal: "right" },
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
    },
  };
  const grandTotalStyle = {
    font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "D4A845" } }, // Gold/amber
    alignment: { horizontal: "right" },
    border: {
      top: { style: "medium", color: { rgb: "B8942E" } },
    },
  };
  const laborHeaderStyle = {
    font: { bold: true, sz: 10, color: { rgb: "333333" } },
    fill: { fgColor: { rgb: "E8E8E8" } },
    border: {
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
    },
  };

  // Helper function to format currency
  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Build the data array for Excel
  const data: (string | number)[][] = [];

  // Title row (row 0)
  data.push([`Bill of Materials - ${designName}`]);
  data.push([]); // Empty row for spacing (row 1)

  // Header row (row 2)
  data.push(["Category", "Description", "Cost"]);

  // Main cost items (rows 3-12)
  data.push(["Container Shell", bom.container.details || "", formatCurrency(bom.container.costCents)]);
  data.push(["Fixtures & Appliances", bom.fixtures.details || "", formatCurrency(bom.fixtures.costCents)]);
  data.push(["Walls & Insulation", bom.wallsInsulation.details || "", formatCurrency(bom.wallsInsulation.costCents)]);
  data.push(["Flooring", bom.flooring.details || "", formatCurrency(bom.flooring.costCents)]);
  data.push(["Electrical", bom.electrical.details || "", formatCurrency(bom.electrical.costCents)]);
  data.push(["Plumbing", bom.plumbing.details || "", formatCurrency(bom.plumbing.costCents)]);
  data.push(["Exterior Finish", bom.exteriorFinish.details || "", formatCurrency(bom.exteriorFinish.costCents)]);
  data.push(["Roofing", bom.roofing.details || "", formatCurrency(bom.roofing.costCents)]);
  data.push([
    "Labor",
    `${bom.labor.totalHours} hours @ $${(selections.laborRateCents / 100).toFixed(2)}/hr`,
    formatCurrency(bom.labor.costCents),
  ]);
  data.push(["Delivery", bom.delivery.details || "", formatCurrency(bom.delivery.costCents)]);

  // Empty row before totals (row 13)
  data.push([]);

  // Totals section (rows 14-16)
  const subtotalRow = data.length;
  data.push(["Subtotal", "", formatCurrency(bom.subtotalCents)]);
  data.push(["Contingency (10%)", "", formatCurrency(bom.contingencyCents)]);
  const grandTotalRow = data.length;
  data.push(["GRAND TOTAL", "", formatCurrency(bom.grandTotalCents)]);

  // Labor breakdown section
  let laborBreakdownHeaderRow = -1;
  let laborTotalRow = -1;
  if (bom.labor.breakdown.length > 0) {
    data.push([]);
    data.push([]);
    laborBreakdownHeaderRow = data.length;
    data.push(["Labor Breakdown", "Hours", "Notes"]);
    bom.labor.breakdown.forEach((item) => {
      data.push([item.label, item.hours.toFixed(1), item.description || ""]);
    });
    laborTotalRow = data.length;
    data.push(["Total Hours", bom.labor.totalHours.toFixed(1), ""]);
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Apply styles to cells
  // Title row
  if (ws["A1"]) ws["A1"].s = titleStyle;

  // Header row (row 2, index 2)
  ["A3", "B3", "C3"].forEach((cell) => {
    if (ws[cell]) ws[cell].s = headerStyle;
  });

  // Data rows (rows 3-12)
  for (let row = 4; row <= 13; row++) {
    if (ws[`A${row}`]) ws[`A${row}`].s = { ...dataStyle, font: { ...dataStyle.font, bold: true } };
    if (ws[`B${row}`]) ws[`B${row}`].s = dataStyle;
    if (ws[`C${row}`]) ws[`C${row}`].s = costStyle;
  }

  // Subtotal rows
  const subtotalRowNum = subtotalRow + 1;
  ["A", "B", "C"].forEach((col) => {
    if (ws[`${col}${subtotalRowNum}`]) ws[`${col}${subtotalRowNum}`].s = subtotalStyle;
    if (ws[`${col}${subtotalRowNum + 1}`]) ws[`${col}${subtotalRowNum + 1}`].s = subtotalStyle;
  });

  // Grand total row
  const grandTotalRowNum = grandTotalRow + 1;
  ["A", "B", "C"].forEach((col) => {
    if (ws[`${col}${grandTotalRowNum}`]) ws[`${col}${grandTotalRowNum}`].s = grandTotalStyle;
  });

  // Labor breakdown section styling
  if (laborBreakdownHeaderRow > 0) {
    const lbHeaderRowNum = laborBreakdownHeaderRow + 1;
    ["A", "B", "C"].forEach((col) => {
      if (ws[`${col}${lbHeaderRowNum}`]) ws[`${col}${lbHeaderRowNum}`].s = laborHeaderStyle;
    });

    // Labor total row
    if (laborTotalRow > 0) {
      const lbTotalRowNum = laborTotalRow + 1;
      ["A", "B", "C"].forEach((col) => {
        if (ws[`${col}${lbTotalRowNum}`])
          ws[`${col}${lbTotalRowNum}`].s = {
            font: { bold: true, sz: 10 },
            fill: { fgColor: { rgb: "F0F0F0" } },
            border: { top: { style: "thin", color: { rgb: "CCCCCC" } } },
          };
      });
    }
  }

  // Set column widths for better readability (wch = width in characters)
  ws["!cols"] = [
    { wch: 30 }, // Category - wide enough for labels
    { wch: 55 }, // Description - extra wide for details
    { wch: 18 }, // Cost
  ];

  // Set row heights
  ws["!rows"] = [
    { hpt: 28 }, // Title row - taller
  ];

  // Merge cells for title row
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title across all columns
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Bill of Materials");

  // Generate buffer instead of writing to file
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

