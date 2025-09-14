export type Name = string;
export type Target = { kind: "cell" | "block"; ref: string };

// Store for named references (cells/blocks)
const store = new Map<Name, Target>();

// Store for variables and their values
const variableStore = new Map<string, number>();

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

export function resolveVariable(name: string): number | undefined {
  return variableStore.get(name);
}

export function hasVariable(name: string): boolean {
  return variableStore.has(name);
}

export function clearVariables() {
  variableStore.clear();
}