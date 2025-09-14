import { describe, it, expect } from 'vitest';
import { evaluate } from './eval';

describe('engine/eval', () => {
  it('evaluates numbers and simple formulas', () => {
    const grid = [ ['1','2'], ['=A1+B1',''] ];
    expect(evaluate(grid, grid[0][0])).toBe(1);
    expect(evaluate(grid, grid[1][0])).toBe(3);
  });

  it('detects simple 2-cell cycles', () => {
    const grid = [ ['=B1','=A1'] ];
    expect(() => evaluate(grid, grid[0][0])).toThrow('#CYCLE!');
    expect(() => evaluate(grid, grid[0][1])).toThrow('#CYCLE!');
  });

  it('detects longer cycles', () => {
    const grid = [ ['=B1','=C1','=A1'] ];
    expect(() => evaluate(grid, grid[0][0])).toThrow('#CYCLE!');
  });
});


