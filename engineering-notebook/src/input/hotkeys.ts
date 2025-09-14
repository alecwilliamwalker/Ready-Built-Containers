export type HistoryLike = {
  undoOnce: () => void;
  redoOnce: () => void;
};

export type HotkeyDeps = {
  history: HistoryLike;
  setTool: (tool: 'select' | 'create') => void;
  addBoxAtCenter: () => void;
  isEditingInApp: () => boolean;
};

export const isUndo = (e: KeyboardEvent) => (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
export const isRedo = (e: KeyboardEvent) => (e.ctrlKey || e.metaKey) && ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y');
export const isPlain = (e: KeyboardEvent, k: string) => !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === k;

export function shouldIgnoreTarget(target: EventTarget | null, isEditingInApp: () => boolean): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  const isFormField = tag === 'input' || tag === 'textarea' || tag === 'select' || (el as any).isContentEditable;
  if (!isFormField) return false;
  // Allow app-level handling when editing is owned by History (e.g., report box edit)
  return !isEditingInApp();
}

export function bindGlobalHotkeys(deps: HotkeyDeps): () => void {
  const handler = (e: KeyboardEvent) => {
    const ignore = shouldIgnoreTarget(e.target, deps.isEditingInApp);
    // Undo/Redo
    if (!ignore && (isUndo(e) || isPlain(e, 'z'))) {
      e.preventDefault(); e.stopPropagation(); deps.history.undoOnce(); return;
    }
    if (!ignore && (isRedo(e) || isPlain(e, 'r'))) {
      e.preventDefault(); e.stopPropagation(); deps.history.redoOnce(); return;
    }
    // Tool hotkeys
    if (!ignore && isPlain(e, 'v')) {
      e.preventDefault(); e.stopPropagation(); deps.setTool('select'); return;
    }
    if (!ignore && isPlain(e, 'a')) {
      e.preventDefault(); e.stopPropagation(); deps.setTool('create'); deps.addBoxAtCenter(); return;
    }
  };
  window.addEventListener('keydown', handler, { capture: true });
  return () => window.removeEventListener('keydown', handler, true as any);
}


