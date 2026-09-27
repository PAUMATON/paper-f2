import type { TreeNode } from "./types";

export type NodeStatus = "done" | "available" | "locked";

type Deps = Pick<TreeNode, "id" | "deps">;

export function nodeStatus(node: Deps, done: ReadonlySet<string>): NodeStatus {
  if (done.has(node.id)) return "done";
  return node.deps.every((d) => done.has(d)) ? "available" : "locked";
}

/**
 * Orders the nodes so every dependency comes before the nodes that need it,
 * keeping the original order wherever the dependencies allow it.
 * Returns null when the dependencies contain a cycle.
 */
export function topologicalOrder<T extends Deps>(nodes: readonly T[]): T[] | null {
  const placed = new Set<string>();
  const pending = [...nodes];
  const ordered: T[] = [];
  while (pending.length) {
    const i = pending.findIndex((n) => n.deps.every((d) => placed.has(d)));
    if (i === -1) return null;
    const [next] = pending.splice(i, 1);
    placed.add(next.id);
    ordered.push(next);
  }
  return ordered;
}

/** Depth of each node: 0 for roots, otherwise one more than its deepest dependency. */
export function levels(nodes: readonly Deps[]): Map<string, number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map<string, number>();
  const depth = (id: string, seen: Set<string>): number => {
    const known = memo.get(id);
    if (known !== undefined) return known;
    const node = byId.get(id);
    if (!node || seen.has(id)) return 0;
    seen.add(id);
    const d = node.deps.length ? Math.max(...node.deps.map((dep) => depth(dep, seen))) + 1 : 0;
    seen.delete(id);
    memo.set(id, d);
    return d;
  };
  for (const n of nodes) depth(n.id, new Set());
  return memo;
}

/** Nodes the learner can open now, in tree order. */
export function availableNodes<T extends Deps>(nodes: readonly T[], done: ReadonlySet<string>): T[] {
  return nodes.filter((n) => nodeStatus(n, done) === "available");
}
