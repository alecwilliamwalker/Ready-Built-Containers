import { describe, it, expect } from 'vitest';
import { computeBoxes } from '../../ReportCanvas/compute';

type Box = any;

describe('ReportCanvas undo retains equals/result', () => {
  const getCellDisplay = (_r: number, _c: number) => '';

  it('recomputes resultText after a history restore', () => {
    const initial: Box[] = [{ id: '1', x:0, y:0, z:1, kind:'calc', mode:'render', raw:'', src:'A = 5 in + 4 in', renderAsMath:true }];
    const withComputed = computeBoxes(initial, getCellDisplay);
    expect(withComputed[0].resultText).toBeTruthy();
    // Simulate history restore of a bare snapshot (no computed fields)
    const restored: Box[] = [{ id: '1', x:0, y:0, z:1, kind:'calc', mode:'render', raw: withComputed[0].raw, src:'A = 5 in + 4 in', renderAsMath:true }];
    const recomputed = computeBoxes(restored, getCellDisplay);
    expect(recomputed[0].resultText).toBeTruthy();
  });
});


