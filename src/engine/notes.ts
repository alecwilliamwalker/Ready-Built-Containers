import { evaluate as evaluateUnified } from '../unified_parser';

export type Grid = string[][];

export function evaluate(grid: Grid, raw: string): number {
  const s = raw.trim();
  
  // Handle non-formula numbers directly  
  if (!s.startsWith("=")) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
    throw new Error("Not a formula/number");
  }
  
  // Strip leading '=' and delegate to unified parser
  const expr = s.slice(1);
  const context = {
    getCell: (ref: string) => {
      // Extract cell value from grid using A1 reference
      const match = ref.match(/^([A-Z]+)([1-9][0-9]*)$/);
      if (match) {
        const col = match[1];
        const row = parseInt(match[2], 10) - 1;
        let c = 0;
        for (let i = 0; i < col.length; i++) {
          c = c * 26 + (col.charCodeAt(i) - 64);
        }
        c -= 1;
        return grid[row]?.[c] ?? "0";
      }
      return "0";
    }
  };
  
  try {
    const result = evaluateUnified(expr, context);
    return result.valueSI; // Return numeric value for compatibility
  } catch (error) {
    throw new Error(`Evaluation error: ${error}`);
  }
}