"use client";

import { useState, useMemo, useCallback } from "react";
import type { DesignConfig, ModuleCatalogItem } from "@/types/design";
import type { BOMSelections, LaborBreakdownItem } from "@/types/bom";
import {
  INSULATION_PRICES,
  INTERIOR_FINISH_PRICES,
  FLOORING_PRICES,
  EXTERIOR_FINISH_PRICES,
  InsulationType,
  InteriorWallFinish,
  FlooringType,
  ExteriorFinish,
} from "@/types/bom";
import { calculateBOM, getDesignAnalysis } from "@/lib/design/bom-calculator";
import { getZipLocationInfo } from "@/lib/design/zip-distance";
import { formatCurrencyCents } from "@/lib/format";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import XLSX from "xlsx-js-style";

export type BOMPanelProps = {
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  selections: BOMSelections;
  onSelectionsChange: (selections: BOMSelections) => void;
  designName: string;
  onSubmitProposal?: () => void;
  onExportPDF?: () => void;
  isSubmitting?: boolean;
  isExportingPDF?: boolean;
};

type CollapsibleSectionProps = {
  title: string;
  amount: number;
  details?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
};

function CollapsibleSection({
  title,
  amount,
  details,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>
        <span className="text-sm font-semibold text-amber-400">
          {formatCurrencyCents(amount)}
        </span>
      </button>
      {details && !isOpen && (
        <p className="px-3 pb-2 text-xs text-gray-500 -mt-1 ml-5">{details}</p>
      )}
      {isOpen && children && (
        <div className="px-3 pb-3 space-y-2">
          {details && (
            <p className="text-xs text-gray-400">{details}</p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function LaborBreakdownTable({ breakdown, totalHours }: { breakdown: LaborBreakdownItem[]; totalHours: number }) {
  return (
    <div className="mt-2 rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-700/50 bg-gray-800">
            <th className="px-2 py-1.5 text-left font-medium text-gray-400">Task</th>
            <th className="px-2 py-1.5 text-right font-medium text-gray-400">Hours</th>
          </tr>
        </thead>
        <tbody>
          {breakdown.map((item) => (
            <tr key={item.category} className="border-b border-gray-700/30 last:border-0">
              <td className="px-2 py-1.5 text-gray-300">
                {item.label}
                {item.description && (
                  <span className="text-gray-500 ml-1">({item.description})</span>
                )}
              </td>
              <td className="px-2 py-1.5 text-right text-gray-200 font-mono">
                {item.hours.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-800 border-t border-gray-600">
            <td className="px-2 py-1.5 font-semibold text-gray-200">Total</td>
            <td className="px-2 py-1.5 text-right font-bold text-amber-400 font-mono">
              {totalHours.toFixed(1)} hrs
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function BOMPanel({ 
  design, 
  catalog, 
  selections, 
  onSelectionsChange,
  designName,
  onSubmitProposal,
  onExportPDF,
  isSubmitting = false,
  isExportingPDF = false,
}: BOMPanelProps) {
  const [showLaborBreakdown, setShowLaborBreakdown] = useState(false);

  const updateSelection = useCallback(<K extends keyof BOMSelections>(
    key: K,
    value: BOMSelections[K]
  ) => {
    onSelectionsChange({ ...selections, [key]: value });
  }, [selections, onSelectionsChange]);

  const analysis = useMemo(
    () => getDesignAnalysis(design, catalog),
    [design, catalog]
  );

  const bom = useMemo(
    () => calculateBOM(design, catalog, selections),
    [design, catalog, selections]
  );

  // Export BOM to Excel with styling
  const handleExportExcel = useCallback(() => {
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

    // Build the data array for Excel
    const data: (string | number)[][] = [];
    
    // Title row (row 0)
    data.push([`Bill of Materials - ${designName}`]);
    data.push([]); // Empty row for spacing (row 1)
    
    // Header row (row 2)
    data.push(["Category", "Description", "Cost"]);
    
    // Main cost items (rows 3-12)
    data.push(["Container Shell", bom.container.details || "", `$${(bom.container.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Fixtures & Appliances", bom.fixtures.details || "", `$${(bom.fixtures.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Walls & Insulation", bom.wallsInsulation.details || "", `$${(bom.wallsInsulation.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Flooring", bom.flooring.details || "", `$${(bom.flooring.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Electrical", bom.electrical.details || "", `$${(bom.electrical.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Plumbing", bom.plumbing.details || "", `$${(bom.plumbing.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Exterior Finish", bom.exteriorFinish.details || "", `$${(bom.exteriorFinish.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Roofing", bom.roofing.details || "", `$${(bom.roofing.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Labor", `${bom.labor.totalHours} hours @ $${(selections.laborRateCents / 100).toFixed(2)}/hr`, `$${(bom.labor.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Delivery", bom.delivery.details || "", `$${(bom.delivery.costCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    
    // Empty row before totals (row 13)
    data.push([]);
    
    // Totals section (rows 14-16)
    const subtotalRow = data.length;
    data.push(["Subtotal", "", `$${(bom.subtotalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    data.push(["Contingency (10%)", "", `$${(bom.contingencyCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    const grandTotalRow = data.length;
    data.push(["GRAND TOTAL", "", `$${(bom.grandTotalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`]);
    
    // Labor breakdown section
    let laborBreakdownHeaderRow = -1;
    let laborTotalRow = -1;
    if (bom.labor.breakdown.length > 0) {
      data.push([]);
      data.push([]);
      laborBreakdownHeaderRow = data.length;
      data.push(["Labor Breakdown", "Hours", "Notes"]);
      bom.labor.breakdown.forEach(item => {
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
    ws["A1"].s = titleStyle;
    
    // Header row (row 2, index 2)
    ["A3", "B3", "C3"].forEach(cell => {
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
    ["A", "B", "C"].forEach(col => {
      if (ws[`${col}${subtotalRowNum}`]) ws[`${col}${subtotalRowNum}`].s = subtotalStyle;
      if (ws[`${col}${subtotalRowNum + 1}`]) ws[`${col}${subtotalRowNum + 1}`].s = subtotalStyle;
    });
    
    // Grand total row
    const grandTotalRowNum = grandTotalRow + 1;
    ["A", "B", "C"].forEach(col => {
      if (ws[`${col}${grandTotalRowNum}`]) ws[`${col}${grandTotalRowNum}`].s = grandTotalStyle;
    });
    
    // Labor breakdown section styling
    if (laborBreakdownHeaderRow > 0) {
      const lbHeaderRowNum = laborBreakdownHeaderRow + 1;
      ["A", "B", "C"].forEach(col => {
        if (ws[`${col}${lbHeaderRowNum}`]) ws[`${col}${lbHeaderRowNum}`].s = laborHeaderStyle;
      });
      
      // Labor total row
      if (laborTotalRow > 0) {
        const lbTotalRowNum = laborTotalRow + 1;
        ["A", "B", "C"].forEach(col => {
          if (ws[`${col}${lbTotalRowNum}`]) ws[`${col}${lbTotalRowNum}`].s = { 
            font: { bold: true, sz: 10 }, 
            fill: { fgColor: { rgb: "F0F0F0" } },
            border: { top: { style: "thin", color: { rgb: "CCCCCC" } } },
          };
        });
      }
    }
    
    // Set column widths for better readability (wch = width in characters)
    ws["!cols"] = [
      { wch: 30 },  // Category - wide enough for labels
      { wch: 55 },  // Description - extra wide for details
      { wch: 18 },  // Cost
    ];
    
    // Set row heights
    ws["!rows"] = [
      { hpt: 28 },  // Title row - taller
    ];
    
    // Merge cells for title row
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Merge title across all columns
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Bill of Materials");
    
    // Generate and download file
    const filename = `${designName.replace(/[^a-z0-9]/gi, "_")}_BOM.xlsx`;
    XLSX.writeFile(wb, filename);
  }, [bom, designName, selections.laborRateCents]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 -m-4">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h2 className="text-base font-semibold text-white">Bill of Materials</h2>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {analysis.shellLengthFt}' × {analysis.shellWidthFt}' × {analysis.shellHeightFt}' container
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Container Shell */}
        <CollapsibleSection
          title="Container Shell"
          amount={bom.container.costCents}
          details={bom.container.details}
        />

        {/* Fixtures */}
        <CollapsibleSection
          title="Fixtures & Appliances"
          amount={bom.fixtures.costCents}
          details={bom.fixtures.details}
        />

        {/* Walls & Insulation */}
        <CollapsibleSection
          title="Walls & Insulation"
          amount={bom.wallsInsulation.costCents}
          details={bom.wallsInsulation.details}
          defaultOpen
        >
          <div className="space-y-2 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Insulation Type
              </label>
              <Select
                value={selections.insulation}
                onChange={(e) => updateSelection("insulation", e.target.value as InsulationType)}
                className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5"
              >
                {Object.entries(INSULATION_PRICES).map(([key, { label, centsPerSqft }]) => (
                  <option key={key} value={key}>
                    {label} (${(centsPerSqft / 100).toFixed(2)}/sqft)
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Interior Wall Finish
              </label>
              <Select
                value={selections.interiorFinish}
                onChange={(e) => updateSelection("interiorFinish", e.target.value as InteriorWallFinish)}
                className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5"
              >
                {Object.entries(INTERIOR_FINISH_PRICES).map(([key, { label, centsPerSqft }]) => (
                  <option key={key} value={key}>
                    {label} (${(centsPerSqft / 100).toFixed(2)}/sqft)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CollapsibleSection>

        {/* Flooring */}
        <CollapsibleSection
          title="Flooring"
          amount={bom.flooring.costCents}
          details={bom.flooring.details}
          defaultOpen
        >
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Flooring Type
            </label>
            <Select
              value={selections.flooring}
              onChange={(e) => updateSelection("flooring", e.target.value as FlooringType)}
              className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5"
            >
              {Object.entries(FLOORING_PRICES).map(([key, { label, centsPerSqft }]) => (
                <option key={key} value={key}>
                  {label} (${(centsPerSqft / 100).toFixed(2)}/sqft)
                </option>
              ))}
            </Select>
          </div>
        </CollapsibleSection>

        {/* Electrical */}
        <CollapsibleSection
          title="Electrical"
          amount={bom.electrical.costCents}
          details={bom.electrical.details}
        />

        {/* Plumbing */}
        <CollapsibleSection
          title="Plumbing"
          amount={bom.plumbing.costCents}
          details={bom.plumbing.details}
        />

        {/* Exterior Finish */}
        <CollapsibleSection
          title="Exterior Finish"
          amount={bom.exteriorFinish.costCents}
          details={bom.exteriorFinish.details}
          defaultOpen
        >
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Exterior Finish Type
            </label>
            <Select
              value={selections.exteriorFinish}
              onChange={(e) => updateSelection("exteriorFinish", e.target.value as ExteriorFinish)}
              className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5"
            >
              {Object.entries(EXTERIOR_FINISH_PRICES).map(([key, { label, centsPerSqft }]) => (
                <option key={key} value={key}>
                  {label} (${(centsPerSqft / 100).toFixed(2)}/sqft)
                </option>
              ))}
            </Select>
          </div>
        </CollapsibleSection>

        {/* Roofing */}
        <CollapsibleSection
          title="Roofing"
          amount={bom.roofing.costCents}
          details={bom.roofing.details}
          defaultOpen
        >
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selections.roofingDeckPrep}
                onChange={(e) => updateSelection("roofingDeckPrep", e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/30"
              />
              <span className="text-xs text-gray-300">Deck Prep (+$3.00/sqft)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selections.roofingSolarRails}
                onChange={(e) => updateSelection("roofingSolarRails", e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/30"
              />
              <span className="text-xs text-gray-300">Solar Mounting Rails (+$2.50/sqft)</span>
            </label>
          </div>
        </CollapsibleSection>

        {/* Labor */}
        <CollapsibleSection
          title="Labor"
          amount={bom.labor.costCents}
          details={bom.labor.details}
          defaultOpen
        >
          <div className="mt-2 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">Rate:</label>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">$</span>
                <Input
                  type="number"
                  value={selections.laborRateCents / 100}
                  onChange={(e) => updateSelection("laborRateCents", Math.round(parseFloat(e.target.value || "0") * 100))}
                  className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5 !pl-5 !pr-8 w-full"
                  min={0}
                  step={5}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">/hr</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowLaborBreakdown(!showLaborBreakdown)}
              className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showLaborBreakdown ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showLaborBreakdown ? "Hide" : "Show"} breakdown ({bom.labor.totalHours} hrs)
            </button>
            
            {showLaborBreakdown && (
              <LaborBreakdownTable
                breakdown={bom.labor.breakdown}
                totalHours={bom.labor.totalHours}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Delivery */}
        <CollapsibleSection
          title="Delivery"
          amount={bom.delivery.costCents}
          details={bom.delivery.details}
          defaultOpen
        >
          <div className="mt-2 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Delivery ZIP Code
              </label>
              <Input
                type="text"
                value={selections.deliveryZip}
                onChange={(e) => updateSelection("deliveryZip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="Enter 5-digit ZIP"
                className="!bg-gray-800 !text-gray-200 !border-gray-600 text-xs !py-1.5"
                maxLength={5}
              />
            </div>
            {selections.deliveryZip.length === 5 && (() => {
              const locationInfo = getZipLocationInfo(selections.deliveryZip);
              if (locationInfo) {
                return (
                  <div className="rounded-md bg-gray-800/50 border border-gray-700/50 px-2.5 py-2">
                    <p className="text-xs font-medium text-gray-200">
                      {locationInfo.city}, {locationInfo.state}
                    </p>
                    {locationInfo.county && (
                      <p className="text-xs text-gray-400">
                        {locationInfo.county}
                      </p>
                    )}
                  </div>
                );
              }
              return (
                <p className="text-xs text-red-400">ZIP code not found in database</p>
              );
            })()}
            {bom.delivery.distanceMiles !== null && (
              <p className="text-xs text-gray-400">
                Distance from Audubon, IA: <span className="text-amber-400 font-medium">{bom.delivery.distanceMiles} miles</span>
              </p>
            )}
            <p className="text-xs text-gray-500">
              Rate: $4.50/mile (min. $500)
            </p>
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer Totals */}
      <div className="border-t border-gray-600 bg-gray-800/80 px-4 py-3">
        <div className="flex justify-between items-center text-sm mb-1">
          <span className="text-gray-400">Subtotal</span>
          <span className="text-gray-200 font-medium">
            {formatCurrencyCents(bom.subtotalCents)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-400">Contingency (10%)</span>
          <span className="text-gray-200 font-medium">
            {formatCurrencyCents(bom.contingencyCents)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-600 mb-4">
          <span className="text-base font-semibold text-white">Estimated Total</span>
          <span className="text-lg font-bold text-amber-400">
            {formatCurrencyCents(bom.grandTotalCents)}
          </span>
        </div>

        {/* Export Buttons */}
        <div className="space-y-2">
          <button
            onClick={onSubmitProposal}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-gray-900 font-semibold text-sm rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit for Proposal"}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button
              onClick={onExportPDF}
              disabled={isExportingPDF}
              className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-gray-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {isExportingPDF ? "Generating..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

