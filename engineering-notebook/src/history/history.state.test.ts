import { describe, it, expect } from 'vitest';
import { History } from './History';
import { AppCommandCtx } from './ctx';
import { SetCellValueCommand } from './commands/sheet/SetCellValueCommand';

// Minimal grid/boxes accessors for History ctx
function makeCtx() {
  const data: string[][] = Array.from({ length: 2 }, () => Array(2).fill(''));
  const grid = {
    get: (r: number, c: number) => ({ value: data[r]?.[c] ?? '' }),
    set: (r: number, c: number, value: string) => { if (!data[r]) return; data[r][c] = value; },
  };
  const boxes = {
    get: () => [] as any[],
    set: (_next: any) => {},
  };
  return new AppCommandCtx(grid, boxes);
}

describe('History state transitions', () => {
  it('push -> canUndo true; undo -> canRedo true', () => {
    const ctx = makeCtx();
    const h = new History(ctx);

    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(false);

    h.push(new SetCellValueCommand(0, 0, 'A'));
    expect(h.canUndo()).toBe(true);
    expect(h.canRedo()).toBe(false);

    h.undoOnce();
    expect(h.canUndo()).toBe(false);
    expect(h.canRedo()).toBe(true);
  });
});


