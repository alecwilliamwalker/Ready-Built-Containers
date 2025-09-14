import type { Command, CommandCtx } from '../Command';

export class SimpleHistoryRef {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private txn: { name: string; cmds: Command[] } | null = null;
  private performingUndoRedo = false;
  constructor(private ctx: CommandCtx) {}

  beginTransaction(name: string) {
    if (!this.txn) this.txn = { name, cmds: [] };
  }
  commit() {
    if (!this.txn) return;
    const cmds = this.txn.cmds;
    this.txn = null;
    if (cmds.length === 0) return;
    const compound: Command = {
      name: `Txn:${cmds[0].name}`,
      scope: 'report',
      do: (ctx) => { cmds.forEach(c => c.do(ctx)); },
      undo: (ctx) => { for (let i = cmds.length - 1; i >= 0; i -= 1) cmds[i].undo(ctx); },
    };
    this.undoStack.push(compound);
    this.redoStack = [];
  }
  rollback() {
    if (!this.txn) return;
    for (let i = this.txn.cmds.length - 1; i >= 0; i -= 1) {
      this.txn.cmds[i].undo(this.ctx);
    }
    this.txn = null;
  }
  push(cmd: Command) {
    if (this.performingUndoRedo) return;
    cmd.do(this.ctx);
    if (this.txn) { this.txn.cmds.push(cmd); return; }
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && last.merge) {
      const merged = last.merge(cmd);
      if (merged) { this.undoStack[this.undoStack.length - 1] = merged; this.redoStack = []; return; }
    }
    this.undoStack.push(cmd);
    this.redoStack = [];
  }
  undoOnce() {
    const c = this.undoStack.pop(); if (!c) return;
    this.performingUndoRedo = true; try { c.undo(this.ctx); } finally { this.performingUndoRedo = false; }
    this.redoStack.push(c);
  }
  redoOnce() {
    const c = this.redoStack.pop(); if (!c) return;
    this.performingUndoRedo = true; try { c.do(this.ctx); } finally { this.performingUndoRedo = false; }
    this.undoStack.push(c);
  }
  canUndo() { return (this.txn ? this.txn.cmds.length > 0 : false) || this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
  debugStacks() { return { undoLen: this.undoStack.length, redoLen: this.redoStack.length }; }
}


