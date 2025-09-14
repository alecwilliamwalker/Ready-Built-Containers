export type ClassifyResult = {
  kind: "def" | "expr" | "text";
  name?: string;
  rhs?: string;
  trimmed: string;
};

/** Trim a single optional trailing '=' from the raw line. */
export function trimTrailingEquals(raw: string): string {
  return raw.replace(/\s*=\s*$/, "");
}

/** Detect definition lines and normalize RHS by trimming a trailing '=' if present. */
export function tryParseDef(raw: string): { name: string; rhs: string } | null {
  const line = trimTrailingEquals(raw);
  // Allow primes/apostrophes in variable names (e.g., Fc', f'y), and underscores/digits
  const m = /^\s*([A-Za-z][A-Za-z0-9_']*)\s*=\s*(.+?)\s*$/.exec(line);
  if (!m) return null;
  const name = m[1];
  let rhs = m[2].replace(/\s*=\s*$/, "").trim();
  return { name, rhs };
}

/** Classify by def first; expr/text resolution should be done by caller using parser. */
export function classifyBasic(raw: string): ClassifyResult {
  const trimmed = trimTrailingEquals(raw);
  const def = tryParseDef(trimmed);
  if (def) return { kind: "def", name: def.name, rhs: def.rhs, trimmed };
  // Unknown here: caller should attempt parse for expr, else text
  return { kind: "text", trimmed };
} 