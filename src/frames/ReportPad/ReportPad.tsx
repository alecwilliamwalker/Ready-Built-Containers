import React, { useEffect, useRef, useState } from "react";
import type { Doc, Line } from "./model";
import { recompute, convertDisplay } from "./model";
import { parseAddress } from "../../referencing/a1";
import { parse as parseUnified, classifyInput } from "../../unified_parser";

type Props = {
  getCellDisplay: (r: number, c: number) => string;
};

function createId(): string {
  return `ln_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeEmptyDoc(): Doc {
  return { lines: [{ id: createId(), text: "", kind: "text" }] as any };
}

function extractRawTextFromParagraph(p: HTMLElement): string {
  const clone = p.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("span.result-chip").forEach((el) => el.remove());
  return clone.textContent ?? "";
}

function formatResultText(line: Line): string {
  if (!line.result) return "";
  try {
    const { value, unit } = convertDisplay(line.result);
    const v = Number.isFinite(value)
      ? Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3
        ? value.toExponential(3)
        : value.toFixed(3).replace(/\.0+$/, "").replace(/\.$/, "")
      : String(value);
    return `${v}${unit ? " " : ""}${unit ?? ""}`;
  } catch {
    return "";
  }
}

export default function ReportPad({ getCellDisplay }: Props) {
  const [doc, setDoc] = useState<Doc>(makeEmptyDoc());
  const padRef = useRef<HTMLDivElement | null>(null);

  const recomputeDoc = (d: Doc): Doc => recompute(d, getCellDisplay, (a1) => parseAddress(a1));

  // On mount: ensure at least one paragraph exists
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    if (!pad.firstElementChild) {
      const p = document.createElement("div");
      p.setAttribute("data-id", doc.lines[0].id);
      p.innerHTML = "";
      pad.appendChild(p);
    }
    // Initial compute
    setDoc((prev) => recomputeDoc(prev));
  }, []);

  // Decorate paragraphs with result chip and error state without touching main text
  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    const paras = Array.from(pad.children) as HTMLElement[];
    paras.forEach((pEl, idx) => {
      const line = doc.lines[idx];
      if (!line) return;
      if (!pEl.getAttribute("data-id")) pEl.setAttribute("data-id", line.id);
      // Remove any prior chip
      pEl.querySelectorAll("span.result-chip").forEach((el) => el.remove());
      // Compute base display text for the paragraph without chips
      const rawBase = extractRawTextFromParagraph(pEl);
      const def = tryParseDef(rawBase);
      const baseText = def ? `${def.name} = ${def.rhs}` : trimTrailingEquals(rawBase);
      if (pEl.textContent?.trim() !== baseText.trim()) {
        // Replace only textContent to avoid disrupting caret structure much
        pEl.textContent = baseText;
      }
      if (line.result && (line.kind === "def" || line.kind === "expr")) {
        const chip = document.createElement("span");
        chip.className = "result-chip";
        chip.textContent = `= ${formatResultText(line)}`;
        pEl.appendChild(document.createTextNode(" "));
        pEl.appendChild(chip);
      }
      if (line.error) pEl.setAttribute("data-error", line.error);
      else pEl.removeAttribute("data-error");
    });
  }, [doc]);

  // Commit a given paragraph element into doc and recompute
  const commitParagraph = (pEl: HTMLElement) => {
    const id = pEl.getAttribute("data-id");
    // If no id, create one and insert a new doc line at the correct index
    const pad = padRef.current!;
    const paras = Array.from(pad.children) as HTMLElement[];
    const idx = paras.indexOf(pEl);
    setDoc((prev) => {
      const next: Doc = { lines: [...prev.lines] } as any;
      let lineId = id;
      if (!lineId) {
        lineId = createId();
        pEl.setAttribute("data-id", lineId);
        // Insert new line at index
        next.lines.splice(idx, 0, { id: lineId, text: "", kind: "text" } as any);
      }
      const raw = extractRawTextFromParagraph(pEl);
      if (next.lines[idx]) next.lines[idx] = { ...next.lines[idx], text: raw } as any;
      return recomputeDoc(next);
    });
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // Allow default to create new paragraph. After event, commit previous paragraph.
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        let node: Node | null = sel.anchorNode;
        // Find current paragraph element within pad
        let curr: HTMLElement | null = null;
        while (node) {
          if (node instanceof HTMLElement && padRef.current?.contains(node) && (node.parentElement === padRef.current)) {
            curr = node as HTMLElement;
            break;
          }
          node = node.parentNode;
        }
        if (!curr) return;
        // Previous paragraph to commit
        let prev = curr.previousElementSibling as HTMLElement | null;
        if (prev) commitParagraph(prev);
        // Ensure current has an id and an associated doc line
        commitParagraph(curr);
      }, 0);
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (!padRef.current?.contains(target)) return;
    if (target.parentElement === padRef.current) {
      commitParagraph(target);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div
        ref={padRef}
        className="pad"
        contentEditable
        spellCheck={false}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
} 