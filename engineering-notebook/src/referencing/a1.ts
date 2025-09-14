export function indexToCol(n: number) {
  let s = ""; n += 1;
  while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

export function colLabelToIndex(label: string): number {
  let result = 0;
  for (let i = 0; i < label.length; i += 1) {
    const code = label.charCodeAt(i);
    if (code < 65 || code > 90) return -1; // not A-Z
    result = result * 26 + (code - 64);
  }
  return result - 1;
}

export function parseAddress(addr: string): { r: number; c: number } | null {
  const trimmed = addr.trim().toUpperCase();
  const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(trimmed);
  if (!match) return null;
  const colPart = match[1];
  const rowPart = match[2];
  const c = colLabelToIndex(colPart);
  const r = parseInt(rowPart, 10) - 1;
  if (c < 0 || r < 0) return null;
  return { r, c };
} 