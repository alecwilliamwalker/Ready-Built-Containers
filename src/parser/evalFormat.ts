import type { Expr, Stmt } from "./parser";

type EvalQty = { value: number; unit?: string };

function ensureSameUnit(a: EvalQty, b: EvalQty) {
  const ua = a.unit ?? null;
  const ub = b.unit ?? null;
  if (ua !== ub) throw new Error(`unit mismatch: ${ua ?? "(none)"} vs ${ub ?? "(none)"}`);
}

export function evalExpr(expr: Expr): EvalQty {
  switch (expr.kind) {
    case "qty": return { value: expr.value, unit: expr.unit };
    case "add": {
      const L = evalExpr(expr.left), R = evalExpr(expr.right);
      ensureSameUnit(L, R);
      return { value: L.value + R.value, unit: L.unit };
    }
    case "sub": {
      const L = evalExpr(expr.left), R = evalExpr(expr.right);
      ensureSameUnit(L, R);
      return { value: L.value - R.value, unit: L.unit };
    }
  }
}

const THIN = "\u2009"; // thin space for display

export function formatQuantity(q: EvalQty): string {
  return q.unit ? `${stripTrailingZeros(q.value)}${THIN}${q.unit}` : `${stripTrailingZeros(q.value)}`;
}

function stripTrailingZeros(n: number): string {
  const s = n.toString();
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

export function formatStatement(stmt: Stmt): string {
  if (stmt.kind === "assign") {
    const res = formatQuantity(evalExpr(stmt.expr));
    return `${stmt.name} = ${formatExpr(stmt.expr)} = ${res}`;
  }
  return formatExpr(stmt.expr);
}

function formatExpr(expr: Expr): string {
  switch (expr.kind) {
    case "qty": return expr.unit ? `${stripTrailingZeros(expr.value)}${THIN}${expr.unit}` : `${stripTrailingZeros(expr.value)}`;
    case "add": return `${formatExpr(expr.left)} + ${formatExpr(expr.right)}`;
    case "sub": return `${formatExpr(expr.left)} - ${formatExpr(expr.right)}`;
  }
}


