import type { Command, CommandCtx } from '../../Command';

// Sparse grid paste: applies a rectangular clipboard grid at (startR, startC)
export class PasteCommand implements Command {
  name = 'Paste';
  scope: 'sheet' = 'sheet';
  private before: Array<{ r: number; c: number; value: string; format?: any }> = [];

  constructor(private startR: number, private startC: number, private grid: string[][]) {}

  do(ctx: CommandCtx): void {
    if (this.before.length === 0) {
      for (let dr = 0; dr < this.grid.length; dr += 1) {
        for (let dc = 0; dc < this.grid[dr].length; dc += 1) {
          const r = this.startR + dr;
          const c = this.startC + dc;
          this.before.push({ r, c, ...ctx.getCell(r, c) });
        }
      }
    }
    for (let dr = 0; dr < this.grid.length; dr += 1) {
      for (let dc = 0; dc < this.grid[dr].length; dc += 1) {
        const r = this.startR + dr;
        const c = this.startC + dc;
        ctx.setCell(r, c, this.grid[dr][dc]);
      }
    }
  }

  undo(ctx: CommandCtx): void {
    for (let i = 0; i < this.before.length; i += 1) {
      const { r, c, value, format } = this.before[i];
      ctx.setCell(r, c, value, format);
    }
  }
}


