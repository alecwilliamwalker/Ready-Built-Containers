import type { CommandCtx } from '../Command';

export class MockCtx implements CommandCtx {
  private boxes: any[] = [];
  constructor(initial: any[] = []) { this.boxes = initial.map(b => ({ ...b })); }
  getCell() { return { value: '' }; }
  setCell() {}
  getBoxes() { return this.boxes.map(b => ({ ...b })); }
  setBoxes(next: any[] | ((prev: any[]) => any[])) {
    const computed = typeof next === 'function' ? (next as any)(this.boxes) : next;
    this.boxes = computed.map((b: any) => ({ ...b }));
  }
}


