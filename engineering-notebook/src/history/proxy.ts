import type { History } from './History';

type HistoryLike = {
  push: (...args: any[]) => void;
  undoOnce: () => void;
  redoOnce: () => void;
  beginTransaction: (name: string) => void;
  commit: () => void;
  rollback: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  onChange?: (cb: () => void) => () => void;
  debugStacks?: () => { undo: string[]; redo: string[]; undoLen: number; redoLen: number; txnOpen: boolean };
};

export type HistoryProxy = {
  push: (...args: any[]) => void;
  undoOnce: () => void;
  redoOnce: () => void;
  beginTransaction: (name: string) => void;
  commit: () => void;
  rollback: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  isReady: () => boolean;
  setReal: (h: HistoryLike) => void;
  onChange: (cb: () => void) => () => void;
  debugStacks: () => { undo: string[]; redo: string[]; undoLen: number; redoLen: number; txnOpen: boolean };
};

export function createHistoryProxy(): HistoryProxy {
  let real: HistoryLike | null = null;
  let warned = false;
  const warn = () => {
    if (warned) return;
    warned = true;
    // eslint-disable-next-line no-console
    console.warn('[history] called before ready; no-op');
    // reset after a short delay to avoid spamming
    setTimeout(() => { warned = false; }, 500);
  };
  const guard = <T extends (...args: any[]) => any>(fn: (h: HistoryLike, ...args: any[]) => ReturnType<T>) =>
    ((...args: any[]) => {
      if (!real) { warn(); return undefined as any; }
      return fn(real, ...args);
    });
  return {
    push: guard((h, cmd) => h.push(cmd)),
    undoOnce: guard((h) => h.undoOnce()),
    redoOnce: guard((h) => h.redoOnce()),
    beginTransaction: guard((h, name: string) => h.beginTransaction(name)),
    commit: guard((h) => h.commit()),
    rollback: guard((h) => h.rollback()),
    canUndo: () => (real ? real.canUndo() : false),
    canRedo: () => (real ? real.canRedo() : false),
    isReady: () => !!real,
    setReal: (h: HistoryLike) => { real = h; },
    onChange: (cb: () => void) => {
      if (!real || !real.onChange) { warn(); return () => {}; }
      return real.onChange(cb);
    },
    debugStacks: () => {
      if (!real || !real.debugStacks) { warn(); return { undo: [], redo: [], undoLen: 0, redoLen: 0, txnOpen: false }; }
      return real.debugStacks();
    },
  };
}


