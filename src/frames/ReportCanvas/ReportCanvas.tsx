import React, { useEffect, useRef, useState } from "react";
import CalcBox from "./CalcBox";
import * as InsertBridge from "../../referencing/insertTarget";
import type { CalcBoxModel } from "./types";
import { classifyLine, recompute as recomputePad } from "../ReportPad/model";
import { computeBoxes } from "./compute";
import { parseAddress } from "../../referencing/a1";
// import katex from 'katex';
import type { HistoryProxy } from "../../history/proxy";
import { EditBoxCommand } from "../../history/commands/report/EditBoxCommand";
import { normalizeForParser, collapseDuplicateUnits } from "../../lib/text/normalize";
import { parse as parseUnified, evaluate as evaluateUnified, formatQuantity, classifyInput } from "../../unified_parser";
import { plainToTeX } from "../../math/tex";

 function createId(): string { return `bx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
const STORAGE_BASE = 'reportCanvas';

function docKey(id: string) { return `${STORAGE_BASE}:doc:${id}`; }

type Props = {
  getCellDisplay: (r: number, c: number) => string;
  // Required stable document identity. The component will load/save under this id.
  docId: string;
  onActiveEditChange?: (payload: { source: 'report'|'sheet'; value: string } | null) => void;
  reportHotkeys?: { selectTool?: string; addTool?: string };
  history: HistoryProxy;
  bindBoxesAccessor: (get: () => CalcBoxModel[], set: (next: CalcBoxModel[] | ((prev: CalcBoxModel[]) => CalcBoxModel[])) => void) => void;
};

export default function ReportCanvas({ getCellDisplay, docId, onActiveEditChange, reportHotkeys, history, bindBoxesAccessor }: Props) {
  // eslint-disable-next-line no-console
  console.log('[BOOT] ReportCanvas: render for docId', docId);
  const [boxes, setBoxes] = useState<CalcBoxModel[]>([]);
  const boxesRef = useRef<CalcBoxModel[]>(boxes);
  useEffect(() => { boxesRef.current = boxes; }, [boxes]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [zTop, setZTop] = useState(1);
  const dragSnapshotRef = useRef<null | { ids: Set<string>; start: Map<string, { x: number; y: number }>; before?: CalcBoxModel[] }>(null);
  const marqueeRef = useRef<null | { startX: number; startY: number; el: HTMLDivElement }>(null);
  const spaceHeldRef = useRef(false);
  const [tool, setTool] = useState<'create' | 'select'>('select');
  // Helper for global hotkeys: add a box at viewport center when 'a' is pressed
  const addBoxAtCenter = () => {
    const canvas = surfaceRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = canvas.scrollLeft + Math.max(0, rect.width / 2 - 100);
    const y = canvas.scrollTop + Math.max(0, rect.height / 2 - 20);
    addBoxAt(x, y);
  };
  const saveTimeoutRef = useRef<number | null>(null);
  // const resizingTimerRef = useRef<number | null>(null);
  // const lastResizeIdRef = useRef<string | null>(null);
  // When the browser performs native history on a focused editable, suppress our custom history in that tick
  const nativeHistoryTickRef = useRef(false);

  const isEditableTarget = (t: EventTarget | null): boolean => {
    const el = t as HTMLElement | null;
    if (!el) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    let p = el.parentElement;
    for (let i = 0; i < 3 && p; i += 1, p = p.parentElement) {
      if (p.isContentEditable) return true;
      const tg = p.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA') return true;
    }
    return false;
  };

  // const cloneBoxes = (arr: CalcBoxModel[]): CalcBoxModel[] => arr.map((b) => ({ ...b }));
  // bind boxes accessor to shared history ctx (uses refs to avoid stale closures)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[BOOT] ReportCanvas: bindBoxesAccessor');
    bindBoxesAccessor(
      () => boxesRef.current,
      (next: any) => {
        const prev = boxesRef.current;
        const computed = typeof next === 'function' ? next(prev) : next;
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.trace('[REPORT] setBoxes', { action: 'ctx.setBoxes', prevLen: prev.length, nextLen: computed?.length ?? -1, ids: Array.isArray(computed) ? computed.map((b: any) => b.id) : [] });
          if (Array.isArray(computed) && computed.length === 0 && prev.length > 0) {
            // Guard against accidental mass-delete during debugging
            // eslint-disable-next-line no-console
            console.error('[REPORT] Prevented mass-delete (next empty). Returning prev snapshot.');
            return;
          }
        }
        // Always recompute derived fields (resultText/error/TeX) after any history-driven mutation
        setBoxes(computeBoxes(computed, getCellDisplay));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // all undo/redo now goes through shared history

  const isEditing = (id: string) => boxes.find((b) => b.id === id)?.mode === "edit";
  const anyEditing = () => Array.from(selectedIds).some((id) => isEditing(id));

  // Track space key state for marquee mode (acts as momentary select tool)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeldRef.current = true; } };
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') { spaceHeldRef.current = false; } };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  const bringToFront = (id: string) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, z: zTop + 1 } : b)));
    setZTop((z) => z + 1);
  };

  const addBoxAt = (x: number, y: number) => {
    const nx = Math.round(x / 8) * 8;
    const ny = Math.round(y / 8) * 8;
    const b: CalcBoxModel = { id: createId(), x: nx, y: ny, z: zTop + 1, kind: "calc", mode: "edit", raw: "" };
    setZTop((z) => z + 1);
    if (history.isReady()) history.push(new EditBoxCommand((prev) => {
      return [...prev, b];
    }, 'add', new Set([b.id])));
    setSelectedIds(new Set([b.id]));
  };

  const recompute = (nextBoxes: CalcBoxModel[]) => computeBoxes(nextBoxes, getCellDisplay);

  function toTexFromRaw(raw: string): string {
    const s = raw.trim();
    // If it already looks like TeX (has \\command), return as-is
    if (/\\[a-zA-Z]+/.test(s)) return s;

    const formatIdent = (id: string): string => {
      const t = id.trim();
      const m = /^([A-Za-z])(.*)$/.exec(t);
      if (m && m[2]) return `${m[1]}_{${m[2]}}`;
      return t;
    };

    const decorateLeaf = (leaf: string): string => {
      const trimmed = leaf.trim();
      // turn simple identifier into base+subscript; keep numbers as-is
      if (/^[A-Za-z][A-Za-z0-9]*$/.test(trimmed)) return formatIdent(trimmed);
      // replace * with dot
      return trimmed.replace(/\*/g, ` \\cdot `);
    };

    const toTexExpr = (expr: string): string => {
      // Convert top-level a/b into \frac recursively respecting parentheses
      let depth = 0;
      for (let i = 0; i < expr.length; i += 1) {
        const ch = expr[i];
        if (ch === '(') depth += 1; else if (ch === ')') depth -= 1;
        else if (ch === '/' && depth === 0) {
          const left = expr.slice(0, i);
          const right = expr.slice(i + 1);
          return `\\frac{${toTexExpr(left)}}{${toTexExpr(right)}}`;
        }
      }
      return decorateLeaf(expr);
    };

    // Handle LHS = RHS (first '=')
    const eq = /^([^=]+?)=([^=]+)$/.exec(s);
    if (eq) {
      const lhs = formatIdent(eq[1].trim());
      const rhs = toTexExpr(eq[2].trim());
      return `${lhs} = ${rhs}`;
    }
    return toTexExpr(s);
  }

  // Helpers to render ReportPad AST (unit aware) into TeX
  const greek: Record<string, string> = { alpha:'\\alpha', beta:'\\beta', gamma:'\\gamma', delta:'\\delta', epsilon:'\\epsilon', zeta:'\\zeta', eta:'\\eta', theta:'\\theta', iota:'\\iota', kappa:'\\kappa', lambda:'\\lambda', mu:'\\mu', nu:'\\nu', xi:'\\xi', omicron:'o', pi:'\\pi', rho:'\\rho', sigma:'\\sigma', tau:'\\tau', upsilon:'\\upsilon', phi:'\\phi', chi:'\\chi', psi:'\\psi', omega:'\\omega' };
  // Known unit symbols to render in upright roman (not italics)
  const unitNames: Set<string> = new Set(['m','mm','in','ft','N','kN','lb','lbs','kip','Pa','kPa','MPa','GPa','psi','psf','ksi']);
  // const texName = (name: string): string => {
  //   const lower = name.trim().toLowerCase();
  //   if (greek[lower]) return greek[lower];
  //   if (unitNames.has(name)) return `\\mathrm{${name}}`;
  //   if ([ 'sin','cos','tan','ln','log' ].includes(lower)) return `\\${lower}`;
  //   if (name.length > 1) return `${name[0]}_{${name.slice(1)}}`;
  //   return name;
  // };

  // remove legacy TeX helpers; TeX is built centrally from the unified pipeline now

  // Number formatting to prevent float noise
  function formatNumber(n: number, opts?: { sig?: number; epsilon?: number }): string {
    const sig = opts?.sig ?? 6;
    const eps = opts?.epsilon ?? 1e-10;
    const z = Math.abs(n) < eps ? 0 : n;
    const s = Number(z).toPrecision(sig);
    // trim trailing zeros and dot
    const t = s.replace(/\.0+($|e)/i, '$1').replace(/(\.[0-9]*[1-9])0+($|e)/i, '$1$2');
    // normalize -0
    return t === '-0' ? '0' : t;
  }
  // function formatQuantity(q: any): string { return formatNumber(q?.valueSI ?? 0); }

  // Build name->display map from current boxes using report pad evaluation
  // const buildNameDisplayMap = (...) => new Map<string, string>();

  // Build name -> Quantity map for substitution/evaluation
  // const buildNameQuantityMap = (...) => new Map<string, any>();

  // remove legacy Pad AST normalization flow

  // const dedupeConsecutive = (arr: string[]): string[] => arr.filter((s, i) => i === 0 || s !== arr[i - 1]);

  function regenerateMathBoxes(input: CalcBoxModel[]): CalcBoxModel[] {
    return input.map((b) => {
      if (!b.renderAsMath || !b.src) return b;
      try {
        const parsed = parseUnified(b.src);
        const formatted = parsed.kind === 'expression' || parsed.kind === 'assignment' ? (() => {
          try {
            const result = evaluateUnified(b.src);
            return formatQuantity(result);
          } catch {
            return b.src;
          }
        })() : b.src;
        const tex = plainToTeX(formatted);
        return { ...b, raw: tex };
      } catch { return b; }
    });
  }

  // Document API (load/save)
  const loadDoc = (id: string) => {
    try {
      const raw = localStorage.getItem(docKey(id));
      if (raw) {
        const parsed = JSON.parse(raw) as { boxes: Partial<CalcBoxModel>[] };
        if (parsed && Array.isArray(parsed.boxes)) {
          const loaded: CalcBoxModel[] = parsed.boxes.map((b) => ({
            id: String(b.id ?? createId()), x: Number(b.x ?? 0), y: Number(b.y ?? 0), z: Number(b.z ?? 1),
            kind: (b.kind as any) ?? 'calc', mode: 'render', raw: String(b.raw ?? ''),
            src: typeof (b as any).src === 'string' ? String((b as any).src) : undefined,
            renderAsMath: Boolean((b as any).renderAsMath),
            w: typeof b.w === 'number' ? b.w : undefined,
          }));
          setBoxes(recompute(loaded));
          const maxZ = loaded.reduce((m, bx) => Math.max(m, bx.z), 1); setZTop(maxZ + 1);
        } else {
          setBoxes([]); setZTop(1);
        }
      } else {
        setBoxes([]); setZTop(1);
      }
    } catch {
      setBoxes([]); setZTop(1);
    }
  };

  const saveDocWithBoxes = (id: string, boxesToPersist: CalcBoxModel[]) => {
    try {
      const toSave = boxesToPersist.map(({ id, x, y, z, kind, raw, src, renderAsMath, w }) => ({ id, x, y, z, kind, raw, src, renderAsMath, w }));
      localStorage.setItem(docKey(id), JSON.stringify({ boxes: toSave }));
    } catch {}
  };

  // const saveDoc = (id: string) => { saveDocWithBoxes(id, boxes); };

  const debouncedSave = (id: string, boxesSnapshot: CalcBoxModel[]) => {
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      saveDocWithBoxes(id, boxesSnapshot);
      saveTimeoutRef.current = null;
    }, 300);
  };

  // Load document on mount or when the doc id changes
  useEffect(() => {
    if (!docId) return;
    loadDoc(docId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  useEffect(() => {
    // Unit preferences functionality removed - using unified parser instead
    const unsub = () => {}; // No-op unsubscriber
    return () => { unsub(); };
  }, []);

  // Hotkeys for select/add tool when canvas is focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const focusWithin = surfaceRef.current && surfaceRef.current.contains(document.activeElement);
      if (!focusWithin) return;
      const selectKey = (reportHotkeys?.selectTool || 'v').toLowerCase();
      const addKey = (reportHotkeys?.addTool || 'a').toLowerCase();
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (e.key.toLowerCase() === selectKey) { e.preventDefault(); setTool('select'); }
        else if (e.key.toLowerCase() === addKey) { e.preventDefault(); setTool('create'); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportHotkeys]);

  const handleSurfacePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.target !== surfaceRef.current) return;
    const isAnyEditing = boxes.some((b) => b.mode === 'edit');
    // If an input is currently being edited, allow the click to blur the input
    // and do not start marquee or create interactions here.
    if (isAnyEditing) {
      // If a report input is being edited, let clicks elsewhere blur it only when not inserting.
      // If an insert target is active, keep the report input active so users can click on the sheet to insert refs.
      if (!InsertBridge.hasInsertTarget()) setSelectedIds(new Set());
      return;
    }
    e.preventDefault();
    const canvas = surfaceRef.current!;
    const rect = canvas.getBoundingClientRect();
    const useMarquee = tool === 'select' || spaceHeldRef.current;
    const startX = e.clientX - rect.left + canvas.scrollLeft;
    const startY = e.clientY - rect.top + canvas.scrollTop;
    let started = false;
    let el: HTMLDivElement | null = null;
    const threshold = 4;

    canvas.setPointerCapture?.(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const curX = ev.clientX - rect.left + canvas.scrollLeft;
      const curY = ev.clientY - rect.top + canvas.scrollTop;
      const dx = Math.abs(curX - startX);
      const dy = Math.abs(curY - startY);
      if (useMarquee) {
        if (!started && (dx > threshold || dy > threshold)) {
          el = document.createElement('div'); el.className = 'marquee'; el.style.left = `${startX}px`; el.style.top = `${startY}px`; el.style.width = '0px'; el.style.height = '0px';
          canvas.appendChild(el!); started = true; marqueeRef.current = { startX, startY, el };
        }
        if (started && el) {
          const x = Math.min(curX, startX); const y = Math.min(curY, startY);
          const w = Math.abs(curX - startX); const h = Math.abs(curY - startY);
          el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.width = `${w}px`; el.style.height = `${h}px`;
        }
      }
    };
    const finalize = () => {
      if (useMarquee && started && el) {
        const x = parseFloat(el.style.left); const y = parseFloat(el.style.top); const w = parseFloat(el.style.width); const h = parseFloat(el.style.height);
        const sel = new Set<string>();
        boxes.forEach((b) => {
          const bx = b.x; const by = b.y; const bw = (b.w ?? 200); const bh = 40;
          const overlaps = bx < x + w && bx + bw > x && by < y + h && by + bh > y;
          if (overlaps) sel.add(b.id);
        });
        setSelectedIds(sel);
        el.remove();
        marqueeRef.current = null;
      } else if (!useMarquee) {
        // Create mode: create a box on simple click
        addBoxAt(startX, startY);
      }
      // Do not force-convert edit box here; let input onBlur handle commit consistently
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove as any);
      window.removeEventListener('pointerup', onUp as any);
      window.removeEventListener('pointercancel', onCancel as any);
      finalize();
    };
    const onCancel = () => {
      window.removeEventListener('pointermove', onMove as any);
      window.removeEventListener('pointerup', onUp as any);
      window.removeEventListener('pointercancel', onCancel as any);
      if (el) { el.remove(); }
      marqueeRef.current = null;
    };
      window.addEventListener('pointermove', onMove as any);
      window.addEventListener('pointerup', onUp as any);
      window.addEventListener('pointercancel', onCancel as any);
  };

  const onBeforeInput: React.FormEventHandler<HTMLDivElement> = (e) => {
    const evt = e as unknown as InputEvent;
    const it = (evt && (evt as any).inputType) as string | undefined;
    if (it && (it === 'historyUndo' || it === 'historyRedo')) {
      nativeHistoryTickRef.current = true;
      queueMicrotask(() => { nativeHistoryTickRef.current = false; });
    }
  };

  const handleSurfaceDoubleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target !== surfaceRef.current) return;
    const canvas = surfaceRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft;
    const y = e.clientY - rect.top + canvas.scrollTop;
    addBoxAt(x, y);
  };

    const commit = (id: string, raw: string) => {
    const trimmed = collapseDuplicateUnits(raw.trim());
    const normalized = normalizeForParser(trimmed);
    if (trimmed === "") {
      setBoxes((prev) => {
        const next = prev.filter((b) => b.id !== id);
      // Save (debounced) after delete
      debouncedSave(docId, next);
        return next;
      });
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      return;
    }
    if (!history.isReady()) return;
    history.push(new EditBoxCommand((prev) => {
      const old = prev.find(b => b.id === id);
      const defParsed = parseUnified(normalized);
      const rhs = defParsed.kind === 'assignment' ? normalized.substring(normalized.indexOf('=') + 1).trim() : '';
      const hasEq = /=/.test(normalized);
      const hasFunc = /(sqrt|sin|cos|tan|ln|log)\s*\(/i.test(normalized);
      const hasMulDivPow = /[*/^]/.test(normalized);
      const hasParen = /[()]/.test(normalized);
      const hasCellRef = /\b[A-Z]+[1-9][0-9]*\b/.test(normalized);
      // Only treat + or - as math when near numbers or uppercase variable-style names
      const hasPlusMinusNumeric = /(?:\d|\))\s*[+\-]\s*(?:\d|[A-Z(])/.test(trimmed);
      const hasValidOp = hasFunc || hasMulDivPow || hasParen || hasCellRef || hasPlusMinusNumeric;
      // Consider a definition "simple" if RHS is a single number optionally followed by a unit spec
      const isSimpleDefinitionRhs = (s: string): boolean => {
        const unitToken = "[A-Za-z]+(?:\\^-?\\d+)?";
        const dotGroup = `${unitToken}(?:\\s*[\\u00B7·.]\\s*${unitToken})*`;
        const unitSpec = `${dotGroup}(?:\\s*\/\\s*${dotGroup})?`;
        const num = "[-+]?((?:\\d+\\.\\d+)|(?:\\d+\\.)|(?:\\.\\d+)|(?:\\d+))";
        const re = new RegExp(`^\\s*${num}(?:\\s*${unitSpec})?\\s*$`);
        return re.test(s);
      };
      const isSimpleDef = !!(defParsed && isSimpleDefinitionRhs(rhs));
      const isMath = (!isSimpleDef) && (!!old?.renderAsMath || hasEq || hasValidOp);
      const converted = isMath ? (() => {
        try {
          // Use the new robust parser that handles units correctly
          const parsed = parseUnified(normalized);
          const formatted = parsed.kind === 'expression' || parsed.kind === 'assignment' ? (() => {
            try {
              const result = evaluateUnified(normalized);
              return formatQuantity(result);
            } catch {
              return normalized;
            }
          })() : normalized;
          // Convert to TeX format for math rendering
          const texFormatted = plainToTeX(formatted);
          // CRITICAL: Store the original normalized input for editing, not the expanded result
          // src = what you typed (for editing): "A = 5in + 4in"  
          // raw = formatted display (for rendering): "A = 5\,\mathrm{in} + 4\,\mathrm{in} = 9\,\mathrm{in}"
          console.log('[COMMIT]', { 
            originalInput: raw,
            normalized,
            formatted,
            texFormatted,
            storing: { src: normalized, raw: texFormatted }
          });
          return { raw: texFormatted, src: normalized, renderAsMath: true };
          } catch {
            // Fallback to plain TeX conversion from normalized input
            return { raw: toTexFromRaw(normalized), src: normalized, renderAsMath: true };
          }
      })() : { raw: normalized, src: undefined, renderAsMath: false };
      let next = prev.map((b) => (b.id === id ? { ...b, ...converted, mode: "render" as const } : b));
      // Recompute dependencies using sources and update resultText
      const recomputed = recompute(next);
      // NOTE: Don't call regenerateMathBoxes here - we already parsed the math correctly above
      // regenerateMathBoxes is only for bulk operations like unit preference changes
      next = recomputed;
      // When a definition line like X=1000lb is present elsewhere, ensure the name map will include units
      // Save (debounced) after commit
      debouncedSave(docId, next);
      if (onActiveEditChange) onActiveEditChange(null);
      return next;
    }, 'edit'));
  };

  const cancel = (id: string) => {
    if (history.isReady()) history.push(new EditBoxCommand((prev) => prev.map((b) => (b.id === id ? { ...b, mode: "render" as const } : b)), 'edit', new Set([id])));
    InsertBridge.setFallbackInsertTarget(null);
    if (onActiveEditChange) onActiveEditChange(null);
  };

  const enterEdit = (id: string) => {
    setBoxes((prev) => prev.map((b) => {
      if (b.id !== id) return b;
      // When math-rendered, switch to editing the original source
      if (b.renderAsMath && b.src) {
        console.log('[ENTER EDIT]', { 
          id, 
          currentRaw: b.raw, 
          srcField: b.src,
          renderAsMath: b.renderAsMath,
          willSetRawTo: b.src
        });
        return { ...b, raw: b.src, mode: 'edit' as const };
      }
      return { ...b, mode: 'edit' as const };
    }));
    InsertBridge.setFallbackInsertTarget({ docId, boxId: id });
    if (onActiveEditChange) {
      const b = boxes.find(x => x.id === id);
      if (b) onActiveEditChange({ source: 'report', value: b.src ?? b.raw });
    }
  };

  const move = (id: string, x: number, y: number) => {
    if (history.isReady()) history.push(new EditBoxCommand((prev) => prev.map((b) => (b.id === id ? { ...b, x, y } : b)), 'move', new Set([id])));
  };

  const dragEnd = (_id: string) => {
    dragSnapshotRef.current = null;
    setBoxes((prev) => { const r = recompute(prev); debouncedSave(docId, r); return r; });
  };

  const nudge = (ids: Set<string>, dx: number, dy: number) => {
    if (!history.isReady()) return;
    history.push(new EditBoxCommand((prev) => {
      const next = prev.map((b) => (ids.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } : b));
      const r = recompute(next); debouncedSave(docId, r); return r;
    }, 'nudge', new Set(ids)));
  };

  const resize = (id: string, w: number) => {
    if (history.isReady()) history.push(new EditBoxCommand((prev) => { const r = prev.map((b) => (b.id === id ? { ...b, w } : b)); debouncedSave(docId, r); return r; }, 'resize', new Set([id])));
  };

  const fullWidth = (id: string) => {
    const canvas = surfaceRef.current; if (!canvas) return;
    const styles = getComputedStyle(canvas); const pad = parseInt(styles.paddingLeft) + parseInt(styles.paddingRight);
    const width = canvas.clientWidth - pad;
    history.push(new EditBoxCommand((prev) => { const r = prev.map((b) => (b.id === id ? { ...b, w: Math.max(200, Math.min(1000, width)) } : b)); debouncedSave(docId, r); return r; }, 'resize', new Set([id])));
  };

  // Selection logic
  const onSelectBox = (id: string, e: React.PointerEvent<HTMLElement>) => {
    const multi = e.shiftKey || e.ctrlKey || e.metaKey;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (multi) {
        if (next.has(id)) next.delete(id); else next.add(id);
      } else {
        next.clear(); next.add(id);
      }
      return next;
    });
    // Ensure the canvas has focus so keybindings (Delete, arrows) work
    surfaceRef.current?.focus();
  };

  const onDragDelta = (id: string, dx: number, dy: number) => {
    const ids = selectedIds.size ? selectedIds : new Set([id]);
    if (!dragSnapshotRef.current) {
      const start = new Map<string, { x: number; y: number }>();
      for (const bid of ids) {
        const b = boxes.find((bx) => bx.id === bid);
        if (b) start.set(bid, { x: b.x, y: b.y });
      }
      dragSnapshotRef.current = { ids: new Set(ids), start, before: boxes.map(b=>({ ...b })) };
    }
    const snap = dragSnapshotRef.current;
    if (!snap) return;
    history.push(new EditBoxCommand((prev) => prev.map((b) => {
      if (!snap.ids.has(b.id)) return b;
      const s = snap.start.get(b.id) || { x: b.x, y: b.y };
      const nx = Math.round((s.x + dx) / 8) * 8;
      const ny = Math.round((s.y + dy) / 8) * 8;
      return { ...b, x: nx, y: ny };
    }), 'move', snap.ids));
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    // Intercept high-priority history keys when appropriate
    // Undo/Redo handled by global hotkeys now

    // Cancel marquee overlay
    if (e.key === 'Escape') {
      e.preventDefault();
      if (marqueeRef.current?.el) { marqueeRef.current.el.remove(); marqueeRef.current = null; }
      setSelectedIds(new Set());
      history.push(new EditBoxCommand((prev) => prev.map((b) => (b.mode === 'edit' ? { ...b, mode: 'render' as const } : b)), 'edit'));
      return;
    }


    // Keep Ctrl/Cmd+A select-all in canvas
    if (e.key.toLowerCase() === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault(); setSelectedIds(new Set(boxes.map((b) => b.id))); return;
    }

    if (selectedIds.size === 0) return; if (anyEditing()) return;
    const step = e.shiftKey ? 8 : 1;
    if (e.key === "ArrowUp") { e.preventDefault(); nudge(selectedIds, 0, -step); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); nudge(selectedIds, 0, step); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); nudge(selectedIds, -step, 0); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); nudge(selectedIds, step, 0); return; }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (history.isReady()) history.push(new EditBoxCommand((prev) => { const ids = selectedIds; const f = prev.filter((b) => !ids.has(b.id)); debouncedSave(docId, f); return f; }, 'remove', new Set(selectedIds)));
      setSelectedIds(new Set());
    } else if (e.key.toLowerCase() === "f") {
      if (selectedIds.size === 1) { e.preventDefault(); const id = Array.from(selectedIds)[0]; fullWidth(id); }
    }
  };

  return (
    <div className="canvas-wrap" ref={wrapRef}>
      <div className="canvas" ref={surfaceRef} onPointerDown={handleSurfacePointerDown} onDoubleClick={handleSurfaceDoubleClick} onBeforeInput={onBeforeInput} onKeyDown={onKeyDown} tabIndex={0} style={{ touchAction: 'none' }}>
        <div style={{ position: 'sticky', top: 0, left: 0, display: 'flex', gap: 6, padding: 6, background: 'rgba(17,17,17,0.6)', borderRadius: 6, zIndex: 10, width: 'max-content' }}>
          <button onClick={() => setTool('select')} className={tool === 'select' ? 'tool-active' : ''} title="Select (marquee)" style={{ padding: '4px 8px', border: '1px solid #444', background: tool === 'select' ? '#2b2b2b' : '#1f1f1f', color: '#efefef' }}>▭ Select</button>
          <button onClick={() => setTool('create')} className={tool === 'create' ? 'tool-active' : ''} title="Create (click to add)" style={{ padding: '4px 8px', border: '1px solid #444', background: tool === 'create' ? '#2b2b2b' : '#1f1f1f', color: '#efefef' }}>＋ Add</button>
          {import.meta.env.DEV && history.isReady() && (
            <span style={{ marginLeft: 8, padding: '2px 6px', border: '1px solid #555', borderRadius: 4, background: '#111', color: '#9ad' }} title="History stacks">
              {(() => { try { const d = history.debugStacks(); return `U:${d.undoLen} R:${d.redoLen}`; } catch { return 'U:0 R:0'; } })()}
            </span>
          )}
        </div>
        {boxes.map((b) => (
             <CalcBox
            key={b.id}
            box={b}
            selected={selectedIds.has(b.id)}
            onSelect={onSelectBox}
            onCommit={commit}
            onCancel={cancel}
            onEnterEdit={enterEdit}
            onMove={move}
            onDragEnd={dragEnd}
            bringToFront={bringToFront}
            onResize={resize}
            onFullWidth={fullWidth}
            onDragDelta={onDragDelta}
          />
        ))}

      </div>
    </div>
  );
} 