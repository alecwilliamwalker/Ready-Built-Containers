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

function getCellValue(grid: Grid, ref: string): number {
  const rc = refToRC(ref);
  if (!rc) throw new Error(`Bad ref: ${ref}`);
  const raw = grid[rc.r]?.[rc.c] ?? "";
  return evaluate(grid, raw);
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  const re = /\s*([A-Za-z]+\d+|\d+(?:\.\d+)?|\+|\-|\*|\/|\(|\))\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) tokens.push(m[1]);
  return tokens;
}

function toRpn(tokens: string[]): string[] {
  const out: string[] = [];
  const op: string[] = [];
  const prec: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  for (const t of tokens) {
    if (/^\d/.test(t) || /^[A-Za-z]+\d+$/.test(t)) out.push(t);
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

function evalRpn(grid: Grid, rpn: string[]): number {
  const st: number[] = [];
  for (const t of rpn) {
    if (/^\d/.test(t)) st.push(parseFloat(t));
    else if (/^[A-Za-z]+\d+$/.test(t)) st.push(getCellValue(grid, t));
    else {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Malformed expression");
      st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
    }
  }
  if (st.length !== 1) throw new Error("Malformed expression");
  return st[0];
}

export function evaluate(grid: Grid, raw: string): number {
  const s = raw.trim();
  if (!s.startsWith("=")) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
    throw new Error("Not a formula/number");
  }
  const tokens = tokenize(s.slice(1));
  return evalRpn(grid, toRpn(tokens));
}
