import { useEffect, useState } from "react";

type Props = {
  addr: string;
  onJump?: (addr: string) => void;
};

export default function NameBox({ addr, onJump }: Props) {
  const [value, setValue] = useState(addr);

  useEffect(() => {
    setValue(addr);
  }, [addr]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onJump) {
      const trimmed = value.trim().toUpperCase();
      if (/^[A-Z]+[1-9][0-9]*$/.test(trimmed)) {
        onJump(trimmed);
      }
    }
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      style={{
        width: 80,
        height: 28,
        padding: 4,
        boxSizing: "border-box",
        background: "#fff",
        color: "#000",
        border: "1px solid #4a4a4a",
        outline: "none",
        textAlign: "center",
        fontWeight: 600,
      }}
    />
  );
}
  