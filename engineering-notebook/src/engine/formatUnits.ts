import { getUnitPrefs } from "./unitPrefs";
export type Dim = { L: number; M: number; T: number; F: number };
export type QtyCanon = { valueSI: number; dims: Dim };
export type DisplayQty = { value: number; unit: string };

type UnitDef = { name: string; dims: Dim; toSI: number };

const U = (name: string, dims: Dim, toSI: number): UnitDef => ({ name, dims, toSI });

const registry: Record<string, UnitDef> = {
  // Length
  in: U("in", { L: 1, M: 0, T: 0, F: 0 }, 0.0254),
  ft: U("ft", { L: 1, M: 0, T: 0, F: 0 }, 0.3048),
  mm: U("mm", { L: 1, M: 0, T: 0, F: 0 }, 0.001),
  m: U("m", { L: 1, M: 0, T: 0, F: 0 }, 1),
  // Force
  lb: U("lb", { L: 0, M: 0, T: 0, F: 1 }, 4.4482216153),
  kip: U("kip", { L: 0, M: 0, T: 0, F: 1 }, 4448.2216153),
  N: U("N", { L: 0, M: 0, T: 0, F: 1 }, 1),
  kN: U("kN", { L: 0, M: 0, T: 0, F: 1 }, 1000),
  // Time
  s: U("s", { L: 0, M: 0, T: 1, F: 0 }, 1),
  // Pressure
  Pa: U("Pa", { L: -2, M: 0, T: 0, F: 1 }, 1),
  kPa: U("kPa", { L: -2, M: 0, T: 0, F: 1 }, 1000),
  MPa: U("MPa", { L: -2, M: 0, T: 0, F: 1 }, 1_000_000),
  psi: U("psi", { L: -2, M: 0, T: 0, F: 1 }, 6894.75729),
  ksi: U("ksi", { L: -2, M: 0, T: 0, F: 1 }, 6_894_757.29),
};

function dimsEqual(a: Dim, b: Dim): boolean {
  return a.L === b.L && a.M === b.M && a.T === b.T && a.F === b.F;
}

function choose<T>(...xs: (T | undefined)[]): T | undefined {
  for (const x of xs) if (x !== undefined) return x;
}

function pow10(n: number) { return Math.pow(10, n); }

export function displayAs(q: QtyCanon, unit: string): DisplayQty {
  // Unit may be like in, ft^2, lb·in, lb/in^2
  const parts = unit.split("/");
  const numPart = parts[0];
  const denPart = parts[1];
  let factor = 1;
  const apply = (spec: string, sign: 1 | -1) => {
    const dotParts = spec.split(/\u00B7|·|\./g); // split on middot/dot
    for (const p of dotParts) {
      if (!p) continue;
      const m = /^([A-Za-z]+)(?:\^(\-?\d+))?$/.exec(p.trim());
      if (!m) throw new Error(`Unknown unit: ${p}`);
      const u = registry[m[1]];
      if (!u) throw new Error(`Unknown unit: ${m[1]}`);
      const exp = (m[2] ? parseInt(m[2], 10) : 1) * sign;
      factor *= Math.pow(1 / u.toSI, exp);
    }
  };
  apply(numPart, 1);
  if (denPart) apply(denPart, -1);
  return { value: q.valueSI * factor, unit };
}

function formatUnitPower(sym: string, p: number): string {
  if (p === 1) return sym;
  if (p === 2 || p === 3) return `${sym}^${p}`;
  return `${sym}^${p}`;
}

export function autoDisplay(q: QtyCanon, hints?: { lhsUnit?: string; rhsUnit?: string }): DisplayQty {
  const d = q.dims;
  const prefs = getUnitPrefs();
  // Pure length power L^n
  if (d.M === 0 && d.T === 0 && d.F === 0 && d.L !== 0) {
    const base = hints?.lhsUnit || hints?.rhsUnit || prefs.lengthBase;
    const u = registry[base] ?? registry[prefs.lengthBase];
    const value = q.valueSI * Math.pow(1 / u.toSI, d.L);
    return { value, unit: formatUnitPower(u.name, d.L) };
  }
  // Stress F/L^2
  if (d.F === 1 && d.L === -2 && d.M === 0 && d.T === 0) {
    if (prefs.stressScale === 'psi/ksi') {
      const toPsi = 1 / registry.psi.toSI;
      let value = q.valueSI * toPsi;
      let unit = "psi";
      if (Math.abs(value) >= 1000) { value = value / 1000; unit = "ksi"; }
      return { value, unit };
    } else {
      // Pa/kPa/MPa by magnitude
      let value = q.valueSI;
      let unit = "Pa";
      if (Math.abs(value) >= 1_000_000) { value = value / 1_000_000; unit = "MPa"; }
      else if (Math.abs(value) >= 1000) { value = value / 1000; unit = "kPa"; }
      return { value, unit };
    }
  }
  // Moment F·L
  if (d.F === 1 && d.L === 1 && d.M === 0 && d.T === 0) {
    if (prefs.forceBase === 'lb') {
      const inValue = q.valueSI * (1 / registry.lb.toSI) * (1 / registry.in.toSI);
      if (Math.abs(inValue) >= 1200) {
        const ftValue = q.valueSI * (1 / registry.lb.toSI) * (1 / registry.ft.toSI);
        return { value: ftValue, unit: "lb·ft" };
      }
      return { value: inValue, unit: "lb·in" };
    }
    // metric default to N·m
    const nm = q.valueSI * (1 / registry.N.toSI) * (1 / registry.m.toSI);
    return { value: nm, unit: "N·m" };
  }
  // General composite: choose base per dim
  const baseL = hints?.lhsUnit && registry[hints.lhsUnit]?.dims.L === 1 ? hints.lhsUnit : prefs.lengthBase;
  const baseF = prefs.forceBase;
  const baseT = prefs.timeBase;
  let value = q.valueSI;
  const num: string[] = [];
  const den: string[] = [];
  if (d.L !== 0) { value *= Math.pow(1 / registry[baseL].toSI, d.L); (d.L > 0 ? num : den).push(formatUnitPower(baseL, Math.abs(d.L))); }
  if (d.F !== 0) { value *= Math.pow(1 / registry[baseF].toSI, d.F); (d.F > 0 ? num : den).push(formatUnitPower(baseF, Math.abs(d.F))); }
  if (d.T !== 0) { value *= Math.pow(1 / registry[baseT].toSI, d.T); (d.T > 0 ? num : den).push(formatUnitPower(baseT, Math.abs(d.T))); }
  const unit = den.length ? `${num.join("·") || "1"}/${den.join("·")}` : (num.join("·") || "1");
  return { value, unit };
}

export function formatText(dq: DisplayQty): string {
  const v = Number.isFinite(dq.value)
    ? (Math.abs(dq.value) >= 1e6 || Math.abs(dq.value) < 1e-3 ? dq.value.toExponential(3) : dq.value.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, ""))
    : String(dq.value);
  return dq.unit ? `${v} ${dq.unit}` : `${v}`;
}

export function formatLatex(dq: DisplayQty): string {
  // Minimal: same as text but with spaces as \,, superscripts
  const unit = dq.unit.replace(/\^([\-]?\d+)/g, "^{$1}").replace(/·/g, "\\cdot ");
  const v = Number.isFinite(dq.value)
    ? (Math.abs(dq.value) >= 1e6 || Math.abs(dq.value) < 1e-3 ? dq.value.toExponential(3) : dq.value.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, ""))
    : String(dq.value);
  return `${v}\\,\\mathrm{${unit}}`;
} 