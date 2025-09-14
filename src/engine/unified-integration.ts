// Integration layer to connect unified system to existing components
// Provides backward compatibility while migrating to unified architecture

import { evaluate, formatQuantity, type Quantity, type EvaluationContext } from './unified-evaluator';
import { parseExpression, isFormula } from './unified-parser';

// Wrapper function that matches the existing ReportPad interface
export function evaluateExpression(input: string, context?: any): { value: number; unit?: string } {
  try {
    // Handle the normalized input that might have LaTeX symbols
    const normalized = input.replace(/\\cdot/g, '*').replace(/\\div/g, '/');
    
    const result = evaluate(normalized, context);
    return {
      value: result.value,
      unit: result.unit
    };
  } catch (error) {
    throw new Error(`Expression evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Wrapper function for checking if something is a formula
export function isExpressionFormula(input: string): boolean {
  const normalized = input.replace(/\\cdot/g, '*').replace(/\\div/g, '/');
  return isFormula(normalized);
}

// Wrapper function for parsing expressions
export function parseExpressionSafe(input: string) {
  try {
    const normalized = input.replace(/\\cdot/g, '*').replace(/\\div/g, '/');
    return parseExpression(normalized);
  } catch (error) {
    throw new Error(`Parse error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Format function that matches existing interface
export function formatResult(quantity: Quantity): string {
  return formatQuantity(quantity);
}

// Legacy interface adapter for spreadsheet compatibility
export function evalWithCellContext(formula: string, getCellValue: (ref: string) => string): number {
  const context: EvaluationContext = {
    getCell: getCellValue
  };
  
  try {
    const result = evaluate(formula, context);
    return result.value;
  } catch (error) {
    throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}