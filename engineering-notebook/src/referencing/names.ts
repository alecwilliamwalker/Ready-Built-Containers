export type Name = string;
export type Target = { kind: "cell" | "block"; ref: string };

const store = new Map<Name, Target>();

export function defineName(name: Name, target: Target) {
  store.set(name, target);
}

export function resolveName(name: Name): Target | undefined {
  return store.get(name);
} 