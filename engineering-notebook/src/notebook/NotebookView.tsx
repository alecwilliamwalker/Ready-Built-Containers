import React, { useMemo, useState, useEffect } from "react";
import type { NotebookDoc, NotebookBlock } from "./notebookTypes";
import BlockEditor from "./BlockEditor";
import BlockRenderer from "./BlockRenderer";

type Props = {
  getCellDisplay?: (r: number, c: number) => string;
};

const STORAGE_KEY = "notebook:v1";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try { return (crypto as any).randomUUID(); } catch {}
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function NotebookView({ getCellDisplay }: Props) {
  const [doc, setDoc] = useState<NotebookDoc>({ blocks: [] });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NotebookDoc;
        if (parsed && Array.isArray(parsed.blocks)) {
          setDoc({ blocks: parsed.blocks.map((b) => ({ id: String(b.id), kind: b.kind === "math" ? "math" : "text", text: String(b.text ?? ""), collapsed: Boolean(b.collapsed) })) });
        }
      }
    } catch {
      // ignore parse/load errors
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch {
      // ignore write errors
    }
  }, [doc]);

  const addTextBlock = () => {
    const newBlock: NotebookBlock = { id: createId(), kind: "text", text: "" };
    setDoc((prev) => ({ blocks: [...prev.blocks, newBlock] }));
  };

  const deleteBlock = (id: string) => {
    setDoc((prev) => ({ blocks: prev.blocks.filter((b) => b.id !== id) }));
  };

  const updateBlockText = (id: string, next: string) => {
    setDoc((prev) => ({
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, text: next } : b)),
    }));
  };

  return (
    <div style={{ maxWidth: 1200, margin: "1rem auto", padding: "0 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Notebook</h2>
        <button
          type="button"
          onClick={addTextBlock}
          style={{
            padding: "6px 12px",
            border: "1px solid #4a4a4a",
            background: "#1f1f1f",
            color: "#efefef",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          + Text Block
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {doc.blocks.map((block) => (
          <div key={block.id} style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid #333", borderRadius: 6, padding: 12, background: "#1b1b1b", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ opacity: 0.9 }}>{block.kind === "text" ? "Text" : "Math"} Block</strong>
              <button
                type="button"
                onClick={() => deleteBlock(block.id)}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #4a4a4a",
                  background: "#1f1f1f",
                  color: "#efefef",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
              >
                Delete
              </button>
            </div>

            <BlockEditor
              value={block.text}
              onChange={(next) => updateBlockText(block.id, next)}
              placeholder={block.kind === "text" ? "Type text..." : "Type math..."}
            />

            <BlockRenderer text={block.text} getCellDisplay={getCellDisplay} />
          </div>
        ))}
      </div>
    </div>
  );
} 