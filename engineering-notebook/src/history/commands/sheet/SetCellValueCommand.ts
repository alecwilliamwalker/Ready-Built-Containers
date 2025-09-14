import type { Command, CommandCtx } from '../../Command';

export class SetCellValueCommand implements Command {
  name = 'SetCellValue';
  scope: 'sheet' = 'sheet';
  private before: { value: string; format?: any } | null = null;

  private r: number;
  private c: number;
  private nextValue: string;
  private nextFormat?: any;

  constructor(r: number, c: number, nextValue: string, nextFormat?: any) {
    this.r = r; this.c = c; this.nextValue = nextValue; this.nextFormat = nextFormat;
  }

  do(ctx: CommandCtx): void {
    if (!this.before) this.before = ctx.getCell(this.r, this.c);
    ctx.setCell(this.r, this.c, this.nextValue, this.nextFormat);
  }

  undo(ctx: CommandCtx): void {
    if (!this.before) return;
    ctx.setCell(this.r, this.c, this.before.value, this.before.format);
  }

  merge(next: Command): Command | undefined {
    if (!(next instanceof SetCellValueCommand)) return undefined;
    if (next.r !== this.r || next.c !== this.c) return undefined;
    // Merge typing in same cell
    return new SetCellValueCommand(this.r, this.c, next.nextValue, next.nextFormat);
  }
}


