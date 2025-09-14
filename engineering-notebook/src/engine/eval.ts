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
    return evaluateWithVisited(grid, raw, visiting);
  } finally {
    visiting.delete(key);
  }
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

function evalRpn(grid: Grid, rpn: string[], visiting: Set<string>): number {
  const st: number[] = [];
  for (const t of rpn) {
    if (/^\d/.test(t)) st.push(parseFloat(t));
    else if (/^[A-Za-z]+\d+$/.test(t)) st.push(getCellValue(grid, t, visiting));
    else {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Malformed expression");
      st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
    }
  }
  if (st.length !== 1) throw new Error("Malformed expression");
  return st[0];
}

function evaluateWithVisited(grid: Grid, raw: string, visiting: Set<string>): number {
  const s = raw.trim();
  if (!s.startsWith("=")) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
    throw new Error("Not a formula/number");
  }
  const tokens = tokenize(s.slice(1));
  return evalRpn(grid, toRpn(tokens), visiting);
}

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
    if (/^\d/.test(t)) st.push(parseFloat(t));
    else if (/^[A-Za-z]+\d+$/.test(t)) st.push(getCellValueFromCb(t));
    else {
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
  if (!s.startsWith("=")) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
    throw new Error("Not a formula/number");
  }
  const tokens = tokenize(s.slice(1));
  // Reuse toRpn and eval with getCell via temporary gridless path
  const rpn = toRpn(tokens);
  const st: number[] = [];
  for (const t of rpn) {
    if (/^\d/.test(t)) st.push(parseFloat(t));
    else if (/^[A-Za-z]+\d+$/.test(t)) {
      const rawRef = getCell(t) ?? "";
      st.push(evaluateGridless(rawRef, getCell));
    } else {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error("Malformed expression");
      st.push(t === "+" ? a + b : t === "-" ? a - b : t === "*" ? a * b : a / b);
    }
  }
  if (st.length !== 1) throw new Error("Malformed expression");
  return st[0];
}
