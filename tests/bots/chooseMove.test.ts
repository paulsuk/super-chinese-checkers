import { describe, expect, it } from "vitest";
import { bestProgressFor, chooseMove } from "../../src/bots/chooseMove";
import { scoreMove } from "../../src/bots/evaluate";
import { movesForPlayer } from "../../src/engine/moves";
import { newGame, validateMove } from "../../src/engine/rules";
import type { Pieces } from "../../src/engine/rules";
import type { BrainConfig } from "../../src/bots/types";
import { mulberry32 } from "../helpers/rng";

const W = { forward: 1, straggler: 0.5, homeFill: 1, chain: 0.3, gift: 0 };
const argmax: BrainConfig = { weights: W, temperature: 0, topK: 1, replyCheck: false };

describe("chooseMove", () => {
  it("temperature 0 is a deterministic argmax and returns a legal move", () => {
    const s = newGame("2026-01-01T00:00:00.000Z");
    const a = chooseMove(s, argmax, mulberry32(1));
    const b = chooseMove(s, argmax, mulberry32(999));
    expect(a).toEqual(b);
    expect(validateMove(s, a)).toBe(true);
    const best = Math.max(...movesForPlayer(s).map((m) => scoreMove(s.pieces, m, W)));
    expect(scoreMove(s.pieces, a, W)).toBe(best);
  });

  it("high temperature with a seeded rng is reproducible and varies with seed", () => {
    const s = newGame("2026-01-01T00:00:00.000Z");
    const hot: BrainConfig = { weights: W, temperature: 3, topK: 12, replyCheck: false };
    expect(chooseMove(s, hot, mulberry32(7))).toEqual(chooseMove(s, hot, mulberry32(7)));
    const picks = new Set(
      Array.from({ length: 20 }, (_, i) => JSON.stringify(chooseMove(s, hot, mulberry32(i)))),
    );
    expect(picks.size).toBeGreaterThan(1);
  });
});

describe("bestProgressFor", () => {
  it("sees a step when that is all there is, and a hop when a pivot appears", () => {
    // color 4 = S corner, target N (forward = decreasing r).
    const stepsOnly: Pieces = { "0,4": 4 };
    expect(bestProgressFor(stepsOnly, 1)).toBe(1);
    const withPivot: Pieces = { "0,4": 4, "0,2": 0 };
    expect(bestProgressFor(withPivot, 1)).toBe(4); // hop over k=2 pivot lands "0,0"
  });
});
