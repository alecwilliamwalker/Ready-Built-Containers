import { describe, it, expect } from 'vitest';
import { indexToCol, colLabelToIndex, parseAddress } from './a1';

describe('A1 helpers', () => {
  it('round-trips common columns', () => {
    const labels = ['A','Z','AA','AZ','BA','ZZ','AAA'];
    for (const label of labels) {
      const c = colLabelToIndex(label);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(indexToCol(c)).toBe(label);
    }
  });

  it('parses A1 to rc correctly', () => {
    expect(parseAddress('A1')).toEqual({ r: 0, c: 0 });
    expect(parseAddress('Z10')).toEqual({ r: 9, c: 25 });
    expect(parseAddress('AA2')).toEqual({ r: 1, c: 26 });
    expect(parseAddress('invalid')).toBeNull();
  });
});


