"use client";

import { useState, useMemo } from "react";
import type { PriceSummary, ModuleCatalogItem } from "@/types/design";
import { formatCurrencyCents } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import XLSX from "xlsx-js-style";

export type BOMTableProps = {
  summary: PriceSummary;
  designName: string;
  catalog: Record<string, ModuleCatalogItem>;
};

type SortField = "label" | "category" | "quantity" | "price";
type SortDirection = "asc" | "desc";

export function BOMTable({ summary, designName, catalog }: BOMTableProps) {
  const [sortField, setSortField] = useState<SortField>("category");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedLines = useMemo(() => {
    const lines = [...summary.lines];
    lines.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "label":
          comparison = a.label.localeCompare(b.label);
          break;
        case "category": {
          const catA = catalog[a.catalogKey]?.category || "";
          const catB = catalog[b.catalogKey]?.category || "";
          comparison = catA.localeCompare(catB);
          break;
        }
        case "quantity":
          comparison = a.quantity - b.quantity;
          break;
        case "price":
          comparison = a.lineCents - b.lineCents;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return lines;
  }, [summary.lines, sortField, sortDirection, catalog]);

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, typeof sortedLines> = {};
    sortedLines.forEach((line) => {
      const category = catalog[line.catalogKey]?.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(line);
    });
    return groups;
  }, [sortedLines, catalog]);

  const handleExportExcel = () => {
    // Style definitions
    const titleStyle = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2D5016" } }, // Forest green
      alignment: { horizontal: "center", vertical: "center" },
    };
    const headerStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4A7C23" } }, // Lighter green
      alignment: { horizontal: "center" },
      border: {
        bottom: { style: "medium", color: { rgb: "2D5016" } },
      },
    };
    const categoryHeaderStyle = {
      font: { bold: true, sz: 10, color: { rgb: "333333" } },
      fill: { fgColor: { rgb: "E8F0E0" } }, // Light green tint
      border: {
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      },
    };
    const dataStyle = {
      font: { sz: 10 },
      alignment: { vertical: "center" },
      border: {
        bottom: { style: "thin", color: { rgb: "EEEEEE" } },
      },
    };
    const numberStyle = {
      ...dataStyle,
      alignment: { horizontal: "right", vertical: "center" },
    };
    const subtotalLabelStyle = {
      font: { bold: true, sz: 10 },
      fill: { fgColor: { rgb: "F5F5F5" } },
      alignment: { horizontal: "right" },
    };
    const subtotalValueStyle = {
      font: { bold: true, sz: 10 },
      fill: { fgColor: { rgb: "F5F5F5" } },
      alignment: { horizontal: "right" },
    };
    const grandTotalLabelStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "D4A845" } }, // Gold/amber
      alignment: { horizontal: "right" },
    };
    const grandTotalValueStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "D4A845" } }, // Gold/amber
      alignment: { horizontal: "right" },
    };

    // Build data rows with proper structure
    const data: (string | number)[][] = [];
    const categoryHeaderRows: number[] = [];
    
    // Title row (row 0)
    data.push([`Bill of Materials - ${designName}`]);
    data.push([]); // Empty row for spacing (row 1)
    
    // Header row (row 2)
    const headers = ["Item", "Category", "Quantity", "Unit Price", "Total"];
    data.push(headers);
    
    // Data rows grouped by category
    Object.entries(groupedByCategory).forEach(([category, lines]) => {
      // Category header row
      categoryHeaderRows.push(data.length);
      const categoryDisplay = category.replace("fixture-", "").replace(/-/g, " ").toUpperCase();
      data.push([categoryDisplay, "", "", "", ""]);
      
      // Line items
      lines.forEach((line) => {
        data.push([
          line.label,
          catalog[line.catalogKey]?.category.replace("fixture-", "") || "Other",
          line.quantity,
          formatCurrencyCents(line.lineCents / line.quantity),
          formatCurrencyCents(line.lineCents),
        ]);
      });
    });
    
    // Empty row before totals
    data.push([]);
    
    // Summary rows
    const taxEstimate = summary.subtotalCents * 0.08;
    const grandTotal = summary.subtotalCents + taxEstimate;
    const subtotalRow = data.length;
    data.push(["", "", "", "Subtotal:", formatCurrencyCents(summary.subtotalCents)]);
    data.push(["", "", "", "Tax (est. 8%):", formatCurrencyCents(taxEstimate)]);
    const grandTotalRow = data.length;
    data.push(["", "", "", "Grand Total:", formatCurrencyCents(grandTotal)]);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Apply styles to cells
    // Title row
    ws["A1"].s = titleStyle;
    
    // Header row (row 3 in Excel, index 2)
    ["A3", "B3", "C3", "D3", "E3"].forEach(cell => {
      if (ws[cell]) ws[cell].s = headerStyle;
    });
    
    // Category header rows
    categoryHeaderRows.forEach(rowIndex => {
      const rowNum = rowIndex + 1; // Excel is 1-indexed
      ["A", "B", "C", "D", "E"].forEach(col => {
        if (ws[`${col}${rowNum}`]) ws[`${col}${rowNum}`].s = categoryHeaderStyle;
      });
    });
    
    // Data rows - apply styles to all data cells
    for (let row = 4; row <= data.length; row++) {
      // Skip category header rows and summary rows
      if (categoryHeaderRows.includes(row - 1)) continue;
      if (row > subtotalRow) continue;
      
      if (ws[`A${row}`]) ws[`A${row}`].s = dataStyle;
      if (ws[`B${row}`]) ws[`B${row}`].s = dataStyle;
      if (ws[`C${row}`]) ws[`C${row}`].s = numberStyle;
      if (ws[`D${row}`]) ws[`D${row}`].s = numberStyle;
      if (ws[`E${row}`]) ws[`E${row}`].s = numberStyle;
    }
    
    // Subtotal rows
    const subtotalRowNum = subtotalRow + 1;
    if (ws[`D${subtotalRowNum}`]) ws[`D${subtotalRowNum}`].s = subtotalLabelStyle;
    if (ws[`E${subtotalRowNum}`]) ws[`E${subtotalRowNum}`].s = subtotalValueStyle;
    if (ws[`D${subtotalRowNum + 1}`]) ws[`D${subtotalRowNum + 1}`].s = subtotalLabelStyle;
    if (ws[`E${subtotalRowNum + 1}`]) ws[`E${subtotalRowNum + 1}`].s = subtotalValueStyle;
    
    // Grand total row
    const grandTotalRowNum = grandTotalRow + 1;
    ["A", "B", "C"].forEach(col => {
      if (ws[`${col}${grandTotalRowNum}`]) ws[`${col}${grandTotalRowNum}`].s = { fill: { fgColor: { rgb: "D4A845" } } };
    });
    if (ws[`D${grandTotalRowNum}`]) ws[`D${grandTotalRowNum}`].s = grandTotalLabelStyle;
    if (ws[`E${grandTotalRowNum}`]) ws[`E${grandTotalRowNum}`].s = grandTotalValueStyle;
    
    // Set column widths for better readability (wch = width in characters)
    ws["!cols"] = [
      { wch: 40 },  // Item - wide for long names
      { wch: 22 },  // Category
      { wch: 12 },  // Quantity
      { wch: 16 },  // Unit Price
      { wch: 16 },  // Total
    ];
    
    // Set row heights
    ws["!rows"] = [
      { hpt: 28 },  // Title row - taller
    ];
    
    // Merge cells for title row
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Merge title across all columns
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Bill of Materials");
    
    // Generate and download file
    const filename = `${designName.replace(/\s+/g, "_")}_BOM.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const taxEstimate = summary.subtotalCents * 0.08;
  const grandTotal = summary.subtotalCents + taxEstimate;

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <div className="flex items-center justify-between rounded-2xl border border-surface-muted/60 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-foreground/60">
          Export Bill of Materials
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" disabled>
            Export PDF (Coming Soon)
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-surface-muted/60 bg-white shadow-md">
        <table className="w-full">
          <thead className="border-b border-surface-muted/40 bg-surface">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("label")}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
                >
                  Item
                  {sortField === "label" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("category")}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
                >
                  Category
                  {sortField === "category" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </th>
              <th className="px-6 py-4 text-right">
                <button
                  onClick={() => handleSort("quantity")}
                  className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
                >
                  Qty
                  {sortField === "quantity" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
                  Unit Price
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <button
                  onClick={() => handleSort("price")}
                  className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60 hover:text-foreground"
                >
                  Total
                  {sortField === "price" && (sortDirection === "asc" ? " ↑" : " ↓")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedByCategory).map(([category, lines]) => (
              <>
                <tr key={`category-${category}`} className="border-t border-surface-muted/40 bg-surface/50">
                  <td colSpan={5} className="px-6 py-2 text-sm font-semibold text-foreground">
                    {category.replace("fixture-", "").replace(/-/g, " ").toUpperCase()}
                  </td>
                </tr>
                {lines.map((line) => (
                  <tr
                    key={line.fixtureId}
                    className="border-t border-surface-muted/20 hover:bg-surface/30"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-foreground">
                      {line.label}
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground/60">
                      {catalog[line.catalogKey]?.category.replace("fixture-", "")}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-foreground">
                      {line.quantity}
                    </td>
                    <td className="px-6 py-3 text-right text-sm text-foreground/60">
                      {formatCurrencyCents(line.lineCents / line.quantity)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                      {formatCurrencyCents(line.lineCents)}
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-surface-muted/60 bg-surface">
            <tr>
              <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-foreground/60">
                Subtotal
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                {formatCurrencyCents(summary.subtotalCents)}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="px-6 py-3 text-right text-sm font-semibold text-foreground/60">
                Tax (est. 8%)
              </td>
              <td className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                {formatCurrencyCents(taxEstimate)}
              </td>
            </tr>
            <tr className="border-t border-surface-muted/40">
              <td colSpan={4} className="px-6 py-4 text-right text-base font-bold text-foreground">
                Grand Total
              </td>
              <td className="px-6 py-4 text-right text-lg font-bold text-forest">
                {formatCurrencyCents(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}



