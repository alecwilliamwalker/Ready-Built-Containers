export { evaluate } from './eval';
export type { Grid } from './eval';

export type UnitDim = [number, number, number, number, number, number, number]; // M, L, T, I, Theta, N, J

export type Quantity = { value: number; unit?: string };

type UnitDef = { name: string; dim: UnitDim; factor: number };

const registry = new Map<string, UnitDef>();

function define(name: string, dim: UnitDim, factor: number) {
  registry.set(name, { name, dim, factor });
}

// Basic length/force/pressure examples (placeholder)
define("in", [0, 1, 0, 0, 0, 0, 0], 0.0254);
define("ft", [0, 1, 0, 0, 0, 0, 0], 0.3048);
define("mm", [0, 1, 0, 0, 0, 0, 0], 0.001);

define("N", [1, 1, -2, 0, 0, 0, 0], 1);
define("kN", [1, 1, -2, 0, 0, 0, 0], 1000);
define("lb", [1, 1, -2, 0, 0, 0, 0], 4.4482216153);
define("kip", [1, 1, -2, 0, 0, 0, 0], 4448.2216153);

define("psi", [1, -1, -2, 0, 0, 0, 0], 6894.75729);
define("ksi", [1, -1, -2, 0, 0, 0, 0], 6894757.29);

export function convert(value: number, from: string, to: string): number {
  const f = registry.get(from);
  const t = registry.get(to);
  if (!f || !t) throw new Error("Unknown unit");
  // Require identical dimensions (placeholder)
  if (JSON.stringify(f.dim) !== JSON.stringify(t.dim)) throw new Error("Incompatible units");
  // Convert to SI via factor, then to target
  const si = value * f.factor;
  return si / t.factor;
}
