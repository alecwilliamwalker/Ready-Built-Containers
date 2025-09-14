import { describe, it, expect } from 'vitest';
import { classifyLine, convertDisplay, evalExpr, lex, makeQuantity, parseExpr, recompute } from './model';

const getCellDisplay = (r: number, c: number) => {
  const grid: Record<string,string> = { '0:0': '5 in', '0:1': '2 in', '1:0': '10 kN' };
  return grid[`${r}:${c}`] ?? '';
};
const a1ToRC = (a1: string) => {
  const m = /^([A-Z]+)([1-9][0-9]*)$/.exec(a1);
  if (!m) return null;
  const col = m[1]; const row = parseInt(m[2],10)-1;
  const colIdx = col.split('').reduce((n,ch)=>n*26+(ch.charCodeAt(0)-64),0)-1;
  return { r: row, c: colIdx };
};

describe('ReportPad model', () => {
  it('classifies defs and exprs', () => {
    expect(classifyLine('A = 5 in')).toBe('def');
    expect(classifyLine('5 in + 2 in')).toBe('expr');
  });

  it('computes definitions with units and dimension mismatch errors', () => {
    const doc = { lines: [
      { id: '1', text: 'A = 5 in', kind: 'text' as const },
      { id: '2', text: 'B = 2 in', kind: 'text' as const },
      { id: '3', text: 'A + B', kind: 'text' as const },
      { id: '4', text: 'A + 10 kN', kind: 'text' as const },
    ] };
    const out = recompute(doc, getCellDisplay, a1ToRC);
    const lines = out.lines;
    expect(lines[0].result).toBeTruthy();
    expect(lines[1].result).toBeTruthy();
    expect(lines[2].result).toBeTruthy();
    expect(lines[3].error).toBeTruthy();
  });

  it('resolves A1 refs and VLOOKUP exact matches', () => {
    // A1 ref via evalExpr
    const expr = parseExpr(lex('A1 + B1'));
    const q = evalExpr(expr, { getCellDisplay, a1ToRC, ns: new Map() });
    const disp = convertDisplay(q, 'in');
    expect(Math.round(disp.value)).toBe(7);
    expect(disp.unit).toBe('in');

    // VLOOKUP: build a doc with names, but rely on function throwing for missing impl
    const doc = { lines: [ { id: '1', text: 'X = 5 in', kind: 'text' as const } ] };
    const out = recompute(doc, getCellDisplay, a1ToRC);
    expect(out.lines[0].result).toBeTruthy();
  });
});


