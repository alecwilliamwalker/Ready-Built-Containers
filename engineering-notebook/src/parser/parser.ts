import type { Token, Unit } from "./lexer";
import { tokenize } from "./lexer";

export type Quantity = { kind: "qty"; value: number; unit?: Unit };
export type Expr =
  | Quantity
  | { kind: "add"; left: Expr; right: Expr }
  | { kind: "sub"; left: Expr; right: Expr };

export type Stmt =
  | { kind: "assign"; name: string; expr: Expr }
  | { kind: "expr"; expr: Expr };

export function parseStatement(src: string): Stmt {
  const tokens = tokenize(src).filter(t => t.type !== "WS");
  // Explicitly mark unsupported operations to trigger upstream fallback
  if (tokens.some(t => t.type === 'STAR' || t.type === 'SLASH')) {
    throw new Error('__MULT_DIV_FALLBACK__');
  }
  let i = 0;

  const peek = () => tokens[i];
  const consume = () => tokens[i++];

  function parseQuantityOrIdent(): Expr {
    const t = peek();
    if (!t) throw new Error("unexpected end");
    if (t.type === "NUMBER") {
      consume();
      let unit: Unit | undefined;
      if (peek() && peek()!.type === "UNIT") {
        unit = (consume() as any).unit as Unit;
      }
      return { kind: "qty", value: t.value, unit };
    }
    if (t.type === "IDENT") {
      throw new Error(`unknown identifier '${t.lexeme}'`);
    }
    throw new Error(`expected number or identifier`);
  }

  function parseTerm(): Expr {
    return parseQuantityOrIdent();
  }

  function parseExpr(): Expr {
    let left = parseTerm();
    while (peek() && (peek()!.type === "PLUS" || peek()!.type === "MINUS")) {
      const op = consume().type;
      const right = parseTerm();
      left = op === "PLUS" ? { kind: "add", left, right } : { kind: "sub", left, right };
    }
    return left;
  }

  if (peek() && peek()!.type === "IDENT") {
    const name = (consume() as any).name as string;
    if (peek() && peek()!.type === "EQUAL") {
      consume();
      return { kind: "assign", name, expr: parseExpr() };
    }
    throw new Error(`expected '=' after identifier '${name}'`);
  }

  return { kind: "expr", expr: parseExpr() };
}


