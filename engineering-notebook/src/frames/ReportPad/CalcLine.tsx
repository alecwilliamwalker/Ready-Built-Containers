import React from "react";
import type { Line, Quantity } from "./model";
import { convertDisplay } from "./model";

type Props = {
  line: Line;
  onChange: (text: string) => void;
};

function formatQuantity(q?: Quantity): string {
  if (!q) return "";
  try {
    const { value, unit } = convertDisplay(q);
    const v = Number.isFinite(value) ? (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3 ? value.toExponential(3) : value.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, "")) : String(value);
    return unit ? `${v} ${unit}` : `${v}`;
  } catch { return ""; }
}

export default function CalcLine({ line, onChange }: Props) {
  const isDef = line.kind === "def";
  const isExpr = line.kind === "expr";
  const resultText = formatQuantity(line.result);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "start", padding: "4px 0" }}>
      <textarea
        value={line.text}
        onChange={(e) => onChange(e.target.value)}
        rows={1}
        style={{
          width: "100%",
          minHeight: 24,
          padding: 4,
          boxSizing: "border-box",
          background: "#1f1f1f",
          color: "#efefef",
          border: line.error ? "1px solid #cc3d3d" : "1px solid #4a4a4a",
          borderRadius: 4,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          resize: "vertical",
        }}
      />
      <div style={{ textAlign: "right", paddingTop: 6 }}>
        {line.error ? (
          <span style={{ color: "#f87171", fontSize: 12 }}>{line.error}</span>
        ) : isExpr ? (
          <span style={{ color: "#9ade7a", fontWeight: 600 }}>= {resultText}</span>
        ) : isDef ? (
          <span style={{ color: "#8aa0ff", opacity: 0.8 }}>{resultText}</span>
        ) : null}
      </div>
    </div>
  );
} 