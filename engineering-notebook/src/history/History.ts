import type { Command, CommandCtx } from './Command';

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private txn: { name: string; cmds: Command[] } | null = null;
  private ctx!: CommandCtx;
  private listeners: Set<() => void> = new Set();
  private performingUndoRedo = false;
  private ready = true;

  constructor(ctx?: CommandCtx) {
    if (ctx) this.ctx = ctx;
  }

  setCtx(ctx: CommandCtx) {
    this.ctx = ctx;
  }

  onChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  private emit() {
    for (const cb of this.listeners) {
      try { cb(); } catch {}
    }
  }

  beginTransaction(name: string) {
    if (!this.txn) {
      if (import.meta.env.DEV) console.log('[history]', { op: 'begin', name, undoLen: this.undoStack.length, redoLen: this.redoStack.length });
      this.txn = { name, cmds: [] };
    }
  }

  commit() {
    if (!this.txn) return;
    const cmds = this.txn.cmds;
    this.txn = null;
    if (cmds.length === 0) return;
    const compound: Command = {
      name: `Txn:${cmds[0].name}`,
      scope: 'sheet',
      do: (ctx) => { cmds.forEach(c => c.do(ctx)); },
      undo: (ctx) => { for (let i = cmds.length - 1; i >= 0; i -= 1) cmds[i].undo(ctx); }
    };
    this.undoStack.push(compound);
    this.redoStack = [];
    if (import.meta.env.DEV) console.log('[history]', { op: 'commit', undoLen: this.undoStack.length, redoLen: this.redoStack.length });
    this.emit();
  }

  rollback() {
    if (!this.txn) return;
    for (let i = this.txn.cmds.length - 1; i >= 0; i -= 1) {
      try { this.txn.cmds[i].undo(this.ctx); } catch {}
    }
    if (import.meta.env.DEV) console.log('[history]', { op: 'rollback', size: this.txn.cmds.length });
    this.txn = null;
  }

  push(cmd: Command) {
    if (this.performingUndoRedo) {
      if (import.meta.env.DEV) console.warn('[history] push() ignored during undo/redo');
      return;
    }
    // Execute immediately so ctx becomes source of truth
    cmd.do(this.ctx);
    if (this.txn) {
      this.txn.cmds.push(cmd);
      if (import.meta.env.DEV) console.log('[history]', { op: 'push(txn)', name: cmd.name, scope: cmd.scope, undoLen: this.undoStack.length, redoLen: this.redoStack.length });
      return;
    }
    // Coalesce with last step when possible
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && last.merge) {
      const merged = last.merge(cmd);
      if (merged) { this.undoStack[this.undoStack.length - 1] = merged; this.redoStack = []; return; }
    }
    this.undoStack.push(cmd);
    this.redoStack = [];
    if (import.meta.env.DEV) console.log('[history]', { op: 'push', name: cmd.name, scope: cmd.scope, undoLen: this.undoStack.length, redoLen: this.redoStack.length });
    this.emit();
  }

  undoOnce() {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    this.performingUndoRedo = true;
    try { cmd.undo(this.ctx); } finally { this.performingUndoRedo = false; }
    this.redoStack.push(cmd);
    if (import.meta.env.DEV) console.log('[history]', { op: 'undo', popped: cmd.name, undoLen: this.undoStack.length, redoLen: this.redoStack.length });
    this.emit();
  }

  redoOnce() {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    this.performingUndoRedo = true;
    try { cmd.do(this.ctx); } finally { this.performingUndoRedo = false; }
    this.undoStack.push(cmd);
    if (import.meta.env.DEV) console.log('[history]', { op: 'redo', popped: cmd.name, undoLen: this.undoStack.length, redoLen: this.redoStack.length });
    this.emit();
  }

  canUndo() { return (this.txn ? this.txn.cmds.length > 0 : false) || this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }

  debugStacks() {
    return {
      undo: this.undoStack.map(c => c.name),
      redo: this.redoStack.map(c => c.name),
      undoLen: this.undoStack.length,
      redoLen: this.redoStack.length,
      txnOpen: !!this.txn,
    };
  }
}


