import type { Command, CommandCtx } from '../../Command';

type EditKind = 'edit' | 'add' | 'remove' | 'move' | 'resize' | 'nudge';

export class EditBoxCommand implements Command {
  name = 'EditBox';
  scope: 'report' = 'report';
  private beforeBoxes: any[] | null = null;
  private ts: number;
  private targetIds?: Set<string>;
  private mutate!: (boxes: any[]) => any[];
  private kind!: EditKind;

  constructor(
    mutate: (boxes: any[]) => any[],
    kind: EditKind = 'edit',
    targetIds?: Set<string>,
    ts?: number,
    beforeSnapshot?: any[] | null,
  ) {
    this.mutate = mutate;
    this.kind = kind;
    this.ts = ts ?? Date.now();
    this.targetIds = targetIds ? new Set(targetIds) : undefined;
    if (beforeSnapshot) this.beforeBoxes = beforeSnapshot.map(b => ({ ...b }));
  }

  do(ctx: CommandCtx): void {
    if (!this.beforeBoxes) this.beforeBoxes = ctx.getBoxes().map((b: any) => {
      const { mode, hover, selected, resultText, error, ...rest } = b || {};
      // For math boxes, preserve src but reset raw to src (editable version) in snapshots
      if (rest.renderAsMath && rest.src) {
        return { ...rest, raw: rest.src };
      }
      return { ...rest };
    });
    ctx.setBoxes((prev) => this.mutate(prev.map((b: any) => {
      const { resultText, error, ...rest } = b || {};
      return { ...rest };
    })));
  }
  undo(ctx: CommandCtx): void {
    if (!this.beforeBoxes) return;
    // Restore structural/content state while preserving current UI-only fields like mode when possible
    ctx.setBoxes((prev) => {
      const idToPrev: Map<string, any> = new Map(prev.map((b: any) => [b.id, b]));
      const restored = this.beforeBoxes!.map((snap: any) => {
        const prevBox = idToPrev.get(snap.id);
        const mode = prevBox ? prevBox.mode : 'render';
        const { resultText, error, ...rest } = snap || {};
        // For math boxes, ensure raw is clean for editing (use src as raw when in edit mode)
        if (rest.renderAsMath && rest.src && mode === 'edit') {
          return { ...rest, mode, raw: rest.src };
        }
        return { ...rest, mode };
      });
      return restored;
    });
  }

  merge(next: Command): Command | undefined {
    if (!(next instanceof EditBoxCommand)) return undefined;
    if (!['move','resize','nudge'].includes(this.kind)) return undefined;
    if (next.kind !== this.kind) return undefined;
    // Require same target ids to coalesce
    const a = this.targetIds; const b = next.targetIds;
    const sameTargets = (() => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      if (a.size !== b.size) return false;
      for (const id of a) if (!b.has(id)) return false;
      return true;
    })();
    if (!sameTargets) return undefined;
    const within = (next.ts - this.ts) <= 600; // coalesce window
    if (!within) return undefined;
    // Keep original before snapshot; use next.mutate and timestamp; preserve targetIds
    return new EditBoxCommand(next.mutate, this.kind as EditKind, this.targetIds, next.ts, this.beforeBoxes);
  }
}


