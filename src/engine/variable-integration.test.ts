import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateCell, evaluate } from './eval';
import { defineVariableInCell, getVariableDefiningCell, clearVariablesInCell, resolveVariable, clearVariables } from '../referencing/names';

describe('Spreadsheet Variable Integration', () => {
  beforeEach(() => {
    // Clear all variables before each test
    clearVariables();
  });

  describe('Basic Variable Definition and Reference', () => {
    it('should define variable in cell and reference from another cell', () => {
      const grid = [
        ['L = 5', '=L * 2'],
        ['', '']
      ];
      
      // Evaluate cell A1 (L = 5)
      const resultA1 = evaluateCell(grid, 'L = 5', 0, 0);
      expect(resultA1).toBe(5);
      
      // Check that the variable is mapped to the correct cell
      expect(getVariableDefiningCell('L')).toBe('0:0');
      
      // Evaluate cell B1 (=L * 2) - should trigger evaluation of A1
      const resultB1 = evaluateCell(grid, '=L * 2', 0, 1);
      expect(resultB1).toBe(10);
    });

    it('should handle units in variable definitions', () => {
      const grid = [
        ['L = 5 ft', '=L * 2'],
        ['', '']
      ];
      
      const resultA1 = evaluateCell(grid, 'L = 5 ft', 0, 0);
      expect(resultA1).toBe(5);
      
      const resultB1 = evaluateCell(grid, '=L * 2', 0, 1);
      expect(resultB1).toBe(10);
    });
  });

  describe('Variable-to-Variable Dependencies', () => {
    it('should handle chained variable dependencies', () => {
      const grid = [
        ['L = 5', 'W = L * 2', '=W + L'],
        ['', '', '']
      ];
      
      // Define L = 5
      const resultA1 = evaluateCell(grid, 'L = 5', 0, 0);
      expect(resultA1).toBe(5);
      
      // Define W = L * 2 (depends on L)
      const resultB1 = evaluateCell(grid, 'W = L * 2', 0, 1);
      expect(resultB1).toBe(10);
      
      // Use both variables
      const resultC1 = evaluateCell(grid, '=W + L', 0, 2);
      expect(resultC1).toBe(15); // 10 + 5
    });

    it('should handle complex expression dependencies', () => {
      const grid = [
        ['Base = 10', 'Height = Base / 2', 'Area = Base * Height'],
        ['', '', '']
      ];
      
      evaluateCell(grid, 'Base = 10', 0, 0);
      expect(resolveVariable('Base')).toBe(10);
      
      evaluateCell(grid, 'Height = Base / 2', 0, 1);
      expect(resolveVariable('Height')).toBe(5);
      
      evaluateCell(grid, 'Area = Base * Height', 0, 2);
      expect(resolveVariable('Area')).toBe(50);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect direct variable cycles', () => {
      const grid = [
        ['A = B', 'B = A'],
        ['', '']
      ];
      
      expect(() => {
        evaluateCell(grid, 'A = B', 0, 0);
        evaluateCell(grid, 'B = A', 0, 1);
      }).toThrow('#CYCLE!');
    });

    it('should detect indirect variable cycles', () => {
      const grid = [
        ['A = B', 'B = C', 'C = A'],
        ['', '', '']
      ];
      
      expect(() => {
        evaluateCell(grid, 'A = B', 0, 0);
        evaluateCell(grid, 'B = C', 0, 1);
        evaluateCell(grid, 'C = A', 0, 2);
      }).toThrow('#CYCLE!');
    });

    it('should detect cycles involving cell references and variables', () => {
      const grid = [
        ['A = A1', '=A + 1'],
        ['', '']
      ];
      
      expect(() => {
        evaluateCell(grid, 'A = A1', 0, 0);
        evaluateCell(grid, '=A + 1', 0, 1);
      }).toThrow('#CYCLE!');
    });
  });

  describe('Variable Redefinition', () => {
    it('should handle variable redefinition in different cells', () => {
      const grid = [
        ['L = 5', ''],
        ['L = 10', '=L * 2']
      ];
      
      // Define L = 5 in A1
      evaluateCell(grid, 'L = 5', 0, 0);
      expect(getVariableDefiningCell('L')).toBe('0:0');
      expect(resolveVariable('L')).toBe(5);
      
      // Redefine L = 10 in A2 (should override)
      evaluateCell(grid, 'L = 10', 1, 0);
      expect(getVariableDefiningCell('L')).toBe('1:0');
      expect(resolveVariable('L')).toBe(10);
      
      // B2 should use the new value of L
      const resultB2 = evaluateCell(grid, '=L * 2', 1, 1);
      expect(resultB2).toBe(20);
    });

    it('should clean up old variable mappings when cell changes', () => {
      const grid = [
        ['L = 5', ''],
        ['', '']
      ];
      
      // Initially define L = 5
      evaluateCell(grid, 'L = 5', 0, 0);
      expect(getVariableDefiningCell('L')).toBe('0:0');
      
      // Clear variables in cell A1 (simulating cell value change)
      clearVariablesInCell('0:0');
      expect(getVariableDefiningCell('L')).toBeUndefined();
      expect(resolveVariable('L')).toBeUndefined();
    });
  });

  describe('Spreadsheet Recalculation Scenarios', () => {
    it('should handle on-demand evaluation when variables change', () => {
      const grid = [
        ['L = 5', '=L * 2'],
        ['', '']
      ];
      
      // Initial evaluation
      evaluateCell(grid, 'L = 5', 0, 0);
      let resultB1 = evaluateCell(grid, '=L * 2', 0, 1);
      expect(resultB1).toBe(10);
      
      // Change L to 8 and re-evaluate
      clearVariablesInCell('0:0');
      grid[0][0] = 'L = 8';
      evaluateCell(grid, 'L = 8', 0, 0);
      
      // B1 should now return 16 when re-evaluated
      resultB1 = evaluateCell(grid, '=L * 2', 0, 1);
      expect(resultB1).toBe(16);
    });

    it('should handle multiple dependent cells', () => {
      const grid = [
        ['L = 10', '=L * 2', '=L + 5'],
        ['', '=L / 2', '=L * L']
      ];
      
      // Define base variable
      evaluateCell(grid, 'L = 10', 0, 0);
      
      // All dependent cells should work
      expect(evaluateCell(grid, '=L * 2', 0, 1)).toBe(20);
      expect(evaluateCell(grid, '=L + 5', 0, 2)).toBe(15);
      expect(evaluateCell(grid, '=L / 2', 1, 1)).toBe(5);
      expect(evaluateCell(grid, '=L * L', 1, 2)).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined variables gracefully', () => {
      const grid = [
        ['=UndefinedVar * 2', ''],
        ['', '']
      ];
      
      expect(() => {
        evaluateCell(grid, '=UndefinedVar * 2', 0, 0);
      }).toThrow('Undefined variable: UndefinedVar');
    });

    it('should handle invalid expressions in variable assignments', () => {
      const grid = [
        ['L = InvalidExpression', ''],
        ['', '']
      ];
      
      expect(() => {
        evaluateCell(grid, 'L = InvalidExpression', 0, 0);
      }).toThrow();
    });
  });
});