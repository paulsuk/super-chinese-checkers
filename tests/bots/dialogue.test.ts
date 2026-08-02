import { describe, expect, it } from "vitest";
import {
  detectEvents, freshMemory, homeCount, pickLine,
} from "../../src/bots/dialogue";
import { targetCells } from "../../src/engine/board";
import { newGame } from "../../src/engine/rules";
import type { GameState } from "../../src/engine/types";
import type { LinePools } from "../../src/bots/types";
import { mulberry32 } from "../helpers/rng";

const g = (over: Partial<GameState>): GameState => ({ ...newGame("2026-01-01T00:00:00.000Z"), ...over });

describe("detectEvents", () => {
  it("classifies a 3-hop chain by mover", () => {
    const prev = g({});
    const botChain = g({ history: [{ color: 0, path: ["a", "b", "c", "d"] }] });
    expect(detectEvents(prev, botChain, 0)).toContain("bigChain");
    const humanChain = g({ history: [{ color: 4, path: ["a", "b", "c", "d"] }] });
    expect(detectEvents(prev, humanChain, 0)).toContain("humanBigChain");
    const short = g({ history: [{ color: 0, path: ["a", "d"] }] });
    expect(detectEvents(prev, short, 0)).toEqual([]);
  });

  it("fires win/lose on entering finishOut", () => {
    const prev = g({});
    const botWon = g({ phase: "finishOut", winner: 0, history: [{ color: 0, path: ["a", "b"] }] });
    expect(detectEvents(prev, botWon, 0)).toContain("win");
    const humanWon = g({ phase: "finishOut", winner: 1, history: [{ color: 4, path: ["a", "b"] }] });
    expect(detectEvents(prev, humanWon, 0)).toContain("lose");
  });

  it("fires closingIn when home count crosses 25", () => {
    const homes = [...targetCells(3), ...targetCells(4), ...targetCells(5)];
    const at = (n: number) => Object.fromEntries(homes.slice(0, n).map((id, i) => [id, [3, 4, 5][Math.floor(i / 10)]]));
    const prev = g({ pieces: at(24) });
    const next = g({ pieces: at(25), history: [{ color: 4, path: ["a", "b"] }] });
    expect(homeCount(next.pieces, 1)).toBe(25);
    expect(detectEvents(prev, next, 0)).toContain("closingIn");
    expect(detectEvents(next, g({ pieces: at(26), history: next.history.concat([{ color: 4, path: ["a", "b"] }]) }), 0)).toEqual([]);
  });
});

describe("pickLine", () => {
  const pools: LinePools = {
    intro: ["i1"], bigChain: ["c1", "c2"], humanBigChain: ["h1"],
    closingIn: ["z1"], win: ["w1"], lose: ["l1"],
  };
  it("throttles event lines to one per 6 history entries, never intro/win/lose", () => {
    let mem = freshMemory();
    const first = pickLine(pools, "bigChain", mem, 10, mulberry32(1));
    expect(first).not.toBeNull();
    mem = first!.mem;
    expect(pickLine(pools, "closingIn", mem, 12, mulberry32(1))).toBeNull();  // gap 2 < 6
    expect(pickLine(pools, "win", mem, 12, mulberry32(1))).not.toBeNull();     // never throttled
    expect(pickLine(pools, "bigChain", mem, 16, mulberry32(1))).not.toBeNull(); // gap 6
  });
  it("cycles a pool without repeats until exhausted", () => {
    let mem = freshMemory();
    const seen: string[] = [];
    for (const turn of [0, 6, 12]) {
      const r = pickLine(pools, "bigChain", mem, turn, mulberry32(turn));
      seen.push(r!.line as string);
      mem = r!.mem;
    }
    expect(new Set(seen.slice(0, 2)).size).toBe(2); // both lines before any repeat
    expect(["c1", "c2"]).toContain(seen[2]);        // then the pool resets
  });
});
