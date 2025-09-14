import { describe, it, expect } from 'vitest';
import { normalizeForParser } from './normalize';

describe('normalizeForParser', () => {
  it('converts unicode spaces and inserts space before units', () => {
    const nbsp = '5\u00A0in + 3in = 8\u00A0in';
    expect(normalizeForParser(nbsp)).toBe('5 in + 3 in = 8 in');
  });

  it('handles numbers with commas/decimals', () => {
    expect(normalizeForParser('12,500kN')).toBe('12,500 kN');
    expect(normalizeForParser('3.5psi')).toBe('3.5 psi');
  });

  it('collapses multiple spaces and trims', () => {
    expect(normalizeForParser('  8   in  ')).toBe('8 in');
  });
});


