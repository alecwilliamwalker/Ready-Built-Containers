import NameBox from "./NameBox";
import FormulaBar from "./FormulaBar";

type Props = {
  addr: string;
  formula: string;
  onFormulaChange: (next: string) => void;
  formulaRef: React.RefObject<HTMLInputElement> | React.MutableRefObject<HTMLInputElement | null>;
  onFormulaKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onJump?: (addr: string) => void;
  onSave?: () => void;
  onLoad?: () => void;
  onShowHotkeys?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  stickyInfo?: { kind: 'report'; boxId: string } | null;
  onStickyCommit?: () => void;
  onStickyCancel?: () => void;
};

export default function TopBar({ addr, formula, onFormulaChange, formulaRef, onFormulaKeyDown, onJump, onSave, onLoad, onShowHotkeys, onUndo, onRedo, canUndo, canRedo, stickyInfo, onStickyCommit, onStickyCancel }: Props) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #444", maxWidth: 1200, margin: "0 auto" }}>
      <NameBox addr={addr} onJump={onJump} />
      <FormulaBar ref={formulaRef} value={formula} onChange={onFormulaChange} onKeyDown={onFormulaKeyDown} stickyInfo={stickyInfo ?? undefined} onStickyCommit={onStickyCommit} onStickyCancel={onStickyCancel} />
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {onUndo && <button onClick={onUndo} disabled={canUndo === false} title="Undo (Ctrl+Z)" style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef", opacity: canUndo === false ? 0.5 : 1 }}>Undo</button>}
        {onRedo && <button onClick={onRedo} disabled={canRedo === false} title="Redo (Ctrl+Shift+Z)" style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef", opacity: canRedo === false ? 0.5 : 1 }}>Redo</button>}
        {onSave && <button onClick={onSave} style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef" }}>Save</button>}
        {onLoad && <button onClick={onLoad} style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef" }}>Load</button>}
        {onShowHotkeys && <button onClick={onShowHotkeys} title="Hotkeys and commands" style={{ padding: "4px 8px", border: "1px solid #444", background: "#1f1f1f", color: "#efefef" }}>Hotkeys</button>}
      </div>
    </div>
  );
}