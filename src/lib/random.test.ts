import { describe, expect, it } from "vitest";
import { createRng, seededShuffle } from "./random";

function take(rng: () => number, count: number): number[] {
  return Array.from({ length: count }, rng);
}

describe("createRng", () => {
  it("produces the same sequence for the same seed", () => {
    expect(take(createRng("7K4M-92Q"), 20)).toEqual(
      take(createRng("7K4M-92Q"), 20),
    );
  });

  it("produces different sequences for different seeds", () => {
    expect(take(createRng("7K4M-92Q"), 5)).not.toEqual(
      take(createRng("A83F-2KP"), 5),
    );
  });

  it("only returns numbers in [0, 1)", () => {
    for (const n of take(createRng("7K4M-92Q"), 1000)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  // Locks the algorithm. If this fails, every shared seed would change its
  // questions: do not update the values unless that is intended.
  it("matches the recorded sequence for 7K4M-92Q", () => {
    expect(take(createRng("7K4M-92Q"), 5)).toEqual([
      0.9280652690213174,
      0.31018687901087105,
      0.3560447294730693,
      0.14731830870732665,
      0.7561399973928928,
    ]);
  });
});

describe("seededShuffle", () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it("gives the same order for the same seed", () => {
    expect(seededShuffle(items, createRng("7K4M-92Q"))).toEqual(
      seededShuffle(items, createRng("7K4M-92Q")),
    );
  });

  it("returns a permutation of the input", () => {
    const shuffled = seededShuffle(items, createRng("7K4M-92Q"));

    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });

  it("does not mutate the input", () => {
    const copy = [...items];
    seededShuffle(items, createRng("7K4M-92Q"));

    expect(items).toEqual(copy);
  });

  it("gives different orders for different seeds", () => {
    expect(seededShuffle(items, createRng("7K4M-92Q"))).not.toEqual(
      seededShuffle(items, createRng("A83F-2KP")),
    );
  });

  it("handles empty and single-item arrays", () => {
    expect(seededShuffle([], createRng("7K4M-92Q"))).toEqual([]);
    expect(seededShuffle(["a"], createRng("7K4M-92Q"))).toEqual(["a"]);
  });
});
