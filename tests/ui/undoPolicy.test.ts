import { describe, expect, it } from "vitest";
import { undoBlocked, undoPairs } from "../../src/ui/undoPolicy";
import { newGame } from "../../src/engine/rules";
import type { GameState, Move } from "../../src/engine/types";

const move: Move = { color: 0, path: ["0,0", "0,1"] };
const g = (over: Partial<GameState>): GameState => ({
  ...newGame("2026-01-01T00:00:00.000Z"),
  ...over,
});
const withHistory = (n: number, over: Partial<GameState> = {}): GameState =>
  g({ history: Array.from({ length: n }, () => move), ...over });

describe("undoBlocked", () => {
  it("never blocks a PvP game", () => {
    expect(undoBlocked(withHistory(0), false)).toBe(false);
    expect(undoBlocked(withHistory(1), false)).toBe(false);
    expect(undoBlocked(withHistory(4, { toMove: 0 }), false)).toBe(false);
  });

  it("blocks while the bot is to move", () => {
    expect(undoBlocked(withHistory(4, { toMove: 0 }), true)).toBe(true);
    expect(undoBlocked(withHistory(4, { toMove: 1 }), true)).toBe(false);
  });

  it("blocks on the opener, where pair-undo is a no-op", () => {
    expect(undoBlocked(withHistory(0, { toMove: 1 }), true)).toBe(true);
    expect(undoBlocked(withHistory(1, { toMove: 1 }), true)).toBe(true);
    expect(undoBlocked(withHistory(2, { toMove: 1 }), true)).toBe(false);
  });

  it("blocks at the win boundary so the bot's winning move can never be undone", () => {
    // the bot just clinched: last move is the winning move, human now finishes out
    const justWon = withHistory(6, { phase: "finishOut", winner: 0, winIndex: 5, toMove: 1 });
    expect(undoBlocked(justWon, true)).toBe(true);
    // after one solo move the human may take that move back...
    const oneSolo = withHistory(7, { phase: "finishOut", winner: 0, winIndex: 5, toMove: 1 });
    expect(undoBlocked(oneSolo, true)).toBe(false);
    // ...but walking back to the boundary re-blocks before the winning move is exposed
    expect(undoBlocked(justWon, true)).toBe(true);
  });
});

describe("undoPairs", () => {
  it("pairs only during normal play in a bot game", () => {
    expect(undoPairs(withHistory(4), true)).toBe(true);
    expect(undoPairs(withHistory(4, { phase: "finishOut", winner: 0, winIndex: 2 }), true)).toBe(false);
    expect(undoPairs(withHistory(4), false)).toBe(false);
  });
});
