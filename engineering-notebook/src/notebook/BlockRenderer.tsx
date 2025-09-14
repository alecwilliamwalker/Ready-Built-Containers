import React from "react";

type Props = { text: string; getCellDisplay?: (r: number, c: number) => string };

// function indexToCol(n: number) {
//   let s = ""; n += 1;
//   while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
//   return s;
// }

function colLabelToIndex(label: string): number {
  let result = 0;
  for (let i = 0; i < label.length; i += 1) {
    const code = label.charCodeAt(i);
    if (code < 65 || code > 90) return -1;
    result = result * 26 + (code - 64);
  }
  return result - 1;
}

// Find cell refs like A1, AA10 in the text
function findCellRefs(input: string): Array<{ start: number; end: number; r: number; c: number; label: string }> {
  const results: Array<{ start: number; end: number; r: number; c: number; label: string }> = [];
  const regex = /\b([A-Z]+)([1-9][0-9]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(input)) !== null) {
    const col = m[1];
    const row = m[2];
    const c = colLabelToIndex(col);
    const r = parseInt(row, 10) - 1;
    if (c >= 0 && r >= 0) {
      results.push({ start: m.index, end: m.index + m[0].length, r, c, label: `${col}${row}` });
    }
  }
  return results;
}

export default function BlockRenderer({ text, getCellDisplay }: Props) {
  const refs = findCellRefs(text);
  if (refs.length === 0) {
    return (
      <div
        style={{
          whiteSpace: "pre-wrap",
          background: "#262626",
          color: "#efefef",
          border: "1px solid #4a4a4a",
          borderRadius: 4,
          padding: 8,
        }}
      >
        {text}
      </div>
    );
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  refs.forEach((ref, idx) => {
    if (ref.start > cursor) {
      parts.push(text.slice(cursor, ref.start));
    }
    const value = getCellDisplay ? getCellDisplay(ref.r, ref.c) : "";
    parts.push(
      <span key={`ref-${idx}`} className="cell-ref" title={`${ref.label} = ${value}`} style={{ textDecoration: "underline dotted" }}>
        {ref.label}
      </span>
    );
    cursor = ref.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));

  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        background: "#262626",
        color: "#efefef",
        border: "1px solid #4a4a4a",
        borderRadius: 4,
        padding: 8,
      }}
    >
      {parts}
    </div>
  );
} 