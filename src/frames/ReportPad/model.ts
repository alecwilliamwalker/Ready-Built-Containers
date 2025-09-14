import { parse as parseUnified, evaluate as evaluateUnified, classifyInput } from "../../unified_parser";
import { normalizeForParser } from "../../lib/text/normalize";

export type LineKind = "def" | "expr" | "text";

export type Quantity = {
  valueSI: number; // SI base value
  dims: { L: number; M: number; T: number; F: number };
  displayUnit?: string; // preferred display
};

export type Line = {
  id: string;
  text: string;
  kind: LineKind;
  result?: Quantity;
  error?: string;
};

export type Doc = {
  lines: Line[];
};

// Units registry (MVP)
const unitDef: Record<string, { dims: Quantity["dims"]; toSI: number; fromSI: number }> = {
  // Length
  m: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 1, fromSI: 1 },
  mm: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.001, fromSI: 1000 },
  in: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.0254, fromSI: 39.37007874 },
  ft: { dims: { L: 1, M: 0, T: 0, F: 0 }, toSI: 0.3048, fromSI: 3.280839895 },
  // Force
  N: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 1, fromSI: 1 },
  kN: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 1000, fromSI: 0.001 },
  lb: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 4.4482216153, fromSI: 0.2248089431 },
  kip: { dims: { L: 0, M: 0, T: 0, F: 1 }, toSI: 4448.2216153, fromSI: 0.0002248089431 },
  // Pressure (F/L^2)
  Pa: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 1, fromSI: 1 },
  psi: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 6894.75729, fromSI: 1 / 6894.75729 },
  ksi: { dims: { L: -2, M: 0, T: 0, F: 1 }, toSI: 6894757.29, fromSI: 1 / 6894757.29 },
};

function dimsEqual(a: Quantity["dims"], b: Quantity["dims"]) {
  return a.L === b.L && a.M === b.M && a.T === b.T && a.F === b.F;
}

function dimsAdd(a: Quantity["dims"], b: Quantity["dims"]) {
  return { L: a.L + b.L, M: a.M + b.M, T: a.T + b.T, F: a.F + b.F };
}

function dimsSub(a: Quantity["dims"], b: Quantity["dims"]) {
  return { L: a.L - b.L, M: a.M - b.M, T: a.T - b.T, F: a.F - b.F };
}

function dimsPow(a: Quantity["dims"], p: number) {
  return { L: a.L * p, M: a.M * p, T: a.T * p, F: a.F * p };
}

export function makeQuantity(value: number, unit?: string): Quantity {
  if (!unit) return { valueSI: value, dims: { L: 0, M: 0, T: 0, F: 0 } };
  const def = unitDef[unit];
  if (!def) throw new Error(`Unknown unit: ${unit}`);
  return { valueSI: value * def.toSI, dims: def.dims, displayUnit: unit };
}

export function convertDisplay(q: Quantity, toUnit?: string): { value: number; unit?: string } {
  if (!toUnit) {
    if (!q.displayUnit) return { value: q.valueSI, unit: undefined };
    const d = unitDef[q.displayUnit];
    if (!d || !dimsEqual(d.dims, q.dims)) return { value: q.valueSI, unit: undefined };
    return { value: q.valueSI * d.fromSI, unit: q.displayUnit };
  }
  const d = unitDef[toUnit];
  if (!d) throw new Error(`Unknown unit: ${toUnit}`);
  if (!dimsEqual(d.dims, q.dims)) throw new Error(`Incompatible units`);
  return { value: q.valueSI * d.fromSI, unit: toUnit };
}

// Lexer/parser (minimal)
export type Token =
  | { t: "NUM"; v: number }
  | { t: "UNIT"; v: string }
  | { t: "NAME"; v: string }
  | { t: "REF"; v: string }
  | { t: "RANGE"; v: string } // e.g., A1:C10
  | { t: "OP"; v: string }
  | { t: "PAREN"; v: "(" | ")" }
  | { t: "COMMA" };

const reNum = /^(?:\d+\.\d+|\d+\.?)/;
const reUnit = /^(?:[A-Za-z]+)$/;
const reName = /^[A-Za-z][A-Za-z0-9_]*/;
const reRef = /^[A-Z]+[1-9][0-9]*/;
const reRange = /^[A-Z]+[1-9][0-9]*:[A-Z]+[1-9][0-9]*/;

export function lex(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const s = normalizeForParser(input);
  while (i < s.length) {
    const ch = s[i];
    if (ch === " " ) { i += 1; continue; }
    if (/[+\-*/^]/.test(ch)) { out.push({ t: "OP", v: ch }); i += 1; continue; }
    if (ch === ",") { out.push({ t: "COMMA" }); i += 1; continue; }
    if (ch === "(" || ch === ")") { out.push({ t: "PAREN", v: ch }); i += 1; continue; }
    const rest = s.slice(i);
    const mRange = rest.match(reRange);
    if (mRange) { out.push({ t: "RANGE", v: mRange[0] }); i += mRange[0].length; continue; }
    const mNum = rest.match(reNum);
    if (mNum) { out.push({ t: "NUM", v: parseFloat(mNum[0]) }); i += mNum[0].length; continue; }
    const mRef = rest.match(reRef);
    if (mRef) { out.push({ t: "REF", v: mRef[0] }); i += mRef[0].length; continue; }
    const mName = rest.match(reName);
    if (mName) { out.push({ t: "NAME", v: mName[0] }); i += mName[0].length; continue; }
    throw new Error(`Unexpected token at ${i}`);
  }
  return out;
}

// AST
export type Expr =
  | { k: "num"; q: Quantity }
  | { k: "name"; name: string }
  | { k: "ref"; ref: string }
  | { k: "range"; a1: string; b1: string }
  | { k: "call"; f: string; args: Expr[] }
  | { k: "bin"; op: "+"|"-"|"*"|"/"|"^"; left: Expr; right: Expr };

export function parseExpr(tokens: Token[]): Expr {
  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  function parsePrimary(): Expr {
    const tok = eat();
    if (!tok) throw new Error("Unexpected end");
    if (tok.t === "NUM") {
      // Support optional unit immediately after number
      if (peek() && (peek().t === "NAME")) {
        const unitName = (eat() as any).v as string;
        return { k: "num", q: makeQuantity(tok.v, unitName) };
      }
      return { k: "num", q: makeQuantity(tok.v) };
    }
    if (tok.t === "NAME") {
      if (peek() && peek().t === "PAREN" && (peek() as any).v === "(") {
        eat(); // (
        const args: Expr[] = [];
        if (peek() && !(peek()!.t === "PAREN" && (peek() as any).v === ")")) {
          args.push(parseAddSub());
          while (peek() && peek()!.t === "COMMA") { eat(); args.push(parseAddSub()); }
        }
        const closing = eat(); if (!closing || closing.t !== "PAREN" || closing.v !== ")") throw new Error("Missing )");
        return { k: "call", f: tok.v, args };
      }
      return { k: "name", name: tok.v };
    }
    if (tok.t === "REF") return { k: "ref", ref: tok.v };
    if (tok.t === "RANGE") {
      const [a1, b1] = tok.v.split(":");
      return { k: "range", a1, b1 };
    }
    if (tok.t === "PAREN" && tok.v === "(") {
      const expr = parseAddSub();
      const closing = eat();
      if (!closing || closing.t !== "PAREN" || closing.v !== ")") throw new Error("Missing )");
      return expr;
    }
    throw new Error("Bad primary");
  }

  function parsePow(): Expr {
    let left = parsePrimary();
    while (peek() && peek().t === "OP" && (peek() as any).v === "^") {
      eat();
      const right = parsePrimary();
      left = { k: "bin", op: "^", left, right };
    }
    return left;
  }

  function parseMulDiv(): Expr {
    let left = parsePow();
    while (peek() && peek().t === "OP" && ((peek() as any).v === "*" || (peek() as any).v === "/")) {
      const op = (eat() as any).v as any;
      const right = parsePow();
      left = { k: "bin", op, left, right };
    }
    return left;
  }

  function parseAddSub(): Expr {
    let left = parseMulDiv();
    while (peek() && peek().t === "OP" && ((peek() as any).v === "+" || (peek() as any).v === "-")) {
      const op = (eat() as any).v as any;
      const right = parseMulDiv();
      left = { k: "bin", op, left, right };
    }
    return left;
  }

  const expr = parseAddSub();
  if (i !== tokens.length) throw new Error("Unexpected tokens");
  return expr;
}

export type Namespace = Map<string, Quantity>;

function powQuantity(q: Quantity, p: number): Quantity {
  return { valueSI: Math.pow(q.valueSI, p), dims: dimsPow(q.dims, p), displayUnit: q.displayUnit ? `${q.displayUnit}^${p}` : undefined };
}

function mulQuantity(a: Quantity, b: Quantity): Quantity {
  const disp = a.displayUnit && b.displayUnit ? `${a.displayUnit}*${b.displayUnit}` : a.displayUnit || b.displayUnit;
  return { valueSI: a.valueSI * b.valueSI, dims: dimsAdd(a.dims, b.dims), displayUnit: disp };
}

function divQuantity(a: Quantity, b: Quantity): Quantity {
  const disp = a.displayUnit && b.displayUnit ? `${a.displayUnit}/${b.displayUnit}` : a.displayUnit || (b.displayUnit ? `1/${b.displayUnit}` : undefined);
  return { valueSI: a.valueSI / b.valueSI, dims: dimsSub(a.dims, b.dims), displayUnit: disp };
}

function addQuantity(a: Quantity, b: Quantity): Quantity {
  if (!dimsEqual(a.dims, b.dims)) throw new Error("Incompatible units");
  // Convert b into a's display unit if possible
  let bInA = b.valueSI;
  if (a.displayUnit) {
    const u = unitDef[a.displayUnit];
    if (u && dimsEqual(u.dims, b.dims)) bInA = b.valueSI * u.fromSI;
    const aVal = a.valueSI * u.fromSI;
    return { valueSI: (aVal + bInA) * u.toSI, dims: a.dims, displayUnit: a.displayUnit };
  }
  return { valueSI: a.valueSI + b.valueSI, dims: a.dims };
}

export type EvalCtx = {
  getCellDisplay: (r: number, c: number) => string;
  a1ToRC: (a1: string) => { r: number; c: number } | null;
  ns: Namespace;
};

function parseNumberWithUnit(text: string): Quantity | null {
  const m = /^\s*(\d+(?:\.\d+)?)\s*([A-Za-z]+)?\s*$/.exec(text);
  if (!m) return null;
  const num = parseFloat(m[1]);
  const unit = m[2];
  try { return makeQuantity(num, unit); } catch { return null; }
}

// Resolve names case-insensitively in evalExpr
export function evalExpr(node: Expr, ctx: EvalCtx): Quantity {
  switch (node.k) {
    case "num": return node.q;
    case "name": {
      // First try namespace variables (definitions)
      const key = node.name.toUpperCase();
      const q = ctx.ns.get(key);
      if (q) return q;
      // Fallback: interpret bare unit symbols as a quantity of 1 unit
      if (unitDef[node.name]) {
        return makeQuantity(1, node.name);
      }
      throw new Error(`Unknown name: ${node.name}`);
    }
    case "ref": {
      const rc = ctx.a1ToRC(node.ref);
      if (!rc) throw new Error(`Bad ref: ${node.ref}`);
      const disp = ctx.getCellDisplay(rc.r, rc.c);
      const q = parseNumberWithUnit(disp);
      if (!q) {
        const num = Number(disp);
        if (Number.isFinite(num)) return makeQuantity(num);
        throw new Error(`Bad cell value: ${node.ref}`);
      }
      return q;
    }
    case "range": {
      // A range is only valid as an argument; evaluate to a sentinel by throwing
      throw new Error("Range cannot be evaluated directly");
    }
    case "call": {
      const fname = node.f.toUpperCase();
      if (fname === "VLOOKUP") {
        if (node.args.length < 3) throw new Error("VLOOKUP(key, range, colIndex)");
        const keyQ = evalExpr(node.args[0], ctx);
        const rng = node.args[1];
        if (rng.k !== "range") throw new Error("VLOOKUP second arg must be a range A1:B10");
        const colIdxQ = evalExpr(node.args[2], ctx);
        if (colIdxQ.dims.L !== 0 || colIdxQ.dims.M !== 0 || colIdxQ.dims.T !== 0 || colIdxQ.dims.F !== 0) throw new Error("colIndex must be dimensionless");
        const colIndex = Math.round(colIdxQ.valueSI);
        if (colIndex < 1) throw new Error("colIndex must be >= 1");

        const start = ctx.a1ToRC(rng.a1);
        const end = ctx.a1ToRC(rng.b1);
        if (!start || !end) throw new Error("Bad range");
        const r0 = Math.min(start.r, end.r);
        const r1 = Math.max(start.r, end.r);
        const c0 = Math.min(start.c, end.c);
        const c1 = Math.max(start.c, end.c);
        if (c0 + (colIndex - 1) > c1) throw new Error("colIndex out of range");

        const approx = false; // exact match for now
        const keyVal = keyQ.valueSI; const keyDims = keyQ.dims;
        const eps = 1e-9;
        for (let r = r0; r <= r1; r += 1) {
          const disp = ctx.getCellDisplay(r, c0);
          const q = parseNumberWithUnit(disp);
          if (!q) continue;
          if (q.dims.L === keyDims.L && q.dims.M === keyDims.M && q.dims.T === keyDims.T && q.dims.F === keyDims.F) {
            if (Math.abs(q.valueSI - keyVal) <= eps * Math.max(1, Math.abs(keyVal))) {
              const dispTarget = ctx.getCellDisplay(r, c0 + (colIndex - 1));
              const qt = parseNumberWithUnit(dispTarget);
              if (qt) return qt;
              const num = Number(dispTarget);
              if (Number.isFinite(num)) return makeQuantity(num);
              throw new Error("Non-numeric VLOOKUP target");
            }
          }
        }
        if (approx) {
          // Not implemented
        }
        throw new Error("VLOOKUP: key not found");
      }
      throw new Error(`Unknown function: ${node.f}`);
    }
    case "bin": {
      const left = evalExpr(node.left, ctx);
      const right = evalExpr(node.right, ctx);
      if (node.op === "+") return addQuantity(left, right);
      if (node.op === "-") return addQuantity(left, { ...right, valueSI: -right.valueSI });
      if (node.op === "*") return mulQuantity(left, right);
      if (node.op === "/") return divQuantity(left, right);
      if (node.op === "^") {
        if (right.dims.L !== 0 || right.dims.M !== 0 || right.dims.T !== 0 || right.dims.F !== 0) throw new Error("Exponent must be dimensionless");
        return powQuantity(left, right.valueSI);
      }
      throw new Error("Bad op");
    }
  }
}

export function classifyLine(text: string): LineKind {
  const basic = classifyBasic(text);
  if (basic.kind === "def") return "def";
  try {
    const tokens = lex(trimTrailingEquals(text));
    parseExpr(tokens);
    return "expr";
  } catch { return "text"; }
}

export function recompute(doc: Doc, getCellDisplay: (r: number, c: number) => string, a1ToRC: (a1: string) => { r: number; c: number } | null): Doc {
  const ns: Namespace = new Map();
  const nextLines: Line[] = [];
  for (const line of doc.lines) {
    const kind = classifyLine(line.text);
    let result: Quantity | undefined;
    let error: string | undefined;
    if (kind === "def") {
      const def = tryParseDef(line.text);
      if (def) {
        const nameKey = def.name.toUpperCase();
        try {
          const tokens = lex(def.rhs);
          const ast = parseExpr(tokens);
          const q = evalExpr(ast, { getCellDisplay, a1ToRC, ns });
          ns.set(nameKey, q);
          result = q; // always show value on def lines
        } catch (e: any) {
          error = e?.message ?? String(e);
        }
      }
    } else if (kind === "expr") {
      try {
        const tokens = lex(trimTrailingEquals(line.text));
        const ast = parseExpr(tokens);
        result = evalExpr(ast, { getCellDisplay, a1ToRC, ns });
      } catch (e: any) {
        error = e?.message ?? String(e);
      }
    }
    nextLines.push({ ...line, kind, result, error });
  }
  return { lines: nextLines };
} 