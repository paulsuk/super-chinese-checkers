import { describe, expect, it } from "vitest";
import { forwardValue, homeRank, progressOf, scoreMove } from "../../src/bots/evaluate";
import { targetCells } from "../../src/engine/board";
import type { Pieces } from "../../src/engine/rules";
import type { Weights } from "../../src/bots/types";

const W0: Weights = { forward: 1, straggler: 0, homeFill: 0, chain: 0, gift: 0 };

describe("forwardValue / progressOf", () => {
  it("one fully-forward step is exactly 1 step unit", () => {
    // color 1 = N corner, target S; SE step "0,0" -> "0,1" is fully forward.
    expect(forwardValue(1, "0,1") - forwardValue(1, "0,0")).toBe(48);
    expect(progressOf({ color: 1, path: ["0,0", "0,1"] })).toBe(1);
  });
  it("sideways is 0, backward negative", () => {
    expect(progressOf({ color: 1, path: ["0,0", "1,0"] })).toBe(0);   // E sideways for N->S
    expect(progressOf({ color: 1, path: ["0,1", "0,0"] })).toBe(-1);  // NW backward
  });
});

describe("homeRank", () => {
  it("is 0 off-target, 10 at the deepest target cell, and all ranks 1..10 exist", () => {
    expect(homeRank(1, "0,0")).toBe(0);
    const ranks = [...targetCells(1)].map((id) => homeRank(1, id)).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // deepest for color 1 (target S) = the S tip "-4,8"
    expect(homeRank(1, "-4,8")).toBe(10);
  });
});

describe("scoreMove", () => {
  it("with forward-only weights, score equals progress", () => {
    const pieces: Pieces = { "0,0": 1 };
    expect(scoreMove(pieces, { color: 1, path: ["0,0", "0,1"] }, W0)).toBe(1);
  });
  it("chain bonus counts extra legs", () => {
    const w: Weights = { ...W0, forward: 0, chain: 2 };
    const pieces: Pieces = { "0,0": 3, "1,0": 0, "3,0": 0 };
    expect(scoreMove(pieces, { color: 3, path: ["0,0", "2,0", "4,0"] }, w)).toBe(2); // 1 extra leg
  });
  it("straggler bonus prefers moving the rearmost piece (only on forward moves)", () => {
    const w: Weights = { ...W0, straggler: 1 };
    const pieces: Pieces = { "0,0": 1, "0,3": 1 }; // "0,0" lags for N->S
    const rear = scoreMove(pieces, { color: 1, path: ["0,0", "0,1"] }, w);
    const front = scoreMove(pieces, { color: 1, path: ["0,3", "0,4"] }, w);
    expect(rear).toBeGreaterThan(front);
    // sideways move earns no straggler bonus even for the rearmost piece
    expect(scoreMove(pieces, { color: 1, path: ["0,0", "1,0"] }, w)).toBe(0);
  });
  it("homeFill rewards entering deep home cells and charges for leaving them", () => {
    const w: Weights = { ...W0, forward: 0, homeFill: 1 };
    const into = { color: 1 as const, path: ["-4,7", "-4,8"] };
    const outOf = { color: 1 as const, path: ["-4,8", "-4,7"] };
    const inScore = scoreMove({ "-4,7": 1 }, into, w);
    const outScore = scoreMove({ "-4,8": 1 }, outOf, w);
    expect(inScore).toBeGreaterThan(0);
    expect(outScore).toBe(-inScore);
  });
});
