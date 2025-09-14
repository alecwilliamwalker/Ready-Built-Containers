export type A1Ref = { start: number; end: number; label: string; r: number; c: number };

function colLabelToIndex(label: string): number {
  let result = 0;
  for (let i = 0; i < label.length; i += 1) {
    const code = label.charCodeAt(i);
    if (code < 65 || code > 90) return -1;
    result = result * 26 + (code - 64);
  }
  return result - 1;
}

export function a1ToRC(label: string): { r: number; c: number } | null {
  const m = /^([A-Z]+)([1-9][0-9]*)$/.exec(label.trim().toUpperCase());
  if (!m) return null;
  const c = colLabelToIndex(m[1]);
  const r = parseInt(m[2], 10) - 1;
  if (r < 0 || c < 0) return null;
  return { r, c };
}

export function findCellRefs(input: string): A1Ref[] {
  const out: A1Ref[] = [];
  const re = /\b([A-Z]+)([1-9][0-9]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const col = m[1];
    const row = m[2];
    const c = colLabelToIndex(col);
    const r = parseInt(row, 10) - 1;
    if (r >= 0 && c >= 0) {
      out.push({ start: m.index, end: m.index + m[0].length, label: `${col}${row}`, r, c });
    }
  }
  return out;
} 