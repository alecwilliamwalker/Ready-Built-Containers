import { parse as parseUnified, evaluate as evaluateUnified, formatQuantity } from '../unified_parser';

export type StepDoc = {
  equationLaTeX?: string;
  inputs: Array<{ name: string; display: string; source?: string }>;
  substitutionLaTeX?: string;
  result?: { display: string; unit?: string };
  notes?: string[];
  // New: structured fraction info for nicer rendering without KaTeX
  fraction?: { numerator: string; denominator: string };
  substitutionFraction?: { numerator: string; denominator: string };
  numericResult?: number;
};

export function build(expr: string, ctx: { getCellDisplay: (r: number, c: number) => string; resolveName?: (name: string) => string | undefined }): StepDoc {
  // Use unified parser exclusively - no more duplicate parsing logic
  const parsed = parseUnified(expr);
  
  // Extract cell references from expression using unified parser approach
  const cellMatches = expr.match(/\b([A-Z]+)([1-9][0-9]*)\b/g) || [];
  const refs: Array<{ label: string; r: number; c: number }> = [];
  
  for (const cellRef of cellMatches) {
    const match = cellRef.match(/^([A-Z]+)([1-9][0-9]*)$/);
    if (match) {
      const col = match[1];
      const row = parseInt(match[2], 10) - 1;
      let c = 0;
      for (let i = 0; i < col.length; i++) {
        c = c * 26 + (col.charCodeAt(i) - 64);
      }
      c -= 1;
      refs.push({ label: cellRef, r: row, c });
    }
  }
  
  const inputs = refs.map((r) => ({ name: r.label, display: ctx.getCellDisplay(r.r, r.c), source: r.label }));

  // Try to evaluate using unified parser
  try {
    const context = {
      getCell: (ref: string) => {
        const cellMatch = ref.match(/^([A-Z]+)([1-9][0-9]*)$/);
        if (cellMatch) {
          const col = cellMatch[1];
          const row = parseInt(cellMatch[2], 10) - 1;
          let c = 0;
          for (let i = 0; i < col.length; i++) {
            c = c * 26 + (col.charCodeAt(i) - 64);
          }
          c -= 1;
          return ctx.getCellDisplay(row, c);
        }
        return "0";
      },
      getVariable: ctx.resolveName ? (name: string) => {
        const val = ctx.resolveName!(name);
        if (val && !isNaN(parseFloat(val))) {
          return { value: parseFloat(val), valueSI: parseFloat(val), dims: { L: 0, M: 0, T: 0, F: 0 } };
        }
        return undefined;
      } : undefined
    };
    
    const result = evaluateUnified(expr, context);
    const resultDisplay = formatQuantity(result);
    
    // Check if this looks like a simple fraction for LaTeX rendering
    const fractionMatch = expr.match(/^\s*([A-Za-z][A-Za-z0-9_]*|[A-Z]+[1-9][0-9]*|\d+(?:\.\d+)?)\s*\/\s*([A-Za-z][A-Za-z0-9_]*|[A-Z]+[1-9][0-9]*|\d+(?:\.\d+)?)\s*$/);
    if (fractionMatch) {
      const left = fractionMatch[1];
      const right = fractionMatch[2];
      
      // Get substituted values for display
      const leftDisplay = refs.find(r => r.label === left) ? ctx.getCellDisplay(refs.find(r => r.label === left)!.r, refs.find(r => r.label === left)!.c) : left;
      const rightDisplay = refs.find(r => r.label === right) ? ctx.getCellDisplay(refs.find(r => r.label === right)!.r, refs.find(r => r.label === right)!.c) : right;
      
      return {
        equationLaTeX: `\\frac{${left}}{${right}}`,
        substitutionLaTeX: `\\frac{${leftDisplay}}{${rightDisplay}}`,
        inputs,
        fraction: { numerator: left, denominator: right },
        substitutionFraction: { numerator: leftDisplay, denominator: rightDisplay },
        numericResult: result.value,
        result: { display: resultDisplay, unit: result.unit },
      };
    }
    
    return {
      equationLaTeX: expr,
      inputs,
      substitutionLaTeX: expr,
      result: { display: resultDisplay, unit: result.unit },
      numericResult: result.value,
    };
  } catch (error) {
    // Fallback for cases where unified evaluation fails
    return {
      equationLaTeX: expr,
      inputs,
      substitutionLaTeX: expr,
      result: { display: "Error in evaluation" },
    };
  }
}