import React, { useEffect, useRef, useState } from "react";
import katex from "katex";
import type { CalcBoxModel } from "./types";
import * as InsertBridge from "../../referencing/insertTarget";
import { startDrag } from "./drag";
import { normalizeForParser } from "../../lib/text/normalize";

type Props = {
  box: CalcBoxModel;
  selected: boolean;
  onSelect: (id: string, e: React.PointerEvent<HTMLElement>) => void;
  onCommit: (id: string, raw: string) => void;
  onCancel: (id: string) => void;
  onEnterEdit: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  bringToFront: (id: string) => void;
  onResize: (id: string, w: number) => void;
  onFullWidth: (id: string) => void;
  onDragDelta?: (id: string, dx: number, dy: number) => void;
};

function CalcBox({ box, selected, onSelect, onCommit, onCancel, onEnterEdit, onMove, onDragEnd, bringToFront, onResize, onDragDelta }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(box.raw);
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  const committedRef = useRef(false);

  useEffect(() => { setDraft(box.raw); }, [box.raw]);
  // If we re-enter edit mode and a headless sticky target exists for this box, hydrate from it
  useEffect(() => {
    if (box.mode === 'edit') {
      const t = (InsertBridge as any).getInsertTarget?.();
      if (t && t.kind === 'report' && (t as any).boxId === box.id && typeof t.getText === 'function') {
        const text = t.getText();
        if (typeof text === 'string') setDraft(text);
      }
    }
  }, [box.mode, box.id]);
  useEffect(() => { if (box.mode === "edit") inputRef.current?.focus(); }, [box.mode]);
  useEffect(() => {
    if (box.mode === 'edit' && inputRef.current) {
      const el = inputRef.current;
      const target = {
        kind: 'report' as const,
        boxId: box.id,
        getText: () => el.value,
        setText: (next: string) => {
          setDraft(next);
          // Re-set same target to notify listeners after React applies value
          setTimeout(() => InsertBridge.setInsertTarget(target, { sticky: true }), 0);
        },
        getSelection: () => {
          const s = el.selectionStart ?? el.value.length; const e = el.selectionEnd ?? el.value.length; return { start: s, end: e };
        },
        setSelection: (sel: { start: number; end: number } | null) => { if (!sel) return; try { el.selectionStart = sel.start; el.selectionEnd = sel.end; } catch {} },
        commit: () => { if (el.value != null) onCommit(box.id, el.value); },
        cancel: () => onCancel(box.id),
        insert: (text: string) => {
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const next = el.value.slice(0, start) + text + el.value.slice(end);
          setDraft(next);
          setTimeout(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); }, 0);
          setTimeout(() => InsertBridge.setInsertTarget(target, { sticky: true }), 0);
        }
      };
      InsertBridge.setInsertTarget(target, { sticky: true });
      // Keep session alive across focus changes; on unmount/leave, promote to headless buffer target
      return () => {
        const headless = {
          kind: 'report' as const,
          boxId: box.id,
          getText: () => draftRef.current,
          setText: (next: string) => { draftRef.current = next; },
          getSelection: () => null,
          setSelection: () => {},
          commit: () => { const v = draftRef.current; if (typeof v === 'string') onCommit(box.id, v); },
          cancel: () => onCancel(box.id),
        };
        InsertBridge.setInsertTarget(headless, { sticky: true });
      };
    }
    // Not in edit mode; leave any existing sticky target in place so Formula Bar can keep editing
    return () => {};
  }, [box.mode]);

  const handlePointerDown: React.PointerEventHandler<HTMLElement> = (e) => {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) return;
    const detail = (e as any).detail as number | undefined;
    if (detail && detail >= 2) { e.stopPropagation(); onEnterEdit(box.id); return; }
    onSelect(box.id, e);
    if (box.mode === "edit") return;
    bringToFront(box.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const threshold = 3;
    let started = false;
    const onMoveWin = (ev: PointerEvent) => {
      const dx0 = Math.abs(ev.clientX - startX);
      const dy0 = Math.abs(ev.clientY - startY);
      if (!started && (dx0 > threshold || dy0 > threshold)) {
        started = true;
      }
      if (!started) return;
      if (onDragDelta) {
        onDragDelta(box.id, ev.clientX - startX, ev.clientY - startY);
      } else {
        const nx = Math.round((box.x + (ev.clientX - startX)) / 8) * 8;
        const ny = Math.round((box.y + (ev.clientY - startY)) / 8) * 8;
        onMove(box.id, nx, ny);
      }
    };
    const onUpWin = () => {
      window.removeEventListener('pointermove', onMoveWin as any);
      window.removeEventListener('pointerup', onUpWin as any);
      onDragEnd(box.id);
    };
    window.addEventListener('pointermove', onMoveWin as any);
    window.addEventListener('pointerup', onUpWin as any);
  };

  const onInputKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = draft;
      committedRef.current = true;
      // Defer commit to after blur so we have a single, unified pathway
      // Manually blur to trigger onBlur handler exactly once
      window.requestAnimationFrame(() => {
        inputRef.current?.blur();
        onCommit(box.id, v);
      });
    }
    else if (e.key === "Escape") { e.preventDefault(); onCancel(box.id); }
  };

  const onRenderKeyDown: React.KeyboardEventHandler<HTMLElement> = (e) => {
    if (e.key === "Enter") { e.preventDefault(); onEnterEdit(box.id); }
  };

  const onResizePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startW = box.w ?? 200;
    startDrag(e.nativeEvent, (dx) => {
      const nextW = Math.max(200, Math.min(1000, startW + dx));
      onResize(box.id, nextW);
    }, () => {});
  };

  const className = `calc-box ${box.mode}${selected ? " selected" : ""}`;
  const style: React.CSSProperties = { left: box.x, top: box.y, ['--w' as any]: box.w ? `${box.w}px` : undefined, zIndex: box.z };

  return (
    <div className={className} style={style} onPointerDown={box.mode === 'render' ? handlePointerDown : undefined} data-id={box.id}>
      {box.mode === "edit" ? (
        <input
          ref={inputRef}
          className="calc-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text/plain');
            if (pasted != null) {
              e.preventDefault();
              const el = inputRef.current;
              if (!el) return;
              const start = el.selectionStart ?? draft.length;
              const end = el.selectionEnd ?? draft.length;
              const ins = normalizeForParser(pasted);
              const next = draft.slice(0, start) + ins + draft.slice(end);
              setDraft(next);
              setTimeout(() => { try { el.selectionStart = el.selectionEnd = start + ins.length; } catch {} }, 0);
            }
          }}
          onKeyDown={onInputKeyDown}
          onBlur={() => {
            // Do not auto-commit on blur; keep edit session active via sticky InsertTarget
            committedRef.current = false;
          }}
          placeholder={box.renderAsMath ? (box.src ? box.src : "Type raw expression…") : undefined}
        />
      ) : (
        <div
          className="calc-render"
          onDoubleClick={(e) => { e.stopPropagation(); onEnterEdit(box.id); }}
          onKeyDown={onRenderKeyDown}
          tabIndex={0}
          style={{ outline: 'none', padding: '4px 6px', minHeight: 32, display: 'inline-block', userSelect: 'none', position: 'relative' }}
          onPointerDown={handlePointerDown}
        >
          {true ? (
            <span
              ref={(el) => {
                if (!el) return;
                try {
                  const buildUnitToken = (tok: string): string => {
                    const m = /^([A-Za-z]+)(?:\^(-?\d+))?$/.exec(tok.trim());
                    if (!m) return `\\mathrm{${tok}}`;
                    const base = `\\mathrm{${m[1]}}`;
                    const exp = m[2] ? `^{${m[2]}}` : '';
                    return `${base}${exp}`;
                  };
                  const buildUnitSide = (side: string): string => {
                    // Split tokens (allow hyphen or dot for composite names like kip-ft if needed)
                    const parts = side.split(/[\u00B7\.-]/g).map(s => s.trim()).filter(Boolean);
                    return parts.map(buildUnitToken).join(' \\cdot ');
                  };
                  const buildUnitTex = (u: string): string => {
                    if (!u) return '';
                    const slash = u.indexOf('/');
                    if (slash >= 0) {
                      const num = u.slice(0, slash);
                      const den = u.slice(slash + 1);
                      return `\\frac{${buildUnitSide(num)}}{${buildUnitSide(den)}}`;
                    }
                    return buildUnitSide(u);
                  };
                  const toTeXName = (name: string) => {
                    if (!name) return name;
                    return name.length > 1 ? `${name[0]}_{${name.slice(1)}}` : name;
                  };
                   const buildTeX = (): string => {
                    // Build TeX from src when in render mode; avoid using TeX in edit mode
                    if (box.mode === 'render' && box.renderAsMath && box.src) {
                      // Reuse simple TeX builder for definitions/text fallback
                      // This path keeps TeX generation at render-time only
                      // More robust TeX is already produced upstream when committing
                      const s = box.src;
                      const def = /^\s*([A-Za-z][A-Za-z0-9_']*)\s*=\s*(.+?)\s*$/.exec(s);
                      if (def) {
                        const name = def[1];
                        const rhsRaw = def[2];
                        return `${name} = ${rhsRaw}`.replace(/\*/g, ' \\cdot ');
                      }
                      return s.replace(/\*/g, ' \\cdot ');
                    }
                    // Variable definition: Name = value [unit]
                    const def = /^\s*([A-Za-z][A-Za-z0-9_']*)\s*=\s*(.+?)\s*$/.exec(box.raw);
                    if (def) {
                      const name = toTeXName(def[1]);
                      const rhsRaw = def[2];
                      // Try to split RHS into number and unit, allowing no-space (e.g., .82kip/ft)
                      const numUnit = /^\s*([-+]?((?:\d+\.\d+)|(?:\d+\.)|(?:\.\d+)|(?:\d+)))(?:\s*([A-Za-z][A-Za-z0-9]*(?:[\u00B7·\.-][A-Za-z][A-Za-z0-9]*)*(?:\/[A-Za-z][A-Za-z0-9]*(?:[\u00B7·\.-][A-Za-z][A-Za-z0-9]*)*)?(?:\^-?\d+)?))?\s*$/.exec(rhsRaw);
                      let val = rhsRaw.trim();
                      let unit = '';
                      if (numUnit) {
                        val = numUnit[1];
                        unit = (numUnit[3] || '').trim();
                      } else {
                        // Fallback: split on first whitespace
                        const parts = /^([^\s]+)\s*(.*)$/.exec(rhsRaw.trim());
                        if (parts) { val = parts[1]; unit = (parts[2] || '').trim(); }
                      }
                      const unitTex = unit ? buildUnitTex(unit.replace(/\s+/g, '')) : '';
                      return unitTex ? `${name} = ${val}\\,${unitTex}` : `${name} = ${val}`;
                    }
                    // Text: render with \text{...} and escape braces/backslashes/dollars
                    const esc = box.raw
                      .replace(/\\/g, "\\\\")
                      .replace(/\{/g, "\\{")
                      .replace(/\}/g, "\\}")
                      .replace(/\$/g, "\\$");
                    return `\\text{${esc}}`;
                  };
                  const tex = buildTeX();
                  try {
                    katex.render(tex, el, { throwOnError: false, displayMode: false });
                  } catch {
                    const esc = box.raw.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
                    katex.render(`\\text{${esc}}`, el, { throwOnError: false, displayMode: false });
                  }
                } catch {
                  try {
                    const esc = box.raw.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
                    katex.render(`\\text{${esc}}`, el, { throwOnError: false, displayMode: false });
                  } catch {}
                }
              }}
              style={{ display: 'inline-block', minHeight: 24, pointerEvents: 'none' }}
              onDoubleClick={(e) => { e.stopPropagation(); onEnterEdit(box.id); }}
              onPointerDown={handlePointerDown}
            />
          ) : null}
          {box.mode === 'render' && box.resultText && (
            <span className="result-chip" style={{ marginLeft: 8, opacity: 0.9 }}>
              = {box.resultText}
            </span>
          )}
          {/* Interaction overlay is only active in render mode; disabled in edit mode for text selection */}
          {box.mode === 'render' && (
            <div
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 3, background: 'transparent', pointerEvents: 'auto' }}
              onPointerDown={handlePointerDown}
              onDoubleClick={(e) => { e.stopPropagation(); onEnterEdit(box.id); }}
            />
          )}
        </div>
      )}
      <div className="resize-handle" onPointerDown={onResizePointerDown} />
    </div>
  );
}

export default CalcBox;