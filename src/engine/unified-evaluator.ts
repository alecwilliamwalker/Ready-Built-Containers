// Unified evaluator that works for both spreadsheet and report canvas
// Handles variables, cell references, units, and all operations in one place

import { parseExpression, Expr, ParseResult } from './unified-parser';
import { defineVariable, resolveVariable, clearVariables } from '../referencing/names';

// Unit system - consolidated from multiple scattered implementations
const UNIT_REGISTRY = {
  // Length
  in: { toSI: 0.0254, dims: { L: 1, M: 0, T: 0, F: 0 } },
  ft: { toSI: 0.3048, dims: { L: 1, M: 0, T: 0, F: 0 } },
  mm: { toSI: 0.001, dims: { L: 1, M: 0, T: 0, F: 0 } },
  m: { toSI: 1, dims: { L: 1, M: 0, T: 0, F: 0 } },
  
  // Force
  lb: { toSI: 4.4482216153, dims: { L: 0, M: 0, T: 0, F: 1 } },
  N: { toSI: 1, dims: { L: 0, M: 0, T: 0, F: 1 } },
  kN: { toSI: 1000, dims: { L: 0, M: 0, T: 0, F: 1 } },
  
  // Pressure  
  Pa: { toSI: 1, dims: { L: -2, M: 0, T: 0, F: 1 } },
  kPa: { toSI: 1000, dims: { L: -2, M: 0, T: 0, F: 1 } },
  psi: { toSI: 6894.75729, dims: { L: -2, M: 0, T: 0, F: 1 } },
} as const;

export type Quantity = {
  value: number;
  unit?: string;
  valueSI?: number;
  dims?: { L: number; M: number; T: number; F: number };
};

export type EvaluationContext = {
  getCell?: (ref: string) => string;
  setVariable?: (name: string, value: Quantity) => void;
  getVariable?: (name: string) => Quantity | undefined;
};

// Convert value to SI units
function toSI(quantity: Quantity): Quantity {
  if (!quantity.unit || !(quantity.unit in UNIT_REGISTRY)) {
    return { ...quantity, valueSI: quantity.value, dims: { L: 0, M: 0, T: 0, F: 0 } };
  }
  
  const unitDef = UNIT_REGISTRY[quantity.unit as keyof typeof UNIT_REGISTRY];
  return {
    ...quantity,
    valueSI: quantity.value * unitDef.toSI,
    dims: unitDef.dims
  };
}

// Check if two quantities have compatible units
function unitsCompatible(a: Quantity, b: Quantity): boolean {
  if (!a.dims || !b.dims) return true; // Assume compatible if no dims
  return (
    a.dims.L === b.dims.L &&
    a.dims.M === b.dims.M &&
    a.dims.T === b.dims.T &&
    a.dims.F === b.dims.F
  );
}

// Main evaluation function
export function evaluate(input: string, context: EvaluationContext = {}): Quantity {
  try {
    const parsed = parseExpression(input);
    
    if (parsed.kind === "assignment") {
      // Handle variable assignment
      const value = evaluateExpr(parsed.expr, context);
      
      // Store the variable
      if (context.setVariable) {
        context.setVariable(parsed.name, value);
      } else {
        defineVariable(parsed.name, value.value); // Fallback to global store
      }
      
      return value;
    } else {
      // Handle expression evaluation
      return evaluateExpr(parsed.expr, context);
    }
  } catch (error) {
    throw new Error(`Evaluation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Evaluate an expression AST
function evaluateExpr(expr: Expr, context: EvaluationContext): Quantity {
  switch (expr.kind) {
    case "number":
      const qty = { value: expr.value, unit: expr.unit };
      return toSI(qty);
      
    case "variable":
      // Try context first, then global store
      let varValue = context.getVariable?.(expr.name);
      if (varValue === undefined) {
        const globalValue = resolveVariable(expr.name);
        if (globalValue !== undefined) {
          varValue = { value: globalValue };
        }
      }
      
      if (varValue === undefined) {
        throw new Error(`Undefined variable: ${expr.name}`);
      }
      
      return toSI(varValue);
      
    case "cell":
      if (!context.getCell) {
        throw new Error(`Cell references not supported in this context`);
      }
      
      const cellContent = context.getCell(expr.ref);
      if (!cellContent) {
        return { value: 0, valueSI: 0, dims: { L: 0, M: 0, T: 0, F: 0 } };
      }
      
      // Recursively evaluate cell content
      return evaluate(cellContent, context);
      
    case "binary":
      const left = evaluateExpr(expr.left, context);
      const right = evaluateExpr(expr.right, context);
      
      switch (expr.op) {
        case "+":
          if (!unitsCompatible(left, right)) {
            throw new Error(`Cannot add incompatible units`);
          }
          return {
            value: left.value + right.value,
            unit: left.unit || right.unit,
            valueSI: (left.valueSI || left.value) + (right.valueSI || right.value),
            dims: left.dims || right.dims
          };
          
        case "-":
          if (!unitsCompatible(left, right)) {
            throw new Error(`Cannot subtract incompatible units`);
          }
          return {
            value: left.value - right.value,
            unit: left.unit || right.unit,
            valueSI: (left.valueSI || left.value) - (right.valueSI || right.value),
            dims: left.dims || right.dims
          };
          
        case "*":
          return {
            value: left.value * right.value,
            unit: combineUnits("*", left.unit, right.unit),
            valueSI: (left.valueSI || left.value) * (right.valueSI || right.value),
            dims: combineDims("*", left.dims, right.dims)
          };
          
        case "/":
          if (right.value === 0) {
            throw new Error("Division by zero");
          }
          return {
            value: left.value / right.value,
            unit: combineUnits("/", left.unit, right.unit),
            valueSI: (left.valueSI || left.value) / (right.valueSI || right.value),
            dims: combineDims("/", left.dims, right.dims)
          };
          
        default:
          throw new Error(`Unknown operator: ${expr.op}`);
      }
      
    case "assign":
      // This should be handled at the statement level
      throw new Error("Assignment expressions should be handled at statement level");
      
    default:
      throw new Error(`Unknown expression type`);
  }
}

// Simple unit combination for display
function combineUnits(op: "*" | "/", left?: string, right?: string): string | undefined {
  if (!left && !right) return undefined;
  if (!left) return right;
  if (!right) return left;
  
  if (op === "*") {
    return `${left}·${right}`;
  } else {
    return `${left}/${right}`;
  }
}

// Combine dimensional analysis
function combineDims(
  op: "*" | "/",
  left?: { L: number; M: number; T: number; F: number },
  right?: { L: number; M: number; T: number; F: number }
): { L: number; M: number; T: number; F: number } {
  const leftDims = left || { L: 0, M: 0, T: 0, F: 0 };
  const rightDims = right || { L: 0, M: 0, T: 0, F: 0 };
  
  if (op === "*") {
    return {
      L: leftDims.L + rightDims.L,
      M: leftDims.M + rightDims.M,
      T: leftDims.T + rightDims.T,
      F: leftDims.F + rightDims.F
    };
  } else {
    return {
      L: leftDims.L - rightDims.L,
      M: leftDims.M - rightDims.M,
      T: leftDims.T - rightDims.T,
      F: leftDims.F - rightDims.F
    };
  }
}

// Format result for display
export function formatQuantity(quantity: Quantity): string {
  if (quantity.unit) {
    return `${quantity.value} ${quantity.unit}`;
  }
  return quantity.value.toString();
}