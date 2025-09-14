import React from "react";

type Props = {
  onDelete?: () => void;
  onDuplicate?: () => void;
};

export default function Toolbar({ onDelete, onDuplicate }: Props) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        type="button"
        onClick={onDelete}
        style={{ padding: "4px 8px", border: "1px solid #4a4a4a", background: "#1f1f1f", color: "#efefef", cursor: "pointer", borderRadius: 4 }}
      >
        Delete
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        style={{ padding: "4px 8px", border: "1px solid #4a4a4a", background: "#1f1f1f", color: "#efefef", cursor: "pointer", borderRadius: 4 }}
      >
        Duplicate
      </button>
      <button
        type="button"
        disabled
        style={{ padding: "4px 8px", border: "1px solid #4a4a4a", background: "#2b2b2b", color: "#888", borderRadius: 4 }}
      >
        Change type
      </button>
    </div>
  );
} 