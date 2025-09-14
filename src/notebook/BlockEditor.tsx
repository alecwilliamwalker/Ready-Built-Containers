import React from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export default function BlockEditor({ value, onChange, placeholder }: Props) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        minHeight: 80,
        padding: 8,
        boxSizing: "border-box",
        background: "#1f1f1f",
        color: "#efefef",
        border: "1px solid #4a4a4a",
        borderRadius: 4,
        resize: "vertical",
      }}
    />
  );
} 