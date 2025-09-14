import { findCellRefs } from "../notebook/parsing/cellRefs";

export type StepDoc = {
  equationLaTeX?: string;
  inputs: Array<{ name: string; display: string; source?: string }>;
  substitutionLaTeX?: string;
  result?: { display: string; unit?: string };
  notes?: string[];
  // New: structured fraction info for nicer rendering without KaTeX
  fraction?: { numerator: string; denominator: string };
  substitutionFraction?: { numerator: string; denominator: string };
  numericResult?: number;
};

export function build(expr: string, ctx: { getCellDisplay: (r: number, c: number) => string; resolveName?: (name: string) => string | undefined }): StepDoc {
  const refs = findCellRefs(expr);
  const inputs = refs.map((r) => ({ name: r.label, display: ctx.getCellDisplay(r.r, r.c), source: r.label }));

  // Try to recognize a simple fraction pattern like X/C, A1/B2, or 1000/60
  const m = /^\s*([A-Za-z][A-Za-z0-9_]*|[A-Z]+[1-9][0-9]*|\d+(?:\.\d+)?)\s*\/\s*([A-Za-z][A-Za-z0-9_]*|[A-Z]+[1-9][0-9]*|\d+(?:\.\d+)?)\s*$/.exec(expr);
  if (m) {
    const left = m[1];
    const right = m[2];
    const a1Re = /^([A-Z]+)([1-9][0-9]*)$/;
    const isA1 = (s: string) => a1Re.test(s);
    const numDisp = (s: string): string => {
      if (isA1(s)) {
        const r = findCellRefs(s)[0];
        if (r) return ctx.getCellDisplay(r.r, r.c);
        return s;
      }
      return s;
    };
    const subNum = numDisp(left);
    const subDen = numDisp(right);
    const nVal = parseFloat(String(subNum).replace(/[^0-9.\-+eE]/g, ""));
    const dVal = parseFloat(String(subDen).replace(/[^0-9.\-+eE]/g, ""));
    const canEval = Number.isFinite(nVal) && Number.isFinite(dVal) && dVal !== 0;
    const res = canEval ? nVal / dVal : undefined;
    const resText = canEval ? formatNumber(res!) : "—";
    return {
      equationLaTeX: `\\frac{${left}}{${right}}`,
      substitutionLaTeX: `\\frac{${subNum}}{${subDen}}`,
      inputs,
      fraction: { numerator: left, denominator: right },
      substitutionFraction: { numerator: String(subNum), denominator: String(subDen) },
      numericResult: canEval ? res : undefined,
      result: { display: resText },
    };
  }

  // Default passthrough
  return {
    equationLaTeX: expr,
    inputs,
    substitutionLaTeX: expr,
    result: { display: "(hook up units to compute)" },
  };
}

function formatNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e6 || (abs > 0 && abs < 1e-3)) return n.toExponential(3);
  return n.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, "");
}