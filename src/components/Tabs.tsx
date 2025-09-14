import React from "react";

export type TabItem = { id: string; label: string };

type TabsProps = {
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  onDoubleClickTab?: (id: string) => void;
};

export default function Tabs({ tabs, active, onChange, onDoubleClickTab }: TabsProps) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", padding: "8px 12px", borderBottom: "1px solid #444", maxWidth: 1200, margin: "0 auto" }} role="tablist" aria-label="Frames">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.id)}
            onDoubleClick={() => onDoubleClickTab?.(t.id)}
            style={{
              padding: "6px 12px",
              border: "1px solid #4a4a4a",
              background: isActive ? "#2b2b2b" : "#1f1f1f",
              color: "#efefef",
              cursor: "pointer",
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.3)" : undefined,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
} 