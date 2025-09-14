import React, { forwardRef, useImperativeHandle, useRef, useEffect } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  stickyInfo?: { kind: 'report'; boxId: string } | null;
  onStickyCommit?: () => void;
  onStickyCancel?: () => void;
};

export type FormulaBarHandle = {
  insertAtCursor: (text: string) => void;
  getSelection: () => { start: number; end: number };
};

const FormulaBar = forwardRef<HTMLInputElement, Props>(({ value, onChange, onKeyDown, stickyInfo, onStickyCommit, onStickyCancel }, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  const insertAtCursor = (_text: string) => { /* unused imperative handle in current usage */ };

  const getSelection = () => ({ start: 0, end: 0 });

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (stickyInfo && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); onStickyCommit?.(); return;
    }
    if (stickyInfo && e.key === 'Escape') {
      e.preventDefault(); onStickyCancel?.(); return;
    }
    if (onKeyDown) onKeyDown(e);
  };

  useEffect(() => {
    // keep inputRef synced
  }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      {stickyInfo && (
        <span style={{ fontSize: 12, color: '#ddd', background: '#333', padding: '2px 6px', borderRadius: 4 }}>
          Editing: Report • {stickyInfo.boxId} <button onClick={onStickyCancel} style={{ marginLeft: 6, padding: '0 4px' }}>✕</button>
        </span>
      )}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flex: 1,
          height: 28,
          padding: 4,
          boxSizing: "border-box",
          background: "#ffffff",
          color: "#000000",
          border: "1px solid #4a4a4a",
          outline: "none",
        }}
      />
      {stickyInfo && (
        <button onClick={onStickyCommit} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef' }}>✔</button>
      )}
    </div>
  );
});

export default FormulaBar;