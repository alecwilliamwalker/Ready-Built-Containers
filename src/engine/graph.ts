export { evaluate } from './eval';
export type { Grid } from './eval';

export type NodeId = string;

export type GraphNode = {
  id: NodeId;
  inputs: NodeId[];
  outputs: NodeId[];
};

export type Graph = {
  addNode: (id: NodeId) => void;
  removeNode: (id: NodeId) => void;
  addEdge: (from: NodeId, to: NodeId) => void;
  removeEdge: (from: NodeId, to: NodeId) => void;
  getDependents: (id: NodeId) => NodeId[];
  getDependencies: (id: NodeId) => NodeId[];
};

export function createGraph(): Graph {
  const edges = new Map<NodeId, Set<NodeId>>();
  const reverse = new Map<NodeId, Set<NodeId>>();

  const ensure = (id: NodeId) => {
    if (!edges.has(id)) edges.set(id, new Set());
    if (!reverse.has(id)) reverse.set(id, new Set());
  };

  return {
    addNode(id) { ensure(id); },
    removeNode(id) { edges.delete(id); reverse.delete(id); for (const [k, set] of edges) set.delete(id); for (const [k, set] of reverse) set.delete(id); },
    addEdge(from, to) { ensure(from); ensure(to); edges.get(from)!.add(to); reverse.get(to)!.add(from); },
    removeEdge(from, to) { edges.get(from)?.delete(to); reverse.get(to)?.delete(from); },
    getDependents(id) { return Array.from(reverse.get(id) ?? []); },
    getDependencies(id) { return Array.from(edges.get(id) ?? []); },
  };
}
