import React, { useRef, useState, type KeyboardEvent as KBEvent, useEffect, useMemo } from "react";
import "./App.css";
import { evaluate } from "./engine/eval";
import TopBar from "./components/TopBar";
import * as InsertBridge from "./referencing/insertTarget";
import { parseAddress as parseA1Address, indexToCol as a1IndexToCol } from "./referencing/a1";
import Tabs from "./components/Tabs";
import ReportCanvas from "./frames/ReportCanvas/ReportCanvas";
import { History } from "./history/History";
import { AppCommandCtx } from "./history/ctx";
import { SetCellValueCommand } from "./history/commands/sheet/SetCellValueCommand";
import { PasteCommand } from "./history/commands/sheet/PasteCommand";
import { createHistoryProxy } from "./history/proxy";
import { bindGlobalHotkeys } from "./input/hotkeys";

type CellValue = string;

const indexToCol = a1IndexToCol;

// use centralized helpers in referencing/a1

function parseAddress(addr: string, maxRows: number, maxCols: number): { r: number; c: number } | null {
  const rc = parseA1Address(addr);
  if (!rc) return null;
  if (rc.r < 0 || rc.c < 0 || rc.r >= maxRows || rc.c >= maxCols) return null;
  return rc;
}

type SheetSize = 'small' | 'medium' | 'large';

const SIZE_PRESETS: Record<SheetSize, { rows: number; cols: number }> = {
  small: { rows: 200, cols: 26 },
  medium: { rows: 1000, cols: 50 },
  large: { rows: 5000, cols: 80 },
};

export default function App() {
  // Boot checkpoint: App render entered
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[BOOT] App: render start');
  }
  // optional boot mark (no await in render)
  try { (window as any).__recordBoot && (window as any).__recordBoot('[BOOT] App render start'); } catch {}
  const [sheetSize, setSheetSize] = useState<SheetSize>('medium');
  const [numRows, setNumRows] = useState<number>(SIZE_PRESETS['medium'].rows);
  const [numCols, setNumCols] = useState<number>(SIZE_PRESETS['medium'].cols);

  type TabKind = 'sheet' | 'report';
  type AppTab = { id: string; label: string; kind: TabKind };
  const TABS_KEY = 'engineering-notebook:tabs';
  const CURRENT_TAB_KEY = 'engineering-notebook:currentTab';
  const defaultTabs: AppTab[] = [ { id: 'sheet', label: 'Sheet', kind: 'sheet' }, { id: 'report', label: 'Report', kind: 'report' } ];
  const [tabsState, setTabsState] = useState<AppTab[]>(() => {
    try { const raw = localStorage.getItem(TABS_KEY); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; } } catch {}
    return defaultTabs;
  });
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem(CURRENT_TAB_KEY) || 'report');
  useEffect(() => { try { localStorage.setItem(TABS_KEY, JSON.stringify(tabsState)); } catch {} }, [tabsState]);
  useEffect(() => { try { localStorage.setItem(CURRENT_TAB_KEY, activeTab); } catch {} }, [activeTab]);

  const [data, setData] = useState<CellValue[][]>(
    Array.from({ length: numRows }, () => Array(numCols).fill("")
  ));
  // History: shared across sheet+report
  const historyRef = useRef<History | null>(null);
  // const ctxRef = useRef<AppCommandCtx | null>(null);
  const boxesAccessorRef = useRef<{ get: () => any[]; set: (next: any[] | ((prev: any[]) => any[])) => void } | null>(null);
  const historyProxy = useMemo(() => createHistoryProxy(), []);
  // Build a CommandCtx adapter over current state
  const gridAccessor = useMemo(() => ({
    get: (r: number, c: number) => ({ value: data[r]?.[c] ?? "" }),
    set: (r: number, c: number, value: string) => {
      setData(prev => { const copy = prev.map(row => [...row]); if (!copy[r]) return prev; copy[r][c] = value; return copy; });
    }
  }), [data]);
  const boxesAccessor = useMemo(() => ({
    get: () => boxesAccessorRef.current ? boxesAccessorRef.current.get() : [],
    set: (next: any[] | ((prev: any[]) => any[])) => { boxesAccessorRef.current?.set(next); }
  }), []);
  // Defer History creation and ctx binding until after mount
  const initOnceRef = useRef(false);
  const [historyBadge, setHistoryBadge] = useState<{ u: number; r: number }>({ u: 0, r: 0 });
  useEffect(() => {
    if (initOnceRef.current) return;
    initOnceRef.current = true;
    const real = new History();
    const ctx = new AppCommandCtx(gridAccessor, boxesAccessor);
    real.setCtx(ctx);
    historyRef.current = real;
    historyProxy.setReal(real);
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[BOOT] App: History setCtx');
    }
    const unsub = real.onChange(() => {
      const s = (real as any).debugStacks?.();
      if (s) setHistoryBadge({ u: s.undoLen, r: s.redoLen });
    });
    return () => { unsub?.(); };
  }, [gridAccessor, boxesAccessor, historyProxy]);

  // Bind global hotkeys once History is ready
  useEffect(() => {
    if (!historyProxy.isReady()) return;
    const unbind = bindGlobalHotkeys({
      history: historyProxy as any,
      setTool: (t) => { /* tool managed in ReportCanvas; we only handle 'v'/'a' via side-effects if needed */ },
      addBoxAtCenter: () => { /* ReportCanvas handles add at center; no-op here */ },
      isEditingInApp: () => {
        // Treat report input editing as app-owned so undo/redo go to History
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        // Any element within canvas or with class calc-input is considered app-owned editing
        const withinCanvas = !!el.closest('.canvas');
        return withinCanvas;
      },
    });
    return () => unbind();
  }, [historyProxy]);
  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 0, c: 0 });
  const [formula, setFormula] = useState<string>("");
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null);
  const [activeExternalEdit, setActiveExternalEdit] = useState<string>("");
  const [hotkeysOpen, setHotkeysOpen] = useState(false);
  // Bump to force re-render when sticky insert target buffer changes
  const [insertVersion, setInsertVersion] = useState(0);
  useEffect(() => {
    const unsub = InsertBridge.subscribeInsertTarget(() => {
      setInsertVersion((v) => v + 1);
    });
    return () => { try { unsub?.(); } catch {} };
  }, []);
  const [hotkeys, setHotkeys] = useState<Record<string, string>>(() => {
    try { const raw = localStorage.getItem('engineering-notebook:hotkeys'); if (raw) return JSON.parse(raw); } catch {}
    return {
      undo: 'Control+z',
      save: 'Control+s',
      load: 'Control+o',
      addBox: 'Shift+a',
      fullWidth: 'f',
      reportSelect: 'v',
      reportAdd: 'a',
    };
  });
  const persistHotkeys = (next: Record<string,string>) => { setHotkeys(next); try { localStorage.setItem('engineering-notebook:hotkeys', JSON.stringify(next)); } catch {} };

  const cellRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const formulaRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalEditValueRef = useRef<string>("");

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const isEditingCell = (r: number, c: number) => editing?.r === r && editing?.c === c;

  const selectCell = (r: number, c: number) => {
    const rr = clamp(r, 0, numRows - 1);
    const cc = clamp(c, 0, numCols - 1);
    setSel({ r: rr, c: cc });
    setFormula(data[rr][cc]);
    setEditing(null);
    setTimeout(() => containerRef.current?.focus(), 0);
  };

  // const focusCell = (r: number, c: number) => {
  //   const rr = clamp(r, 0, numRows - 1);
  //   const cc = clamp(c, 0, numCols - 1);
  //   setSel({ r: rr, c: cc });
  //   setFormula(data[rr][cc]);
  //   setTimeout(() => cellRefs.current[rr]?.[cc]?.focus(), 0);
  // };

  const enterEditMode = (r: number, c: number) => {
    originalEditValueRef.current = data[r][c];
    setEditing({ r, c });
    setTimeout(() => cellRefs.current[r]?.[c]?.focus(), 0);
  };

  const handleChange = (row: number, col: number, value: string) => {
    if (!historyProxy.isReady()) return; // guard pre-ready
    historyProxy.push(new SetCellValueCommand(row, col, value));
    if (row === sel.r && col === sel.c) setFormula(value);
  };

  const onInputKeyDown = (e: KBEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setEditing(null);
      if (e.shiftKey) selectCell(r - 1, c);
      else selectCell(r + 1, c);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setEditing(null);
      if (e.shiftKey) selectCell(r, c - 1);
      else selectCell(r, c + 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      const original = originalEditValueRef.current;
      setData((prev) => { const copy = prev.map((rowArr) => [...rowArr]); copy[r][c] = original; return copy; });
      setFormula(original);
      setEditing(null);
      setTimeout(() => containerRef.current?.focus(), 0);
    }
  };

  const gridKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing) return; // allow input to handle its own keys

    // Navigation in selection mode
    if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      enterEditMode(sel.r, sel.c);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      selectCell(sel.r, sel.c + (e.shiftKey ? -1 : 1));
      return;
    }

    if (e.key === "ArrowRight") { e.preventDefault(); selectCell(sel.r, sel.c + 1); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); selectCell(sel.r, sel.c - 1); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); selectCell(sel.r + 1, sel.c); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); selectCell(sel.r - 1, sel.c); return; }

    const isCopy = (e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C");
    const isCut = (e.ctrlKey || e.metaKey) && (e.key === "x" || e.key === "X");
    const isPaste = (e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V");

    if (isCopy || isCut) {
      e.preventDefault();
      const raw = data[sel.r][sel.c] ?? "";
      try {
        await navigator.clipboard.writeText(raw);
      } catch {
        // Fallback copy via hidden textarea
        const ta = document.createElement("textarea");
        ta.value = raw;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        ta.style.pointerEvents = "none";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand("copy"); } finally { document.body.removeChild(ta); }
      }
      if (isCut) {
        setData((prev) => { const copy = prev.map((r) => [...r]); copy[sel.r][sel.c] = ""; return copy; });
        setFormula("");
      }
      return;
    }

    if (isPaste) {
      e.preventDefault();
      try {
        const text = await navigator.clipboard.readText();
        if (text == null) return;
        const norm = text.replace(/\r/g, "");
        const rowsArr = norm.split("\n");
        // Drop trailing empty line from some clipboard sources
        const cleanedRows = rowsArr.length > 1 && rowsArr[rowsArr.length - 1] === "" ? rowsArr.slice(0, -1) : rowsArr;
        const grid = cleanedRows.map((line) => line.split("\t"));
        if (historyProxy.isReady()) historyProxy.push(new PasteCommand(sel.r, sel.c, grid));
        setFormula(() => {
          const topLeft = grid[0]?.[0] ?? "";
          return topLeft;
        });
      } catch {
        // Ignore if clipboard read fails
      }
      return;
    }
  };

  const displayFor = (r: number, c: number, raw: string) => {
    if (isEditingCell(r, c)) return raw;
    const rowRefs = cellRefs.current[r];
    const el = rowRefs ? rowRefs[c] : undefined;
    const isActive = el != null && document.activeElement === el;
    if (isActive) return raw;
    if (raw.trim() === "") return "";
    try { const val = evaluate(data as string[][], raw); return String(val); }
    catch { return raw; }
  };

  const addr = `${indexToCol(sel.c)}${sel.r + 1}`;
  const onFormulaChange = (next: string) => {
    setFormula(next);
    setData((prev) => { const copy = prev.map((r) => [...r]); copy[sel.r][sel.c] = next; return copy; });
  };

  const getCellDisplay = (r: number, c: number): string => {
    const raw = data[r]?.[c] ?? "";
    if (raw.trim() === "") return "";
    try { const val = evaluate(data as string[][], raw); return String(val); }
    catch { return raw; }
  };

  // Large sheet virtualization (row windowing)
  const rowHeight = 28 + 2; // input height + borders
  const headerHeight = 28 + 2; // header cell height
  const [scrollTop, setScrollTop] = useState(0);
  // const viewportRows = 20; // default; refined in render via container height
  const buffer = 10;
  const onScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    setScrollTop((e.target as HTMLDivElement).scrollTop);
  };

  const isVirtualized = sheetSize !== 'small';
  const startRow = isVirtualized ? Math.max(0, Math.floor((scrollTop - headerHeight) / rowHeight) - buffer) : 0;
  const endRow = isVirtualized ? Math.min(numRows, startRow + Math.ceil((600 /*approx*/)/rowHeight) + buffer * 2) : numRows;

  // Force Report canvas remount on load to pick up new docs
  const [reportVersion, setReportVersion] = useState(0);

  // Per-sheet storage keyed by tab id
  const SHEET_BASE = 'engineering-notebook:sheet:v2';
  const sheetKey = (id: string) => `${SHEET_BASE}:${id}`;
  const makeBlankGrid = (r = numRows, c = numCols): CellValue[][] => Array.from({ length: r }, () => Array(c).fill(""));
  const loadSheet = (id: string): { data: CellValue[][]; sel: { r: number; c: number }; size?: SheetSize } => {
    try {
      const raw = localStorage.getItem(sheetKey(id));
      if (!raw) return { data: makeBlankGrid(), sel: { r: 0, c: 0 }, size: 'medium' };
      const saved = JSON.parse(raw);
      const size: SheetSize = saved?.size === 'small' || saved?.size === 'medium' || saved?.size === 'large' ? saved.size : 'medium';
      const dims = SIZE_PRESETS[size];
      const loadedData: CellValue[][] = Array.isArray(saved?.data) ? ensureDataDims(saved.data, dims.rows, dims.cols) : makeBlankGrid(dims.rows, dims.cols);
      const loadedSel = saved?.sel && typeof saved.sel.r === 'number' && typeof saved.sel.c === 'number' ? saved.sel : { r: 0, c: 0 };
      return { data: loadedData, sel: loadedSel, size };
    } catch {
      return { data: makeBlankGrid(), sel: { r: 0, c: 0 }, size: 'medium' };
    }
  };
  const saveSheet = (id: string, payload: { data: CellValue[][]; sel: { r: number; c: number }; size?: SheetSize }) => {
    try { localStorage.setItem(sheetKey(id), JSON.stringify(payload)); } catch {}
  };

  const getTabKind = (id: string): TabKind | undefined => tabsState.find(t => t.id === id)?.kind;
  const isSheetTab = (id: string) => getTabKind(id) === 'sheet';

  // Keep live refs of current data/sel for saving on tab switches
  const dataRef = useRef(data); useEffect(() => { dataRef.current = data; }, [data]);
  const selRef = useRef(sel); useEffect(() => { selRef.current = sel; }, [sel]);
  const prevActiveRef = useRef<string>(activeTab);

  // Utilities to ensure data and refs match current dims
  function ensureDataDims(d: CellValue[][], r: number, c: number): CellValue[][] {
    const out = d.map(row => row.slice(0, c));
    if (out.length < r) {
      for (let i = out.length; i < r; i += 1) out.push(Array(c).fill(""));
    }
    for (let i = 0; i < out.length; i += 1) {
      if (out[i].length < c) out[i] = [...out[i], ...Array(c - out[i].length).fill("")];
    }
    return out.slice(0, r);
  }

  function ensureCellRefs(r: number, c: number) {
    const refs = cellRefs.current;
    while (refs.length < r) refs.push([]);
    for (let i = 0; i < r; i += 1) {
      while (refs[i].length < c) refs[i].push(null);
      if (refs[i].length > c) refs[i].length = c;
    }
    if (refs.length > r) refs.length = r;
  }

  useEffect(() => { ensureCellRefs(numRows, numCols); }, [numRows, numCols]);

  // On mount: if starting on a sheet tab, load that sheet
  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[BOOT] App: initial mount effect');
    }
    if (isSheetTab(activeTab)) {
      const s = loadSheet(activeTab);
      const size = s.size ?? 'medium';
      setSheetSize(size);
      setNumRows(SIZE_PRESETS[size].rows);
      setNumCols(SIZE_PRESETS[size].cols);
      setData(ensureDataDims(s.data, SIZE_PRESETS[size].rows, SIZE_PRESETS[size].cols));
      setSel(s.sel);
      const f = s.data[s.sel.r]?.[s.sel.c] ?? "";
      setFormula(f);
      // Ensure external edit state is cleared for sheet mode
      setActiveExternalEdit("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When switching tabs: persist previous sheet, load next sheet if applicable
  useEffect(() => {
    const prevId = prevActiveRef.current;
    if (isSheetTab(prevId)) {
      saveSheet(prevId, { data: dataRef.current, sel: selRef.current, size: sheetSize });
    }
    if (isSheetTab(activeTab)) {
      const s = loadSheet(activeTab);
      const size = s.size ?? 'medium';
      setSheetSize(size);
      setNumRows(SIZE_PRESETS[size].rows);
      setNumCols(SIZE_PRESETS[size].cols);
      setData(ensureDataDims(s.data, SIZE_PRESETS[size].rows, SIZE_PRESETS[size].cols));
      setSel(s.sel);
      const f = s.data[s.sel.r]?.[s.sel.c] ?? "";
      setFormula(f);
      // Clear any stale external edit state when switching to sheet mode
      setActiveExternalEdit("");
    } else {
      // Clear external edit state when switching away from sheet mode
      setActiveExternalEdit("");
    }
    prevActiveRef.current = activeTab;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Autosave current sheet while editing it
  useEffect(() => {
    if (!isSheetTab(activeTab)) return;
    saveSheet(activeTab, { data, sel, size: sheetSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sel, activeTab, sheetSize]);

  // Global Save/Load (grid + report docs)
  const GLOBAL_BASE = 'engineering-notebook:global';
  const GLOBAL_LIST = `${GLOBAL_BASE}:saves`;
  const GLOBAL_CURRENT = `${GLOBAL_BASE}:current`;
  const saveKey = (name: string) => `${GLOBAL_BASE}:save:${name}`;
  const listSaves = (): string[] => { try { const raw = localStorage.getItem(GLOBAL_LIST); if (!raw) return []; const arr = JSON.parse(raw); return Array.isArray(arr) ? arr.map(String) : []; } catch { return []; } };
  const setSaves = (arr: string[]) => { try { localStorage.setItem(GLOBAL_LIST, JSON.stringify(Array.from(new Set(arr)))); } catch {} };

  // Manage saves UI state
  const [showSavesPanel, setShowSavesPanel] = useState(false);
  const [selectedSaveName, setSelectedSaveName] = useState<string>("");

  const onSaveAll = () => {
    try {
      const currentName = localStorage.getItem(GLOBAL_CURRENT) || "";
      const timeStamp = new Date().toISOString().replace('T',' ').slice(0,19);
      let name = window.prompt('Save as (name):', currentName || timeStamp);
      if (!name) return;
      name = name.trim();
      // Gather grid
      const grid = { data, sel, activeSheetId: activeTab, tabs: tabsState };
      // Gather report docs
      const reportIds = tabsState.filter(t => t.kind === 'report').map(t => t.id);
      const current = activeTab && getTabKind(activeTab) === 'report' ? activeTab : (reportIds[0] || 'default');
      const docs: Record<string, any> = {};
      const allIds = Array.from(new Set(['default', ...reportIds]));
      for (const id of allIds) {
        const raw = localStorage.getItem(`reportCanvas:doc:${id}`);
        if (raw) docs[id] = JSON.parse(raw);
      }
      const payload = { grid, report: { docIds: allIds, current, docs } };
      localStorage.setItem(saveKey(name), JSON.stringify(payload));
      const saves = listSaves(); setSaves([name, ...saves]);
      localStorage.setItem(GLOBAL_CURRENT, name);
      setSelectedSaveName(name);
      alert(`Saved as "${name}"`);
    } catch (e) { alert('Save failed'); }
  };

  const loadSnapshot = (name: string) => {
    const raw = localStorage.getItem(saveKey(name));
    if (!raw) throw new Error('Snapshot not found');
    const payload = JSON.parse(raw);
    if (payload.grid) {
      // Restore active sheet and its grid if available
      const activeSheetId: string | undefined = payload.grid.activeSheetId;
      if (activeSheetId && getTabKind(activeSheetId) === 'sheet') {
        try { localStorage.setItem(sheetKey(activeSheetId), JSON.stringify({ data: payload.grid.data, sel: payload.grid.sel })); } catch {}
        setActiveTab(activeSheetId);
        setData(payload.grid.data); setSel(payload.grid.sel);
        const fr = payload.grid.sel?.r ?? 0, fc = payload.grid.sel?.c ?? 0;
        const f = payload.grid.data?.[fr]?.[fc] ?? "";
        setFormula(f);
      } else {
        setData(payload.grid.data); setSel(payload.grid.sel);
        const fr = payload.grid.sel?.r ?? 0, fc = payload.grid.sel?.c ?? 0;
        const f = payload.grid.data?.[fr]?.[fc] ?? "";
        setFormula(f);
      }
      // Optionally restore tabs if included
      if (Array.isArray(payload.grid.tabs)) {
        setTabsState(payload.grid.tabs);
      }
    }
    if (payload.report) {
      const { docIds, current: reportCurrent, docs } = payload.report;
      if (Array.isArray(docIds)) localStorage.setItem('reportCanvas:docs', JSON.stringify(docIds));
      if (typeof reportCurrent === 'string') localStorage.setItem('reportCanvas:current', reportCurrent);
      if (docs && typeof docs === 'object') {
        for (const [id, val] of Object.entries(docs)) {
          localStorage.setItem(`reportCanvas:doc:${id}`, JSON.stringify(val));
        }
      }
    }
    localStorage.setItem(GLOBAL_CURRENT, name);
    setReportVersion((v) => v + 1);
  };

  const onLoadAll = () => {
    const saves = listSaves();
    if (saves.length === 0) { alert('No saved snapshots'); return; }
    const current = localStorage.getItem(GLOBAL_CURRENT) || saves[0];
    setSelectedSaveName(current);
    setShowSavesPanel(true);
  };

  const maybeInsertRef = (r: number, c: number, e: React.MouseEvent<HTMLTableCellElement>) => {
    const fEl = formulaRef.current;
    const addrStr = `${indexToCol(c)}${r + 1}`;
    // If report is editing, insert into its active input
    if (InsertBridge.hasInsertTarget()) {
      e.preventDefault();
      InsertBridge.insertText(addrStr);
      // After inserting into report, ensure formula bar regains focus for sheet editing
      // Use requestAnimationFrame for more reliable focus timing
      requestAnimationFrame(() => {
        // Only focus if we're still in sheet mode and no insert target is active
        if (formulaRef.current && !InsertBridge.hasInsertTarget()) {
          formulaRef.current.focus();
        }
      });
      return true;
    }
    if (fEl && (document.activeElement === fEl || editing)) {
      e.preventDefault();
      const insertAddr = addrStr;
      const start = fEl.selectionStart ?? formula.length;
      const end = fEl.selectionEnd ?? formula.length;
      const newVal = formula.slice(0, start) + insertAddr + formula.slice(end);
      setFormula(newVal);
      setData((prev) => { const copy = prev.map((rr) => [...rr]); copy[sel.r][sel.c] = newVal; return copy; });
      setTimeout(() => { if (formulaRef.current) { formulaRef.current.selectionStart = formulaRef.current.selectionEnd = start + insertAddr.length; formulaRef.current.focus(); }}, 0);
      return true;
    }
    return false;
  };

  const onFormulaKeyDown = (e: KBEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Commit is already reflected via onFormulaChange; just move selection
      selectCell(sel.r + (e.shiftKey ? -1 : 1), sel.c);
    } else if (e.key === "Tab") {
      e.preventDefault();
      selectCell(sel.r, sel.c + (e.shiftKey ? -1 : 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (editing) {
        const { r, c } = editing;
        const original = originalEditValueRef.current;
        setData((prev) => { const copy = prev.map((rowArr) => [...rowArr]); copy[r][c] = original; return copy; });
        setFormula(original);
        setEditing(null);
        setTimeout(() => containerRef.current?.focus(), 0);
      } else {
        setTimeout(() => cellRefs.current[sel.r]?.[sel.c]?.focus(), 0);
      }
    }
  };

  // Ensure container gets focus initially so arrow keys work
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const headerCellStyle: React.CSSProperties = {
    background: "#f3f3f3",
    color: "#333",
    border: "1px solid #4a4a4a",
    width: 100,
  };

  const headerDivStyle: React.CSSProperties = {
    height: 28,
    padding: 4,
    boxSizing: "border-box",
    textAlign: "center",
    fontWeight: 600,
    userSelect: "none",
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = !!(target && (tag === 'input' || tag === 'textarea' || target.isContentEditable));
      if (isEditable) return; // allow native undo for text inputs
      const combo = `${e.ctrlKey||e.metaKey?'Control+':''}${e.shiftKey?'Shift+':''}${e.altKey?'Alt+':''}${e.key.length===1?e.key.toLowerCase():e.key}`;
      const norm = combo.replace('Control+Control+','Control+');
      if (norm.toLowerCase() === (hotkeys.undo||'').toLowerCase()) {
        e.preventDefault(); historyRef.current?.undoOnce();
      } else if (norm.toLowerCase() === (hotkeys.save||'').toLowerCase()) {
        e.preventDefault(); onSaveAll();
      } else if (norm.toLowerCase() === (hotkeys.load||'').toLowerCase()) {
        e.preventDefault(); onLoadAll();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [hotkeys]);

  return (
    <div>
      <TopBar
        addr={addr}
        formula={(() => {
          const t = InsertBridge.getInsertTarget();
          if (t && t.kind === 'report' && t.getText) return t.getText();
          return activeExternalEdit || formula;
        })()}
        onFormulaChange={(next) => {
          const t = InsertBridge.getInsertTarget();
          if (t && t.kind === 'report' && t.setText) {
            t.setText(next);
          } else {
            onFormulaChange(next);
          }
        }}
        formulaRef={formulaRef}
        onFormulaKeyDown={(e) => {
          const t = InsertBridge.getInsertTarget();
          if (t && t.kind === 'report') {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); t.commit?.(); return; }
            if (e.key === 'Escape') { e.preventDefault(); t.cancel?.(); return; }
          }
          onFormulaKeyDown?.(e);
        }}
        onJump={(jumpAddr) => { const parsed = parseAddress(jumpAddr, numRows, numCols); if (parsed) { selectCell(parsed.r, parsed.c); } }}
        onSave={onSaveAll}
        onLoad={onLoadAll}
        onShowHotkeys={() => setHotkeysOpen(true)}
        onUndo={() => historyRef.current?.undoOnce()}
        onRedo={() => historyRef.current?.redoOnce()}
        canUndo={!!historyRef.current?.canUndo?.()}
        canRedo={!!historyRef.current?.canRedo?.()}
        stickyInfo={(() => { const t = InsertBridge.getInsertTarget(); return (t && t.kind === 'report') ? { kind: 'report', boxId: (t as any).boxId || '—' } : null; })()}
        onStickyCommit={() => { const t = InsertBridge.getInsertTarget(); t?.commit?.(); }}
        onStickyCancel={() => { const t = InsertBridge.getInsertTarget(); t?.cancel?.(); }}
      />

      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          tabs={tabsState.map(t => ({ id: t.id, label: t.label }))}
          active={activeTab}
          onChange={(id) => setActiveTab(id)}
          onDoubleClickTab={(id) => {
            const name = window.prompt('Rename tab:', tabsState.find(t => t.id === id)?.label || id);
            if (!name) return;
            setTabsState(prev => prev.map(t => t.id === id ? { ...t, label: name } : t));
          }}
        />
        <div style={{ marginLeft: 8, position: 'relative' }}>
          <button onClick={() => {
            const current = tabsState.find(t => t.id === activeTab);
            if (!current) return;
            const remaining = tabsState.filter(t => t.id !== activeTab);
            if (remaining.length === 0) { alert('Cannot delete the last tab'); return; }
            const ok = window.confirm(`Delete tab "${current.label}"?`);
            if (!ok) return;
            // Clean up persisted state for this tab
            try {
              if (current.kind === 'sheet') localStorage.removeItem(sheetKey(current.id));
              else localStorage.removeItem(`reportCanvas:doc:${current.id}`);
            } catch {}
            setTabsState(remaining);
            const idx = tabsState.findIndex(t => t.id === activeTab);
            const nextIdx = Math.max(0, Math.min(idx, remaining.length - 1));
            setActiveTab(remaining[nextIdx].id);
          }} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef', marginRight: 6 }}>−</button>
          <button onClick={() => {
            const choice = window.prompt('Create which tab? (sheet/report)', 'sheet');
            if (!choice) return; const kind = (choice.toLowerCase() === 'report') ? 'report' : 'sheet';
            const base = kind === 'sheet' ? 'sheet' : 'report';
            let i = 1; let id = `${base}${i}`; const existing = new Set(tabsState.map(t => t.id));
            while (existing.has(id)) { i += 1; id = `${base}${i}`; }
            const label = `${base[0].toUpperCase()}${base.slice(1)} ${i}`;
            setTabsState(prev => [...prev, { id, label, kind }]);
            setActiveTab(id);
          }} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef' }}>＋</button>
        </div>
      </div>

      <div className="main" style={{ padding: "1rem", display: "flex", flexDirection: "column", minHeight: 0, width: "100%" }}>
        {hotkeysOpen && (
          <div style={{ alignSelf: 'center', position: 'fixed', top: 80, background: '#1b1b1b', border: '1px solid #444', borderRadius: 8, padding: 16, color: '#efefef', zIndex: 1000, minWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>Hotkeys & Tools</strong>
              <button onClick={() => setHotkeysOpen(false)} style={{ padding: '2px 6px', border: '1px solid #555', background: '#2a2a2a', color: '#efefef' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
              {[
                { key: 'undo', label: 'Undo last edit (MVP)' },
                { key: 'save', label: 'Save snapshot' },
                { key: 'load', label: 'Load snapshot' },
                { key: 'addBox', label: 'Report: Add box (when canvas focused)' },
                { key: 'fullWidth', label: 'Report: Fit box to width' },
                { key: 'reportSelect', label: 'Report: Switch to Select tool' },
                { key: 'reportAdd', label: 'Report: Switch to Add tool' },
              ].map((row) => (
                <React.Fragment key={row.key}>
                  <div style={{ alignSelf: 'center' }}>{row.label}</div>
                  <input
                    value={hotkeys[row.key] || ''}
                    onChange={(e) => persistHotkeys({ ...hotkeys, [row.key]: e.target.value })}
                    placeholder="e.g. Control+z"
                    style={{ background: '#111', color: '#efefef', border: '1px solid #555', padding: 4 }}
                  />
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}>
              Tip: Use names like Control, Shift, Alt with + and a key (example: Control+z). Case-insensitive.
            </div>
          </div>
        )}
        {showSavesPanel && (
          <div style={{ alignSelf: 'flex-end', background: '#1b1b1b', border: '1px solid #444', borderRadius: 6, padding: 12, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <label>Snapshot:</label>
            <select value={selectedSaveName} onChange={(e) => setSelectedSaveName(e.target.value)} style={{ background: '#1f1f1f', color: '#efefef', border: '1px solid #444', padding: '4px 8px' }}>
              {listSaves().map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
            <button onClick={() => { try { loadSnapshot(selectedSaveName); setShowSavesPanel(false); } catch (e) { alert('Load failed'); } }} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef' }}>Load</button>
            <button onClick={() => { if (!selectedSaveName) return; const ok = window.confirm(`Delete "${selectedSaveName}"?`); if (!ok) return; try { localStorage.removeItem(saveKey(selectedSaveName)); const rest = listSaves().filter((n) => n !== selectedSaveName); setSaves(rest); setSelectedSaveName(rest[0] || ''); } catch {} }} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef' }}>Delete</button>
            <button onClick={() => setShowSavesPanel(false)} style={{ padding: '4px 8px', border: '1px solid #444', background: '#1f1f1f', color: '#efefef' }}>Close</button>
          </div>
        )}
        {tabsState.find(t => t.id === activeTab)?.kind === 'sheet' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: 1200, margin: '0 auto 8px', gap: 8 }}>
              <label style={{ fontSize: 12, opacity: 0.9 }}>Grid size:</label>
              <select
                value={sheetSize}
                onChange={(e) => {
                  const next = (e.target.value as SheetSize);
                  const dims = SIZE_PRESETS[next];
                  setSheetSize(next);
                  setNumRows(dims.rows); setNumCols(dims.cols);
                  setData(prev => ensureDataDims(prev, dims.rows, dims.cols));
                  // Adjust selection if out of bounds
                  setSel(s => ({ r: Math.min(s.r, dims.rows - 1), c: Math.min(s.c, dims.cols - 1) }));
                }}
                style={{ background: '#1f1f1f', color: '#efefef', border: '1px solid #444', padding: '4px 8px' }}
              >
                <option value="small">Small (200 x 26)</option>
                <option value="medium">Medium (1000 x 50)</option>
                <option value="large">Large (5000 x 80)</option>
              </select>
            </div>
            <div ref={containerRef} tabIndex={0} onKeyDown={gridKeyDown} onScroll={onScroll} style={{ overflow: 'auto', border: '1px solid #4a4a4a', borderRadius: 4, background: '#fff', color: '#000', maxHeight: '70vh', margin: '0 auto', width: 'max-content' }}>
              <table style={{ borderCollapse: "collapse", margin: 0 }}>
                <tbody>
                  {/* Column headers row */}
                  <tr>
                    {/* Top-left blank corner */}
                    <th className="col-head" style={{ position: 'sticky', top: 0, zIndex: 2, border: "1px solid #4a4a4a", width: 40, background: "#f3f3f3" }}>
                      <div style={{ ...headerDivStyle, width: 40 }} />
                    </th>
                    {Array.from({ length: numCols }).map((_, c) => (
                      <th key={`col-h-${c}`} className={`col-head ${sel.c === c ? "active-head" : ""}`} style={{ ...headerCellStyle, position: 'sticky', top: 0, zIndex: 1 }}>
                        <div style={headerDivStyle}>{indexToCol(c)}</div>
                      </th>
                    ))}
                  </tr>
                  {/* Virtualized rows */}
                  {isVirtualized ? (
                    <>
                      {startRow > 0 && (
                        <tr aria-hidden="true"><td style={{ height: startRow * rowHeight + 'px', padding: 0, border: 'none' }} colSpan={numCols + 1} /></tr>
                      )}
                      {data.slice(startRow, endRow).map((rowData, idx) => {
                        const r = startRow + idx;
                        return (
                          <tr key={r}>
                            <th className={`row-head ${sel.r === r ? "active-head" : ""}`} style={{ border: "1px solid #4a4a4a", width: 40, background: "#f3f3f3" }}>
                              <div style={{ ...headerDivStyle, width: 40 }}>{r + 1}</div>
                            </th>
                            {rowData.map((raw, c) => {
                              const isSel = sel.r === r && sel.c === c;
                              const tdClass = [
                                isSel ? "selected" : "",
                                sel.r === r ? "tint-row" : "",
                                sel.c === c ? "tint-col" : "",
                              ].join(" ").trim();
                              return (
                                <td
                                  key={c}
                                  className={tdClass}
                                  style={{ border: "1px solid #4a4a4a", width: 100 }}
                                  onMouseDown={(e) => { if (!maybeInsertRef(r, c, e)) { selectCell(r, c); } }}
                                  onDoubleClick={() => enterEditMode(r, c)}
                                >
                                  <input
                                    ref={(el) => {
                                      if (!cellRefs.current[r]) cellRefs.current[r] = [];
                                      cellRefs.current[r][c] = el;
                                    }}
                                    value={displayFor(r, c, raw)}
                                    onChange={(e) => handleChange(r, c, e.target.value)}
                                    onKeyDown={(e) => onInputKeyDown(e, r, c)}
                                    onFocus={() => setSel({ r, c })}
                                    readOnly={!isEditingCell(r, c)}
                                    tabIndex={isEditingCell(r, c) ? 0 : -1}
                                    style={{ width: "100%", height: 28, padding: 4, boxSizing: "border-box", background: "#fff", color: "#000", border: "none", outline: "none", pointerEvents: isEditingCell(r, c) ? "auto" : "none" }}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {endRow < numRows && (
                        <tr aria-hidden="true"><td style={{ height: (numRows - endRow) * rowHeight + 'px', padding: 0, border: 'none' }} colSpan={numCols + 1} /></tr>
                      )}
                    </>
                  ) : (
                    data.map((rowData, r) => (
                      <tr key={r}>
                        {/* Row header */}
                        <th className={`row-head ${sel.r === r ? "active-head" : ""}`} style={{ border: "1px solid #4a4a4a", width: 40, background: "#f3f3f3" }}>
                          <div style={{ ...headerDivStyle, width: 40 }}>{r + 1}</div>
                        </th>
                        {rowData.map((raw, c) => {
                          const isSel = sel.r === r && sel.c === c;
                          const tdClass = [
                            isSel ? "selected" : "",
                            sel.r === r ? "tint-row" : "",
                            sel.c === c ? "tint-col" : "",
                          ].join(" ").trim();
                          return (
                            <td
                              key={c}
                              className={tdClass}
                              style={{ border: "1px solid #4a4a4a", width: 100 }}
                              onMouseDown={(e) => { if (!maybeInsertRef(r, c, e)) { selectCell(r, c); } }}
                              onDoubleClick={() => enterEditMode(r, c)}
                            >
                              <input
                                ref={(el) => { if (!cellRefs.current[r]) cellRefs.current[r] = []; cellRefs.current[r][c] = el; }}
                                value={displayFor(r, c, raw)}
                                onChange={(e) => handleChange(r, c, e.target.value)}
                                onKeyDown={(e) => onInputKeyDown(e, r, c)}
                                onFocus={() => setSel({ r, c })}
                                readOnly={!isEditingCell(r, c)}
                                tabIndex={isEditingCell(r, c) ? 0 : -1}
                                style={{ width: "100%", height: 28, padding: 4, boxSizing: "border-box", background: "#fff", color: "#000", border: "none", outline: "none", pointerEvents: isEditingCell(r, c) ? "auto" : "none" }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {import.meta.env.DEV && console.log('[BOOT] App: rendering ReportCanvas for tab', activeTab)}
            <ReportCanvas
            key={`${reportVersion}-${activeTab}`}
            docId={activeTab}
            getCellDisplay={getCellDisplay}
            onActiveEditChange={(p) => setActiveExternalEdit(p?.value || "")}
            reportHotkeys={{ selectTool: hotkeys.reportSelect || 'v', addTool: hotkeys.reportAdd || 'a' }}
            history={historyProxy as any}
            bindBoxesAccessor={(get, set) => {
              boxesAccessorRef.current = { get, set };
              if (historyRef.current) {
                historyRef.current.setCtx(new AppCommandCtx(gridAccessor, {
                  get: () => boxesAccessorRef.current ? boxesAccessorRef.current.get() : [],
                  set: (next) => boxesAccessorRef.current?.set(next)
                }));
                // eslint-disable-next-line no-console
                console.log('[BOOT] App: bindBoxesAccessor -> History setCtx');
              }
            }}
          />
          </>
        )}

        <div style={{ textAlign: "center", marginTop: 12, opacity: 0.9 }}>
          <small>
            Selected: {addr} • Value:{" "}
            {(() => { const raw = data[sel.r][sel.c]; try { const val = evaluate(data as string[][], raw); return String(val); } catch { return "—"; } })()}
          </small>
        </div>
      </div>
      {import.meta.env.DEV && (
        <div style={{ position: 'fixed', bottom: 8, right: 8, background: '#222', color: '#eee', padding: '2px 6px', border: '1px solid #444', borderRadius: 4, fontSize: 12, zIndex: 9999 }}>
          U:{historyBadge.u} R:{historyBadge.r}
        </div>
      )}
    </div>
  );
}