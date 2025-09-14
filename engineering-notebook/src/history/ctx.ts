import type { CommandCtx } from './Command';

export type GridAccessor = {
  get: (r: number, c: number) => { value: string; format?: any };
  set: (r: number, c: number, value: string, format?: any) => void;
};

export type BoxesAccessor = {
  get: () => any[];
  // Accept either a full array or a functional updater(prev)
  set: (next: any[] | ((prev: any[]) => any[])) => void;
};

export class AppCommandCtx implements CommandCtx {
  private grid: GridAccessor;
  private boxes: BoxesAccessor;
  constructor(grid: GridAccessor, boxes: BoxesAccessor) {
    this.grid = grid; this.boxes = boxes;
  }

  getCell(r: number, c: number) { return this.grid.get(r, c); }
  setCell(r: number, c: number, value: string, format?: any) { this.grid.set(r, c, value, format); }

  getBoxes() { return this.boxes.get(); }
  setBoxes(next: any[] | ((prev: any[]) => any[])) { this.boxes.set(next as any); }
}


