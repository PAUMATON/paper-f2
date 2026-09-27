import { describe, expect, it } from "vitest";
import { shuffledOrder } from "../src/lib/shuffle";

describe("shuffledOrder", () => {
  it("is a stable permutation for a given seed", () => {
    const order = shuffledOrder("n1:0", 4);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
    expect(shuffledOrder("n1:0", 4)).toEqual(order);
  });

  it("does not always keep the first option first", () => {
    const firsts = new Set(Array.from({ length: 40 }, (_, i) => shuffledOrder(`seed-${i}`, 4)[0]));
    expect(firsts.size).toBeGreaterThan(1);
  });
});
