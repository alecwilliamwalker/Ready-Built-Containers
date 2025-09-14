export type Name = string;
export type Target = { kind: "cell" | "block"; ref: string };

// Store for named references (cells/blocks)
const store = new Map<Name, Target>();

// Store for variables and their values
const variableStore = new Map<string, number>();

// Store for cell-to-variable mapping (which cell defines which variable)
const cellToVariablesStore = new Map<string, Set<string>>();

// Store for variable-to-cell mapping (which cell defines each variable)
const variableToCellStore = new Map<string, string>();

export function defineName(name: Name, target: Target) {
  store.set(name, target);
}

export function resolveName(name: Name): Target | undefined {
  return store.get(name);
}

// Variable storage functions
export function defineVariable(name: string, value: number) {
  variableStore.set(name, value);
}

// Enhanced variable definition with cell tracking
export function defineVariableInCell(name: string, value: number, cellKey: string) {
  // Clear old mapping if variable was defined elsewhere
  const oldCell = variableToCellStore.get(name);
  if (oldCell && oldCell !== cellKey) {
    const oldVariables = cellToVariablesStore.get(oldCell);
    if (oldVariables) {
      oldVariables.delete(name);
      if (oldVariables.size === 0) {
        cellToVariablesStore.delete(oldCell);
      }
    }
  }

  // Store the variable value
  variableStore.set(name, value);
  
  // Track variable-to-cell mapping
  variableToCellStore.set(name, cellKey);
  
  // Track cell-to-variables mapping
  let variables = cellToVariablesStore.get(cellKey);
  if (!variables) {
    variables = new Set();
    cellToVariablesStore.set(cellKey, variables);
  }
  variables.add(name);
}

export function resolveVariable(name: string): number | undefined {
  return variableStore.get(name);
}

export function hasVariable(name: string): boolean {
  return variableStore.has(name);
}

// Get which cell defines a variable
export function getVariableDefiningCell(name: string): string | undefined {
  return variableToCellStore.get(name);
}

// Get all variables defined by a cell
export function getVariablesDefinedByCell(cellKey: string): Set<string> {
  return cellToVariablesStore.get(cellKey) || new Set();
}

// Clear all variables defined by a specific cell
export function clearVariablesInCell(cellKey: string) {
  const variables = cellToVariablesStore.get(cellKey);
  if (variables) {
    // Remove each variable from the variable store and variable-to-cell mapping
    for (const varName of variables) {
      variableStore.delete(varName);
      variableToCellStore.delete(varName);
    }
    // Clear the cell-to-variables mapping
    cellToVariablesStore.delete(cellKey);
  }
}

export function clearVariables() {
  variableStore.clear();
  cellToVariablesStore.clear();
  variableToCellStore.clear();
}

// Get all variables that depend on variables from a specific cell
export function getDependentVariables(cellKey: string): Set<string> {
  const dependents = new Set<string>();
  const cellVariables = cellToVariablesStore.get(cellKey);
  
  if (!cellVariables) return dependents;
  
  // Find all variables that might reference variables from this cell
  for (const [varName, definingCell] of variableToCellStore) {
    if (definingCell !== cellKey) {
      // This variable is defined elsewhere, check if it might depend on our cell's variables
      dependents.add(varName);
    }
  }
  
  return dependents;
}