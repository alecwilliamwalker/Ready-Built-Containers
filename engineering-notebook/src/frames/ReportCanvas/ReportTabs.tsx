import React, { useEffect, useState } from "react";
import ReportCanvas from "./ReportCanvas";

type Props = {
  getCellDisplay: (r: number, c: number) => string;
};

const STORAGE_BASE = "reportCanvas";
const DOCS_KEY = `${STORAGE_BASE}:docs`;
const TABS_KEY = `${STORAGE_BASE}:tabs`;

function docKey(id: string) {
  return `${STORAGE_BASE}:doc:${id}`;
}

function loadDocsList(): string[] {
  try {
    const raw = localStorage.getItem(DOCS_KEY);
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) return a.map(String);
    }
  } catch {}
  return [];
}

function saveDocsList(ids: string[]) {
  try {
    localStorage.setItem(DOCS_KEY, JSON.stringify(ids));
  } catch {}
}

function loadTabs(): string[] {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (raw) {
      const a = JSON.parse(raw);
      if (Array.isArray(a)) return a.map(String);
    }
  } catch {}
  return [];
}

function saveTabs(tabs: string[]) {
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch {}
}

function generateUniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 1;
  // Find next available suffix
  while (existing.has(`${base} ${i}`)) i += 1;
  return `${base} ${i}`;
}

export default function ReportTabs({ getCellDisplay }: Props) {
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>("");

  // Initialize tabs from saved tabs list or from docs list fallback
  useEffect(() => {
    const savedTabs = loadTabs();
    const docs = loadDocsList();
    const initial = savedTabs.length > 0 ? savedTabs : (docs.length > 0 ? docs : ["Sheet 1"]);
    const unique = Array.from(new Set(initial));
    setTabs(unique);
    setActive(unique[0]);
    if (savedTabs.length === 0) saveTabs(unique);
  }, []);

  useEffect(() => {
    if (tabs.length === 0) {
      const next = ["Sheet 1"];
      setTabs(next);
      setActive(next[0]);
      saveTabs(next);
      return;
    }
    saveTabs(tabs);
  }, [tabs]);

  const onAdd = () => {
    const existing = new Set(tabs);
    const name = generateUniqueName("Sheet", existing);
    const nextTabs = [...tabs, name];
    setTabs(nextTabs);
    setActive(name);
    // Ensure docs list includes it; no content yet
    const docs = new Set(loadDocsList());
    docs.add(name);
    saveDocsList(Array.from(docs));
  };

  const onDelete = (name: string) => {
    const idx = tabs.indexOf(name);
    if (idx === -1) return;
    const nextTabs = tabs.filter((t) => t !== name);
    setTabs(nextTabs);
    if (active === name) {
      setActive(nextTabs[ Math.max(0, idx - 1) ] || "");
    }
    // Remove from docs list and delete stored document
    try {
      const docs = new Set(loadDocsList());
      docs.delete(name);
      saveDocsList(Array.from(docs));
      localStorage.removeItem(docKey(name));
    } catch {}
  };

  return (
    <div className="report-tabs" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="tab-bar" style={{ display: "flex", alignItems: "center", gap: 6, padding: 6 }}>
        {tabs.map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setActive(t)}
              className={t === active ? "tab-active" : ""}
              style={{ padding: "4px 8px", border: "1px solid #444", background: t === active ? "#2b2b2b" : "#1f1f1f", color: "#efefef" }}
              title={t}
            >
              {t}
            </button>
            <button
              onClick={() => onDelete(t)}
              title={`Delete ${t}`}
              style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef" }}
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={onAdd} title="Add sheet" style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef" }}>＋ Add Sheet</button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }} />
    </div>
  );
}


