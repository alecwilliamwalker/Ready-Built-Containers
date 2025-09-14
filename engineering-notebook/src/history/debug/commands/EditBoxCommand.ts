import type { Command, CommandCtx } from '../../Command';

type EditKind = 'edit' | 'add' | 'remove' | 'move' | 'resize' | 'nudge';

export class EditBoxCommand implements Command {
  name = 'EditBox';
  scope: 'report' = 'report';
  private before: any[] | null = null;
  private ts: number;
  private mutate!: (boxes: any[]) => any[];
  private kind!: EditKind;
  constructor(mutate: (boxes: any[]) => any[], kind: EditKind = 'edit', private targetIds?: Set<string>, ts?: number) {
    this.mutate = mutate as any;
    this.kind = kind;
    this.ts = ts ?? Date.now();
  }
  do(ctx: CommandCtx) {
    if (!this.before) this.before = ctx.getBoxes().map(b => ({ ...b }));
    ctx.setBoxes((prev) => this.mutate(prev.map(b => ({ ...b }))));
  }
  undo(ctx: CommandCtx) {
    if (!this.before) return;
    const snap = this.before.map(b => ({ ...b }));
    ctx.setBoxes(() => snap);
  }
  merge(next: Command) {
    if (!(next instanceof EditBoxCommand)) return undefined;
    if (!['move','resize','nudge'].includes(this.kind)) return undefined;
    if (next.kind !== this.kind) return undefined;
    const a = this.targetIds; const b = next.targetIds;
    const same = (!a && !b) || (a && b && a.size === b.size && Array.from(a).every(id => b.has(id)));
    if (!same) return undefined;
    if ((next.ts - this.ts) > 600) return undefined;
    return new EditBoxCommand(next.mutate, this.kind, this.targetIds, next.ts);
  }
}


