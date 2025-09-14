import { describe, it, expect } from 'vitest';
import { History } from '../History';
import { SimpleHistoryRef } from './SimpleHistoryRef';
import { MockCtx } from './MockCtx';
import { EditBoxCommand as RealEdit } from '../commands/report/EditBoxCommand';
import { EditBoxCommand as RefEdit } from './commands/EditBoxCommand';

function box(id: string, x = 0, y = 0) { return { id, x, y, z: 1, kind: 'calc', mode: 'render' as const, raw: '' }; }

describe('History parity (real vs reference)', () => {
  it('push -> undo -> redo symmetry', () => {
    const init = [box('a'), box('b')];
    const ctxReal = new MockCtx(init);
    const ctxRef = new MockCtx(init);
    const H = new History(ctxReal);
    const R = new SimpleHistoryRef(ctxRef);

    // Add
    H.push(new RealEdit((prev) => [...prev, box('c')], 'add', new Set(['c'])));
    R.push(new RefEdit((prev) => [...prev, box('c')], 'add', new Set(['c'])));
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());

    // Move
    H.push(new RealEdit((prev) => prev.map(b => b.id === 'c' ? { ...b, x: 10, y: 5 } : b), 'move', new Set(['c'])));
    R.push(new RefEdit((prev) => prev.map(b => b.id === 'c' ? { ...b, x: 10, y: 5 } : b), 'move', new Set(['c'])));
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());

    // Undo twice
    H.undoOnce(); R.undoOnce();
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());
    H.undoOnce(); R.undoOnce();
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());

    // Redo twice
    H.redoOnce(); R.redoOnce();
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());
    H.redoOnce(); R.redoOnce();
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());
  });

  it('redo cleared on new push after undo', () => {
    const ctxReal = new MockCtx([box('a')]);
    const ctxRef = new MockCtx([box('a')]);
    const H = new History(ctxReal);
    const R = new SimpleHistoryRef(ctxRef);
    H.push(new RealEdit((p)=>[...p, box('b')], 'add', new Set(['b'])));
    R.push(new RefEdit((p)=>[...p, box('b')], 'add', new Set(['b'])));
    H.undoOnce(); R.undoOnce();
    H.push(new RealEdit((p)=>p.map(b=>b.id==='a'?{...b,x:1}:b), 'move', new Set(['a'])));
    R.push(new RefEdit((p)=>p.map(b=>b.id==='a'?{...b,x:1}:b), 'move', new Set(['a'])));
    expect(H.canRedo()).toBe(false);
    expect(R.canRedo()).toBe(false);
    expect(ctxReal.getBoxes()).toEqual(ctxRef.getBoxes());
  });
});


