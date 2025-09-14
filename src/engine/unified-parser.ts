// Unified expression parser for both spreadsheet and report canvas
// Handles all operations, variables, cell references, and units in one place

import { normalizeForParser } from '../lib/text/normalize';

export type Expr =
  | { kind: "number"; value: number; unit?: string }
  | { kind: "variable"; name: string }
  | { kind: "cell"; ref: string }
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }
  | { kind: "assign"; name: string; value: Expr };

export type ParseResult = 
  | { kind: "assignment"; name: string; expr: Expr }
  | { kind: "expression"; expr: Expr };

// Simple tokenizer that handles all our cases
function tokenize(input: string): string[] {
  const normalized = normalizeForParser(input);
  // Match: numbers (with decimals), units, cell refs (A1, B2), identifiers, operators, parentheses
  const regex = /([A-Za-z]+\d+)|(\d+(?:\.\d+)?)\s*([A-Za-z]+)?|([A-Za-z]+)|([+\-*/=()])/g;
  const tokens: string[] = [];
  let match;
  
  while ((match = regex.exec(normalized)) !== null) {
    if (match[1]) {
      // Cell reference like A1, B2
      tokens.push(match[1]);
    } else if (match[2]) {
      // Number
      tokens.push(match[2]);
      if (match[3]) {
        // Unit attached to number
        tokens.push(match[3]);
      }
    } else if (match[4]) {
      // Identifier/variable
      tokens.push(match[4]);
    } else if (match[5]) {
      // Operator
      tokens.push(match[5]);
    }
  }
  
  return tokens.filter(t => t.trim() !== '');
}

// Simple recursive descent parser with proper precedence
export function parseExpression(input: string): ParseResult {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];
  const isAtEnd = () => pos >= tokens.length;

  // Parse assignment or expression
  function parseStatement(): ParseResult {
    // Check for assignment: IDENTIFIER = expression
    if (tokens.length >= 3 && /^[A-Za-z]+$/.test(tokens[0]) && tokens[1] === '=') {
      const name = consume(); // identifier
      consume(); // =
      const expr = parseExpr();
      return { kind: "assignment", name, expr };
    }
    
    // Otherwise it's just an expression
    const expr = parseExpr();
    return { kind: "expression", expr };
  }

  // Parse expression with proper precedence
  function parseExpr(): Expr {
    return parseAddSub();
  }

  function parseAddSub(): Expr {
    let left = parseMulDiv();
    
    while (!isAtEnd() && (peek() === '+' || peek() === '-')) {
      const op = consume() as '+' | '-';
      const right = parseMulDiv();
      left = { kind: "binary", op, left, right };
    }
    
    return left;
  }

  function parseMulDiv(): Expr {
    let left = parsePrimary();
    
    while (!isAtEnd() && (peek() === '*' || peek() === '/')) {
      const op = consume() as '*' | '/';
      const right = parsePrimary();
      left = { kind: "binary", op, left, right };
    }
    
    return left;
  }

  function parsePrimary(): Expr {
    const token = peek();
    
    if (!token) {
      throw new Error("Unexpected end of expression");
    }

    // Handle parentheses
    if (token === '(') {
      consume(); // (
      const expr = parseExpr();
      if (peek() !== ')') {
        throw new Error("Expected closing parenthesis");
      }
      consume(); // )
      return expr;
    }

    // Handle numbers
    if (/^\d+(\.\d+)?$/.test(token)) {
      const value = parseFloat(consume());
      
      // Check for unit after number
      const nextToken = peek();
      if (nextToken && /^[A-Za-z]+$/.test(nextToken) && !isOperatorOrEnd(nextToken)) {
        const unit = consume();
        return { kind: "number", value, unit };
      }
      
      return { kind: "number", value };
    }

    // Handle cell references (A1, B2, etc.)
    if (/^[A-Za-z]+\d+$/.test(token)) {
      const ref = consume();
      return { kind: "cell", ref };
    }

    // Handle variables/identifiers
    if (/^[A-Za-z]+$/.test(token)) {
      const name = consume();
      return { kind: "variable", name };
    }

    throw new Error(`Unexpected token: ${token}`);
  }

  function isOperatorOrEnd(token: string): boolean {
    return ['+', '-', '*', '/', '=', ')', undefined].includes(token);
  }

  return parseStatement();
}

// Utility function to check if a string looks like a formula
export function isFormula(input: string): boolean {
  const normalized = normalizeForParser(input);
  return normalized.startsWith('=') || /[+\-*/]/.test(normalized) || /^[A-Za-z]+\s*=/.test(normalized);
}

// Convert expression back to string (for debugging)
export function exprToString(expr: Expr): string {
  switch (expr.kind) {
    case "number":
      return expr.unit ? `${expr.value} ${expr.unit}` : expr.value.toString();
    case "variable":
      return expr.name;
    case "cell":
      return expr.ref;
    case "binary":
      return `(${exprToString(expr.left)} ${expr.op} ${exprToString(expr.right)})`;
    case "assign":
      return `${expr.name} = ${exprToString(expr.value)}`;
  }
}