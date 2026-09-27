import { describe, expect, it } from "vitest";
import { availableNodes, levels, nodeStatus, topologicalOrder } from "../shared/graph";

const nodes = [
  { id: "n1", deps: [] },
  { id: "n2", deps: ["n1"] },
  { id: "n3", deps: ["n1"] },
  { id: "n4", deps: ["n2", "n3"] },
];

describe("nodeStatus", () => {
  it("opens a node once all its dependencies are done", () => {
    expect(nodeStatus(nodes[3], new Set(["n1", "n2"]))).toBe("locked");
    expect(nodeStatus(nodes[3], new Set(["n1", "n2", "n3"]))).toBe("available");
    expect(nodeStatus(nodes[0], new Set())).toBe("available");
    expect(nodeStatus(nodes[0], new Set(["n1"]))).toBe("done");
  });
});

describe("levels", () => {
  it("places each node one level below its deepest dependency", () => {
    expect(Object.fromEntries(levels(nodes))).toEqual({ n1: 0, n2: 1, n3: 1, n4: 2 });
  });

  it("does not loop forever on a cycle", () => {
    const cyclic = [
      { id: "a", deps: ["b"] },
      { id: "b", deps: ["a"] },
    ];
    expect(() => levels(cyclic)).not.toThrow();
  });
});

describe("topologicalOrder", () => {
  it("moves dependencies first and keeps the original order otherwise", () => {
    const shuffled = [nodes[3], nodes[0], nodes[2], nodes[1]];
    expect(topologicalOrder(shuffled)?.map((n) => n.id)).toEqual(["n1", "n3", "n2", "n4"]);
  });

  it("returns null for a cycle", () => {
    expect(
      topologicalOrder([
        { id: "a", deps: ["b"] },
        { id: "b", deps: ["a"] },
      ]),
    ).toBeNull();
  });
});

describe("availableNodes", () => {
  it("lists what can be studied next", () => {
    expect(availableNodes(nodes, new Set(["n1"])).map((n) => n.id)).toEqual(["n2", "n3"]);
  });
});
