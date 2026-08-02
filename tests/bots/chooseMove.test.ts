import { describe, expect, it } from "vitest";
import { REVISIT_WINDOW, bestProgressFor, chooseMove } from "../../src/bots/chooseMove";
import { scoreMove } from "../../src/bots/evaluate";
import { movesForPlayer } from "../../src/engine/moves";
import { newGame, validateMove } from "../../src/engine/rules";
import type { Pieces } from "../../src/engine/rules";
import type { GameState, Move } from "../../src/engine/types";
import type { BrainConfig, Weights } from "../../src/bots/types";
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

describe("revisit guard", () => {
  // One lone color-1 piece: its only moves are the four steps E, W, SW, SE, and with a
  // flat weight set they all score 0 — exactly the plateau where a temperature-0 brain
  // would otherwise repeat itself forever.
  const flat: Weights = { forward: 0, straggler: 0, homeFill: 0, chain: 0, gift: 0 };
  const base = (history: Move[]): GameState => ({
    ...newGame("2026-01-01T00:00:00.000Z"),
    pieces: { "0,0": 1 } as Pieces,
    history,
  });
  const arrived: Move = { color: 1, path: ["1,0", "0,0"] }; // stepped W off "1,0"
  const plain: BrainConfig = { weights: flat, temperature: 0, topK: 8, replyCheck: false };
  const guarded: BrainConfig = {
    weights: { ...flat, revisit: 1 },
    temperature: 0,
    topK: 8,
    replyCheck: false,
  };

  it("without it a tied argmax walks straight back onto the vacated cell", () => {
    expect(chooseMove(base([arrived]), plain, mulberry32(1)).path[1]).toBe("1,0");
  });
  it("with it the brain picks a different cell", () => {
    const pick = chooseMove(base([arrived]), guarded, mulberry32(1));
    expect(pick.path[1]).not.toBe("1,0");
    expect(validateMove(base([arrived]), pick)).toBe(true);
  });
  it("forgets cells vacated longer ago than the window", () => {
    const filler: Move[] = Array.from({ length: REVISIT_WINDOW }, () => ({
      color: 0,
      path: ["0,-1", "0,-2"],
    }));
    // `arrived` now sits one ply outside the window, so the guard no longer sees it
    expect(chooseMove(base([arrived, ...filler]), guarded, mulberry32(1)).path[1]).toBe("1,0");
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
