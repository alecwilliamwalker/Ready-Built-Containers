import { evaluate as evaluateUnified } from '../unified_parser';
import { parseAddress } from '../referencing/a1';

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
      // Use centralized A1 parsing - no more duplicate logic!
      const address = parseAddress(ref);
      if (address) {
        return grid[address.r]?.[address.c] ?? "0";
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