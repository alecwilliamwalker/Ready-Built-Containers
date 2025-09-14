import { parse as parseUnified, evaluate as evaluateUnified, formatQuantity } from '../unified_parser';
import { parseAddress } from '../referencing/a1';

export type StepDoc = {
  equationLaTeX?: string;
  inputs: Array<{ name: string; display: string; source?: string }>;
  substitutionLaTeX?: string;
  result?: { display: string; unit?: string };
  notes?: string[];
  // New: structured fraction info for nicer rendering without KaTeX
  fraction?: { numerator: string; denominator: string };
  substitutionFraction?: { numerator: string; denominator: string };
  numericResult?: number;
};

export function build(expr: string, ctx: { getCellDisplay: (r: number, c: number) => string; resolveName?: (name: string) => string | undefined }): StepDoc {
  // Use unified parser exclusively - no more duplicate parsing logic
  const parsed = parseUnified(expr);
  
  // Extract cell references from the unified AST instead of regex parsing
  const refs: Array<{ label: string; r: number; c: number }> = [];
  
  function collectCellRefs(node: any): void {
    if (!node) return;
    if (node.kind === 'cell') {
      const address = parseAddress(node.ref);
      if (address) {
        refs.push({ label: node.ref, r: address.r, c: address.c });
      }
    }
    // Recursively traverse AST
    if (node.left) collectCellRefs(node.left);
    if (node.right) collectCellRefs(node.right);
    if (node.expr) collectCellRefs(node.expr);
    if (node.args) node.args.forEach(collectCellRefs);
  }
  
  if (parsed.kind === 'expression') {
    collectCellRefs(parsed.expr);
  } else if (parsed.kind === 'assignment') {
    collectCellRefs(parsed.expr);
  }
  
  const inputs = refs.map((r) => ({ name: r.label, display: ctx.getCellDisplay(r.r, r.c), source: r.label }));

  // Try to evaluate using unified parser
  try {
    const context = {
      getCell: (ref: string) => {
        // Use centralized A1 parsing - no more duplicate logic!
        const address = parseAddress(ref);
        if (address) {
          return ctx.getCellDisplay(address.r, address.c);
        }
        return "0";
      },
      getVariable: ctx.resolveName ? (name: string) => {
        const val = ctx.resolveName!(name);
        if (val && !isNaN(parseFloat(val))) {
          return { value: parseFloat(val), valueSI: parseFloat(val), dims: { L: 0, M: 0, T: 0, F: 0 } };
        }
        return undefined;
      } : undefined
    };
    
    const result = evaluateUnified(expr, context);
    const resultDisplay = formatQuantity(result);
    
    // Check if this is a simple fraction using unified AST instead of regex
    let isFraction = false;
    let left = '';
    let right = '';
    let leftDisplay = '';
    let rightDisplay = '';
    
    if (parsed.kind === 'expression' && parsed.expr.kind === 'binary' && parsed.expr.op === '/') {
      const leftNode = parsed.expr.left;
      const rightNode = parsed.expr.right;
      
      // Check if operands are simple (number, variable, or cell)
      const isSimple = (node: any) => 
        node.kind === 'number' || node.kind === 'variable' || node.kind === 'cell';
      
      if (isSimple(leftNode) && isSimple(rightNode)) {
        isFraction = true;
        
        // Extract left operand
        if (leftNode.kind === 'number') {
          left = leftNode.value.toString();
          leftDisplay = left;
        } else if (leftNode.kind === 'variable') {
          left = leftNode.name;
          leftDisplay = left;
        } else if (leftNode.kind === 'cell') {
          left = leftNode.ref;
          const addr = parseAddress(leftNode.ref);
          leftDisplay = addr ? ctx.getCellDisplay(addr.r, addr.c) : left;
        }
        
        // Extract right operand  
        if (rightNode.kind === 'number') {
          right = rightNode.value.toString();
          rightDisplay = right;
        } else if (rightNode.kind === 'variable') {
          right = rightNode.name;
          rightDisplay = right;
        } else if (rightNode.kind === 'cell') {
          right = rightNode.ref;
          const addr = parseAddress(rightNode.ref);
          rightDisplay = addr ? ctx.getCellDisplay(addr.r, addr.c) : right;
        }
      }
    }
    
    if (isFraction) {
      
      return {
        equationLaTeX: `\\frac{${left}}{${right}}`,
        substitutionLaTeX: `\\frac{${leftDisplay}}{${rightDisplay}}`,
        inputs,
        fraction: { numerator: left, denominator: right },
        substitutionFraction: { numerator: leftDisplay, denominator: rightDisplay },
        numericResult: result.value,
        result: { display: resultDisplay, unit: result.unit },
      };
    }
    
    return {
      equationLaTeX: expr,
      inputs,
      substitutionLaTeX: expr,
      result: { display: resultDisplay, unit: result.unit },
      numericResult: result.value,
    };
  } catch (error) {
    // Fallback for cases where unified evaluation fails
    return {
      equationLaTeX: expr,
      inputs,
      substitutionLaTeX: expr,
      result: { display: "Error in evaluation" },
    };
  }
}