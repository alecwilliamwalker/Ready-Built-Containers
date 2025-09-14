import { defineName, resolveName, defineVariable, resolveVariable, hasVariable, defineVariableInCell, getVariableDefiningCell, clearVariablesInCell } from '../referencing/names';
import { indexToCol } from '../referencing/a1';

export type Grid = string[][];

const colToIndex = (col: string) =>
  col.toUpperCase().split("").reduce((n, ch) => n * 26 + (ch.charCodeAt(0) - 64), 0) - 1;

export function refToRC(ref: string): { r: number; c: number } | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref.trim());
  if (!m) return null;
  const c = colToIndex(m[1]);
  const r = parseInt(m[2], 10) - 1;
  if (r < 0 || c < 0) return null;
  return { r, c };
}

function getCellValue(grid: Grid, ref: string, visiting: Set<string>): number {
  const rc = refToRC(ref);
  if (!rc) throw new Error(`Bad ref: ${ref}`);
  const key = `${rc.r}:${rc.c}`;
  if (visiting.has(key)) throw new Error('#CYCLE!');
  visiting.add(key);
  try {
    const raw = grid[rc.r]?.[rc.c] ?? "";
    return evaluateWithVisited(grid, raw, visiting, key);
  } finally {
    visiting.delete(key);
  }
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  const re = /\s*([A-Za-z]+\d+|[A-Za-z]+|\d+(?:\.\d+)?(?:\s*[A-Za-z]+)?|\+|\-|\*|\/|\(|\)|=)\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) {
    const token = m[1].trim();
    if (token) tokens.push(token);
  }
  return tokens;
}

function isNamedVariable(token: string): boolean {
  // Check if it's a named variable (not A1 reference, not number, not operator)
  return /^[A-Za-z]+$/.test(token) && !isUnit(token);
}

function isUnit(token: string): boolean {
  // Common engineering units
  const units = ['ft', 'in', 'mm', 'm', 'cm', 'lb', 'lbs', 'kg', 'N', 'kN', 'psi', 'ksi', 'Pa', 'kPa', 'MPa', 's', 'sec'];
  return units.includes(token.toLowerCase());
}

function getVariableValue(name: string, grid: Grid, visiting: Set<string>): number {
  // Check if there's a cell that defines this variable
  const definingCellKey = getVariableDefiningCell(name);
  if (definingCellKey) {
    // Parse cell key back to row/col and get fresh value from that cell
    const [rStr, cStr] = definingCellKey.split(':');
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    const raw = grid[r]?.[c] ?? "";
    
    // Evaluate the defining cell to get the current variable value - this will trigger re-evaluation
    const cellKey = `${r}:${c}`;
    if (visiting.has(cellKey)) {
      throw new Error('#CYCLE!');
    }
    
    // Don't add cellKey to visiting here - let getCellValue handle it
    return getCellValue(grid, `${indexToCol(c)}${r + 1}`, visiting);
  }
  
  // Fallback: check if it's a stored variable (for backwards compatibility)  
  const value = resolveVariable(name);
  if (value !== undefined) {
    return value;
  }
  
  // Check if it's a named cell/block reference
  const target = resolveName(name);
  if (target) {
    if (target.kind === "cell") {
      return getCellValue(grid, target.ref, visiting);
    }
    // For now, return 0 for block references - could be enhanced later
    return 0;
  }
  
  throw new Error(`Undefined variable: ${name}`);
}

function toRpn(tokens: string[]): string[] {
  const out: string[] = [];
  const op: string[] = [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  for (const t of tokens) {
    if (/^\d/.test(t) || /^[A-Za-z]+\d+$/.test(t) || isNamedVariable(t)) {
      out.push(t);
    }
    else if (t in prec) {
      while (op.length && prec[op[op.length - 1]] >= prec[t]) out.push(op.pop()!);
      op.push(t);
    } else if (t === "(") op.push(t);
    else if (t === ")") {
      while (op.length && op[op.length - 1] !== "(") out.push(op.pop()!);
      op.pop();
    } else throw new Error(`Bad token: ${t}`);
  }
  while (op.length) out.push(op.pop()!);
  return out;
}

function evalRpn(grid: Grid, rpn: string[], visiting: Set<string>): number {
  const st: number[] = [];
  for (const t of rpn) {
    if (/^\d/.test(t)) st.push(parseFloat(t));
    else if (/^[A-Za-z]+\d+$/.test(t)) st.push(getCellValue(grid, t, visiting));
    else if (isNamedVariable(t)) st.push(getVariableValue(t, grid, visiting));
    else {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Malformed expression");
      st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
    }
  }
  if (st.length !== 1) throw new Error("Malformed expression");
  return st[0];
}

function evaluateWithVisited(grid: Grid, raw: string, visiting: Set<string>, currentCellKey?: string): number {
  const s = raw.trim();
  
  // Handle formulas (start with =)
  if (s.startsWith("=")) {
    const tokens = tokenize(s.slice(1));
    return evalRpn(grid, toRpn(tokens), visiting);
  }
  
  // Handle variable assignments (e.g., "L = 5 ft", "Area = L * W")
  const assignMatch = s.match(/^([A-Za-z]+)\s*=\s*(.+)$/);
  if (assignMatch) {
    const varName = assignMatch[1];
    const valueStr = assignMatch[2].trim();
    
    // Add cycle detection for variable assignments
    const varKey = `var:${varName}`;
    if (visiting.has(varKey)) {
      throw new Error('#CYCLE!');
    }
    visiting.add(varKey);
    
    try {
      let exprValue: number;
      
      // Parse the value (could be number with units or expression)
      const numMatch = valueStr.match(/^([\d.]+)(?:\s*([A-Za-z]+))?$/);
      if (numMatch) {
        exprValue = parseFloat(numMatch[1]);
      } else {
        // The value is an expression - evaluate it as an expression (not as a formula)
        // This handles cases like "Area = L * W" without requiring "Area = =L * W"
        const tokens = tokenize(valueStr);
        exprValue = evalRpn(grid, toRpn(tokens), visiting);
      }
      
      // Store the variable value with cell tracking
      if (currentCellKey) {
        defineVariableInCell(varName, exprValue, currentCellKey);
      } else {
        // Fallback for cases without cell context
        defineVariable(varName, exprValue);
      }
      
      return exprValue;
    } catch (error) {
      throw new Error(`Invalid assignment value for ${varName}: ${valueStr} - ${error.message}`);
    } finally {
      visiting.delete(varKey);
    }
  }
  
  // Handle plain numbers
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  
  throw new Error("Not a formula/number/assignment");
}

// Enhanced evaluate that can track which cell is being evaluated
export function evaluateCell(grid: Grid, raw: string, row: number, col: number): number {
  const cellKey = `${row}:${col}`;
  const result = evaluateWithVisited(grid, raw, new Set(), cellKey);
  return result;
}

// Legacy function for backwards compatibility
export function evaluate(grid: Grid, raw: string): number {
  return evaluateWithVisited(grid, raw, new Set());
}

// New: evaluate an expression string against a callback
export function evaluateExpr(expr: string, getCell: (ref: string) => string): number {
  const getCellValueFromCb = (ref: string): number => {
    const raw = getCell(ref) ?? "";
    return evaluateGridless(raw, (r) => getCell(r));
  };
  const tokens = tokenize(expr);
  const rpn = toRpn(tokens);
  const st: number[] = [];
  for (const t of rpn) {
    if (/^\d/.test(t)) {
      st.push(parseFloat(t));
    } else if (/^[A-Za-z]+\d+$/.test(t)) {
      st.push(getCellValueFromCb(t));
    } else if (isNamedVariable(t)) {
      // Handle variables in gridless context
      const value = resolveVariable(t);
      if (value !== undefined) {
        st.push(value);
      } else {
        throw new Error(`Undefined variable: ${t}`);
      }
    } else {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Malformed expression");
      st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
    }
  }
  if (st.length !== 1) throw new Error("Malformed expression");
  return st[0];
}

function evaluateGridless(raw: string, getCell: (ref: string) => string): number {
  const s = raw.trim();
  
  // Handle formulas (start with =)
  if (s.startsWith("=")) {
    const tokens = tokenize(s.slice(1));
    const rpn = toRpn(tokens);
    const st: number[] = [];
    for (const t of rpn) {
      if (/^\d/.test(t)) {
        st.push(parseFloat(t));
      } else if (/^[A-Za-z]+\d+$/.test(t)) {
        const rawRef = getCell(t) ?? "";
        st.push(evaluateGridless(rawRef, getCell));
      } else if (isNamedVariable(t)) {
        // Handle variables in gridless context
        const value = resolveVariable(t);
        if (value !== undefined) {
          st.push(value);
        } else {
          throw new Error(`Undefined variable: ${t}`);
        }
      } else {
        const b = st.pop(); const a = st.pop();
        if (a === undefined || b === undefined) throw new Error("Malformed expression");
        st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
      }
    }
    if (st.length !== 1) throw new Error("Malformed expression");
    return st[0];
  }
  
  // Handle variable assignments (e.g., "L = 5 ft", "Area = L * W") in gridless context
  const assignMatch = s.match(/^([A-Za-z]+)\s*=\s*(.+)$/);
  if (assignMatch) {
    const varName = assignMatch[1];
    const valueStr = assignMatch[2].trim();
    
    let exprValue: number;
    
    // Parse the value (could be number with units or expression)
    const numMatch = valueStr.match(/^([\d.]+)(?:\s*([A-Za-z]+))?$/);
    if (numMatch) {
      exprValue = parseFloat(numMatch[1]);
    } else {
      // The value is an expression - use evaluateExpr to handle it
      exprValue = evaluateExpr(valueStr, getCell);
    }
    
    // Store the variable value directly
    defineVariable(varName, exprValue);
    
    return exprValue;
  }
  
  // Handle plain numbers
  const n = Number(s);
  if (Number.isFinite(n)) return n;
  
  throw new Error("Not a formula/number/assignment");
}