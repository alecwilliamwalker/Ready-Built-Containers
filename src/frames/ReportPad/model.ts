// ReportPad Model - Now using unified parser instead of scattered parsing logic
import { parse as parseUnified, evaluate as evaluateUnified, classifyInput, formatQuantity } from "../../unified_parser";
import { normalizeForParser } from "../../lib/text/normalize";

export type LineKind = "def" | "expr" | "text";

export type Quantity = {
  valueSI: number; // SI base value
  dims: { L: number; M: number; T: number; F: number };
  displayUnit?: string; // preferred display
};

export type Line = {
  id: string;
  text: string;
  kind: LineKind;
  result?: Quantity;
  error?: string;
};

export type Doc = {
  lines: Line[];
};

// Convert unified parser Quantity to ReportPad Quantity format
function convertQuantity(unifiedQty: { value: number; valueSI: number; dims: { L: number; M: number; T: number; F: number }; displayUnit?: string }): Quantity {
  return {
    valueSI: unifiedQty.valueSI,
    dims: unifiedQty.dims,
    displayUnit: unifiedQty.displayUnit
  };
}

// Utility function for backward compatibility
function trimTrailingEquals(text: string): string {
  return text.replace(/\s*=\s*$/, '');
}

// Check if text looks like a definition (assignment)
function isDefinition(text: string): boolean {
  const normalized = normalizeForParser(text);
  try {
    const parsed = parseUnified(normalized);
    return parsed.kind === 'assignment';
  } catch {
    return false;
  }
}

export function classifyLine(text: string): LineKind {
  try {
    return classifyInput(text) as LineKind;
  } catch {
    return "text";
  }
}

// In-memory namespace for variable storage during document evaluation
type Namespace = Map<string, Quantity>;

export function recompute(doc: Doc, getCellDisplay: (r: number, c: number) => string, a1ToRC: (a1: string) => { r: number; c: number } | null): Doc {
  const ns: Namespace = new Map();
  const nextLines: Line[] = [];
  
  for (const line of doc.lines) {
    const normalizedText = normalizeForParser(line.text);
    const kind = classifyLine(normalizedText);
    let result: Quantity | undefined;
    let error: string | undefined;
    
    if (kind === "def" || isDefinition(normalizedText)) {
      // Handle variable definitions  
      try {
        const parsed = parseUnified(normalizedText);
        if (parsed.kind === 'assignment') {
          // Create evaluation context
          const context = {
            getCell: (ref: string) => {
              const rc = a1ToRC(ref);
              if (!rc) return '';
              return getCellDisplay(rc.r, rc.c);
            },
            setVariable: (name: string, value: any) => {
              ns.set(name.toUpperCase(), convertQuantity(value));
            },
            getVariable: (name: string) => {
              const qty = ns.get(name.toUpperCase());
              if (qty) {
                return {
                  value: qty.valueSI,
                  valueSI: qty.valueSI, 
                  dims: qty.dims,
                  displayUnit: qty.displayUnit
                };
              }
              return undefined;
            }
          };
          
          const unifiedResult = evaluateUnified(normalizedText, context);
          result = convertQuantity(unifiedResult);
        }
      } catch (e: any) {
        error = e?.message ?? String(e);
      }
    } else if (kind === "expr") {
      // Handle expressions
      try {
        const context = {
          getCell: (ref: string) => {
            const rc = a1ToRC(ref);
            if (!rc) return '';
            return getCellDisplay(rc.r, rc.c);
          },
          getVariable: (name: string) => {
            const qty = ns.get(name.toUpperCase());
            if (qty) {
              return {
                value: qty.valueSI,
                valueSI: qty.valueSI,
                dims: qty.dims,
                displayUnit: qty.displayUnit
              };
            }
            return undefined;
          }
        };
        
        const unifiedResult = evaluateUnified(trimTrailingEquals(normalizedText), context);
        result = convertQuantity(unifiedResult);
      } catch (e: any) {
        error = e?.message ?? String(e);
      }
    }
    
    nextLines.push({ ...line, kind, result, error });
  }
  
  return { lines: nextLines };
}

// Create quantity from value and unit (backward compatibility)
export function makeQuantity(value: number, unit?: string): Quantity {
  try {
    const unifiedQty = { value, unit, valueSI: value, dims: { L: 0, M: 0, T: 0, F: 0 } };
    if (unit) {
      // Let unified parser handle unit conversion
      const testResult = evaluateUnified(`1 ${unit}`);
      unifiedQty.valueSI = value * testResult.valueSI;
      unifiedQty.dims = testResult.dims;
    }
    return convertQuantity(unifiedQty);
  } catch {
    return { valueSI: value, dims: { L: 0, M: 0, T: 0, F: 0 }, displayUnit: unit };
  }
}

// Convert quantity for display (backward compatibility)
export function convertDisplay(q: Quantity, toUnit?: string): { value: number; unit?: string } {
  if (!toUnit && q.displayUnit) {
    // Try to convert back to display unit
    try {
      const testResult = evaluateUnified(`1 ${q.displayUnit}`);
      const factor = testResult.valueSI;
      return { value: q.valueSI / factor, unit: q.displayUnit };
    } catch {
      return { value: q.valueSI, unit: q.displayUnit };
    }
  }
  
  if (toUnit) {
    try {
      const testResult = evaluateUnified(`1 ${toUnit}`);
      const factor = testResult.valueSI;
      return { value: q.valueSI / factor, unit: toUnit };
    } catch {
      throw new Error(`Unknown unit: ${toUnit}`);
    }
  }
  
  return { value: q.valueSI, unit: q.displayUnit };
}

// For backward compatibility - export the classification function that was used
export { classifyInput as classifyBasic } from "../../unified_parser";