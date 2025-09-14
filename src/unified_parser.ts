// Single Unified Parser - Handles ALL parsing, evaluation, and math in the entire application
// Replaces: engine/eval.ts, engine/unified-*, parser/*, parsing/*, ReportPad model parsing, etc.

import { normalizeForParser } from './lib/text/normalize';
import { defineVariable, resolveVariable, defineVariableInCell, getVariableDefiningCell, clearVariablesInCell } from './referencing/names';

// ============================================================================
// TYPES - Single unified type system
// ============================================================================

export type Token = 
  | { type: 'NUMBER'; value: number }
  | { type: 'UNIT'; value: string }
  | { type: 'IDENTIFIER'; value: string }
  | { type: 'CELL_REF'; value: string }
  | { type: 'RANGE'; value: string } // A1:B10
  | { type: 'OPERATOR'; value: '+' | '-' | '*' | '/' | '^' | '=' }
  | { type: 'LPAREN'; value?: undefined }
  | { type: 'RPAREN'; value?: undefined }
  | { type: 'COMMA'; value?: undefined };

export type Expr =
  | { kind: 'number'; value: number; unit?: string }
  | { kind: 'variable'; name: string }
  | { kind: 'cell'; ref: string }
  | { kind: 'range'; start: string; end: string }
  | { kind: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: Expr; right: Expr }
  | { kind: 'call'; func: string; args: Expr[] }
  | { kind: 'assign'; name: string; expr: Expr };

export type ParseResult = 
  | { kind: 'assignment'; name: string; expr: Expr }
  | { kind: 'expression'; expr: Expr }
  | { kind: 'text'; text: string };

export type Quantity = {
  value: number;
  unit?: string;
  valueSI: number;
  dims: { L: number; M: number; T: number; F: number };
  displayUnit?: string;
};

export type EvaluationContext = {
  getCell?: (ref: string) => string;
  setVariable?: (name: string, value: Quantity) => void;
  getVariable?: (name: string) => Quantity | undefined;
  grid?: string[][];
  cellKey?: string; // For cycle detection
  visiting?: Set<string>;
};

// ============================================================================
// UNIT SYSTEM - Consolidated from all scattered implementations
// ============================================================================

const UNIT_REGISTRY: Record<string, { dims: { L: number; M: number; T: number; F: number }; toSI: number; fromSI: number }> = {
  // Length
  in: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.0254, fromSI: 39.37007874 },
  ft: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.3048, fromSI: 3.280839895 },
  yd: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.9144, fromSI: 1.0936132983 },
  mm: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.001, fromSI: 1000 },
  cm: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.01, fromSI: 100 },
  m: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 1, fromSI: 1 },
  km: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 1000, fromSI: 0.001 },
  mil: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.0000254, fromSI: 39370.07874 },
  
  // Force
  N: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 1, fromSI: 1 },
  kN: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 1000, fromSI: 0.001 },
  lb: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 4.4482216153, fromSI: 0.2248089431 },
  lbs: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 4.4482216153, fromSI: 0.2248089431 },
  kip: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 4448.2216153, fromSI: 0.0002248089431 },
  kg: { dims: { L: 0, M: 1, T: 0, F: 0 }, toSI: 1, fromSI: 1 },
  
  // Pressure
  Pa: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 1, fromSI: 1 },
  kPa: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 1000, fromSI: 0.001 },
  MPa: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 1000000, fromSI: 0.000001 },
  GPa: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 1000000000, fromSI: 0.000000001 },
  psi: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 6894.75729, fromSI: 0.000145037738 },
  psf: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 47.8802589, fromSI: 0.0208854342 },
  ksi: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 6894757.29, fromSI: 0.000000145037738 },
  
  // Time
  s: { dims: { L: 0, M: 0, T: 1, F: 0 }, toSI: 1, fromSI: 1 },
  sec: { dims: { L: 0, M: 0, T: 1, F: 0 }, toSI: 1, fromSI: 1 },
  
  // Angle
  deg: { dims: { L: 0, M: 0, T: 0, F: 0 }, toSI: Math.PI / 180, fromSI: 180 / Math.PI },
  rad: { dims: { L: 0, M: 0, T: 0, F: 0 }, toSI: 1, fromSI: 1 },
};

function makeQuantity(value: number, unit?: string): Quantity {
  if (!unit || !UNIT_REGISTRY[unit]) {
    return { value, valueSI: value, dims: { L: 0, M: 0, T: 0, F: 0 }, displayUnit: unit };
  }
  
  const unitDef = UNIT_REGISTRY[unit];
  return {
    value,
    unit,
    valueSI: value * unitDef.toSI,
    dims: unitDef.dims,
    displayUnit: unit
  };
}

function dimsEqual(a: { L: number; M: number; T: number; F: number }, b: { L: number; M: number; T: number; F: number }): boolean {
  return a.L === b.L && a.M === b.M && a.T === b.T && a.F === b.F;
}

function combineDims(a: { L: number; M: number; T: number; F: number }, b: { L: number; M: number; T: number; F: number }, op: '*' | '/'): { L: number; M: number; T: number; F: number } {
  if (op === '*') {
    return { L: a.L + b.L, M: a.M + b.M, T: a.T + b.T, F: a.F + b.F };
  } else {
    return { L: a.L - b.L, M: a.M - b.M, T: a.T - b.T, F: a.F - b.F };
  }
}

// ============================================================================
// TOKENIZER - Handles all token types
// ============================================================================

function tokenize(input: string): Token[] {
  const normalized = normalizeForParser(input);
  const tokens: Token[] = [];
  let i = 0;
  
  while (i < normalized.length) {
    // Skip whitespace
    if (/\s/.test(normalized[i])) {
      i++;
      continue;
    }
    
    // Numbers
    if (/\d/.test(normalized[i])) {
      let numStr = '';
      while (i < normalized.length && /[\d\.]/.test(normalized[i])) {
        numStr += normalized[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
      continue;
    }
    
    // Cell ranges (A1:B10)
    const rangeMatch = normalized.slice(i).match(/^([A-Z]+\d+):([A-Z]+\d+)/);
    if (rangeMatch) {
      tokens.push({ type: 'RANGE', value: rangeMatch[0] });
      i += rangeMatch[0].length;
      continue;
    }
    
    // Cell references (A1, B2, etc.)
    const cellMatch = normalized.slice(i).match(/^[A-Z]+\d+/);
    if (cellMatch) {
      tokens.push({ type: 'CELL_REF', value: cellMatch[0] });
      i += cellMatch[0].length;
      continue;
    }
    
    // Identifiers/Variables/Units
    if (/[A-Za-z]/.test(normalized[i])) {
      let identifier = '';
      while (i < normalized.length && /[A-Za-z0-9_']/.test(normalized[i])) {
        identifier += normalized[i];
        i++;
      }
      
      // Check if it's a known unit
      if (UNIT_REGISTRY[identifier]) {
        tokens.push({ type: 'UNIT', value: identifier });
      } else {
        tokens.push({ type: 'IDENTIFIER', value: identifier });
      }
      continue;
    }
    
    // Operators and punctuation
    const char = normalized[i];
    if (['+', '-', '*', '/', '^', '='].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char as any });
      i++;
    } else if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
    } else if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
    } else if (char === ',') {
      tokens.push({ type: 'COMMA' });
      i++;
    } else {
      throw new Error(`Unexpected character: ${char}`);
    }
  }
  
  return tokens;
}

// ============================================================================
// PARSER - Recursive descent with proper precedence
// ============================================================================

export function parse(input: string): ParseResult {
  const tokens = tokenize(input);
  let pos = 0;
  
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const isAtEnd = () => pos >= tokens.length;
  
  // Check for assignment
  if (tokens.length >= 3 && 
      tokens[0].type === 'IDENTIFIER' && 
      tokens[1].type === 'OPERATOR' && 
      tokens[1].value === '=') {
    const name = consume().value as string;
    consume(); // =
    const expr = parseExpression();
    return { kind: 'assignment', name, expr };
  }
  
  // Try to parse as expression
  try {
    const expr = parseExpression();
    return { kind: 'expression', expr };
  } catch (error) {
    // Fallback to text
    return { kind: 'text', text: input };
  }
  
  function parseExpression(): Expr {
    return parseAddSub();
  }
  
  function parseAddSub(): Expr {
    let left = parseMulDiv();
    
    while (!isAtEnd() && peek().type === 'OPERATOR' && ['+', '-'].includes(peek().value as string)) {
      const op = consume().value as '+' | '-';
      const right = parseMulDiv();
      left = { kind: 'binary', op, left, right };
    }
    
    return left;
  }
  
  function parseMulDiv(): Expr {
    let left = parsePower();
    
    while (!isAtEnd() && peek().type === 'OPERATOR' && ['*', '/'].includes(peek().value as string)) {
      const op = consume().value as '*' | '/';
      const right = parsePower();
      left = { kind: 'binary', op, left, right };
    }
    
    return left;
  }
  
  function parsePower(): Expr {
    let left = parsePrimary();
    
    if (!isAtEnd() && peek().type === 'OPERATOR' && peek().value === '^') {
      consume(); // ^
      const right = parsePower(); // Right associative
      left = { kind: 'binary', op: '^', left, right };
    }
    
    return left;
  }
  
  function parsePrimary(): Expr {
    const token = peek();
    
    if (!token) {
      throw new Error('Unexpected end of expression');
    }
    
    // Parentheses
    if (token.type === 'LPAREN') {
      consume(); // (
      const expr = parseExpression();
      if (!peek() || peek().type !== 'RPAREN') {
        throw new Error('Expected closing parenthesis');
      }
      consume(); // )
      return expr;
    }
    
    // Numbers
    if (token.type === 'NUMBER') {
      const value = consume().value as number;
      
      // Check for unit after number
      const nextToken = peek();
      if (nextToken && nextToken.type === 'UNIT') {
        const unit = consume().value as string;
        return { kind: 'number', value, unit };
      }
      
      return { kind: 'number', value };
    }
    
    // Cell references
    if (token.type === 'CELL_REF') {
      const ref = consume().value as string;
      return { kind: 'cell', ref };
    }
    
    // Ranges
    if (token.type === 'RANGE') {
      const range = consume().value as string;
      const [start, end] = range.split(':');
      return { kind: 'range', start, end };
    }
    
    // Identifiers (variables or functions)
    if (token.type === 'IDENTIFIER') {
      const name = consume().value as string;
      
      // Check for function call
      if (peek() && peek().type === 'LPAREN') {
        consume(); // (
        const args: Expr[] = [];
        
        if (!peek() || peek().type !== 'RPAREN') {
          args.push(parseExpression());
          while (peek() && peek().type === 'COMMA') {
            consume(); // ,
            args.push(parseExpression());
          }
        }
        
        if (!peek() || peek().type !== 'RPAREN') {
          throw new Error('Expected closing parenthesis');
        }
        consume(); // )
        
        return { kind: 'call', func: name, args };
      }
      
      // Variable
      return { kind: 'variable', name };
    }
    
    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }
}

// ============================================================================
// EVALUATOR - Handles all evaluation contexts
// ============================================================================

export function evaluate(input: string, context: EvaluationContext = {}): Quantity {
  const parsed = parse(input);
  
  if (parsed.kind === 'assignment') {
    const value = evaluateExpr(parsed.expr, context);
    
    // Store variable
    if (context.setVariable) {
      context.setVariable(parsed.name, value);
    } else {
      defineVariable(parsed.name, value.value);
    }
    
    return value;
  } else if (parsed.kind === 'expression') {
    return evaluateExpr(parsed.expr, context);
  } else {
    throw new Error('Cannot evaluate text');
  }
}

function evaluateExpr(expr: Expr, context: EvaluationContext): Quantity {
  switch (expr.kind) {
    case 'number':
      return makeQuantity(expr.value, expr.unit);
      
    case 'variable': {
      // Try context first
      let varValue = context.getVariable?.(expr.name);
      if (varValue !== undefined) return varValue;
      
      // Try global store
      const globalValue = resolveVariable(expr.name);
      if (globalValue !== undefined) {
        return makeQuantity(globalValue);
      }
      
      // Try unit lookup (bare unit = 1 unit)
      if (UNIT_REGISTRY[expr.name]) {
        return makeQuantity(1, expr.name);
      }
      
      throw new Error(`Undefined variable: ${expr.name}`);
    }
    
    case 'cell': {
      if (!context.getCell) {
        throw new Error('Cell references not supported in this context');
      }
      
      const cellContent = context.getCell(expr.ref);
      if (!cellContent) {
        return makeQuantity(0);
      }
      
      // Parse cell content as number with optional unit
      const numMatch = cellContent.match(/^\s*(\d+(?:\.\d+)?)\s*([A-Za-z]+)?\s*$/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        const unit = numMatch[2];
        return makeQuantity(value, unit);
      }
      
      // Try to recursively evaluate cell content
      try {
        return evaluate(cellContent, context);
      } catch {
        const num = parseFloat(cellContent);
        if (isFinite(num)) {
          return makeQuantity(num);
        }
        throw new Error(`Invalid cell value: ${expr.ref}`);
      }
    }
    
    case 'binary': {
      const left = evaluateExpr(expr.left, context);
      const right = evaluateExpr(expr.right, context);
      
      switch (expr.op) {
        case '+':
        case '-': {
          if (!dimsEqual(left.dims, right.dims)) {
            throw new Error('Cannot add/subtract incompatible units');
          }
          const rightValue = expr.op === '+' ? right.valueSI : -right.valueSI;
          return {
            value: left.value + right.value * (expr.op === '+' ? 1 : -1),
            valueSI: left.valueSI + rightValue,
            dims: left.dims,
            unit: left.unit || right.unit,
            displayUnit: left.displayUnit || right.displayUnit
          };
        }
        
        case '*': {
          return {
            value: left.value * right.value,
            valueSI: left.valueSI * right.valueSI,
            dims: combineDims(left.dims, right.dims, '*'),
            unit: combineUnits('*', left.unit, right.unit),
            displayUnit: combineUnits('*', left.displayUnit, right.displayUnit)
          };
        }
        
        case '/': {
          if (right.value === 0) {
            throw new Error('Division by zero');
          }
          return {
            value: left.value / right.value,
            valueSI: left.valueSI / right.valueSI,
            dims: combineDims(left.dims, right.dims, '/'),
            unit: combineUnits('/', left.unit, right.unit),
            displayUnit: combineUnits('/', left.displayUnit, right.displayUnit)
          };
        }
        
        case '^': {
          if (!dimsEqual(right.dims, { L: 0, M: 0, T: 0, F: 0 })) {
            throw new Error('Exponent must be dimensionless');
          }
          const exp = right.valueSI;
          return {
            value: Math.pow(left.value, exp),
            valueSI: Math.pow(left.valueSI, exp),
            dims: {
              L: left.dims.L * exp,
              M: left.dims.M * exp,
              T: left.dims.T * exp,
              F: left.dims.F * exp
            },
            unit: left.unit ? `${left.unit}^${exp}` : undefined,
            displayUnit: left.displayUnit ? `${left.displayUnit}^${exp}` : undefined
          };
        }
        
        default:
          throw new Error(`Unknown operator: ${expr.op}`);
      }
    }
    
    case 'call': {
      if (expr.func.toUpperCase() === 'VLOOKUP') {
        // Implement VLOOKUP logic here if needed
        throw new Error('VLOOKUP not implemented in unified parser yet');
      }
      throw new Error(`Unknown function: ${expr.func}`);
    }
    
    case 'range':
      throw new Error('Ranges cannot be evaluated directly');
      
    default:
      throw new Error('Unknown expression type');
  }
}

function combineUnits(op: '*' | '/', left?: string, right?: string): string | undefined {
  if (!left && !right) return undefined;
  if (!left) return right;
  if (!right) return left;
  
  if (op === '*') {
    return `${left}·${right}`;
  } else {
    return `${left}/${right}`;
  }
}

// ============================================================================
// LEGACY COMPATIBILITY - For gradual migration
// ============================================================================

// A1 reference conversion
export function refToRC(ref: string): { r: number; c: number } | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  
  const col = match[1];
  const row = parseInt(match[2], 10) - 1;
  
  let c = 0;
  for (let i = 0; i < col.length; i++) {
    c = c * 26 + (col.charCodeAt(i) - 64);
  }
  c -= 1;
  
  return { r: row, c };
}

// Grid-based evaluation (for spreadsheet compatibility)
export function evaluateWithGrid(grid: string[][], input: string, cellKey?: string): number {
  const context: EvaluationContext = {
    getCell: (ref: string) => {
      const rc = refToRC(ref);
      if (!rc) throw new Error(`Invalid cell reference: ${ref}`);
      return grid[rc.r]?.[rc.c] ?? '';
    },
    grid,
    cellKey,
    visiting: new Set()
  };
  
  const result = evaluate(input, context);
  return result.valueSI;
}

// Format result for display
export function formatQuantity(quantity: Quantity): string {
  if (quantity.unit) {
    return `${quantity.value} ${quantity.unit}`;
  }
  return quantity.value.toString();
}

// Classification helper
export function classifyInput(input: string): 'assignment' | 'expression' | 'text' {
  try {
    const parsed = parse(input);
    return parsed.kind;
  } catch {
    return 'text';
  }
}

// Export main functions
export { parse as parseExpression };
export { evaluate as evaluateExpression };