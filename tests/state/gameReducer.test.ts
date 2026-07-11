import { describe, it, expect } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { newGame, applyMove } from "../../src/engine/rules";

const T0 = "2026-07-10T00:00:00Z";

describe("gameReducer", () => {
  it("NEW_GAME starts a fresh game from any state", () => {
    expect(gameReducer(null, { type: "NEW_GAME", startedAt: T0 })).toEqual(newGame(T0));
  });
  it("COMMIT_MOVE applies legal moves and ignores illegal ones", () => {
    const s0 = newGame(T0);
    const legal = { color: 1 as const, path: ["1,-5", "1,-4"] };
    const illegal = { color: 1 as const, path: ["1,-5", "1,-6"] }; // backward
    expect(gameReducer(s0, { type: "COMMIT_MOVE", move: legal })).toEqual(applyMove(s0, legal));
    expect(gameReducer(s0, { type: "COMMIT_MOVE", move: illegal })).toBe(s0);
    expect(gameReducer(null, { type: "COMMIT_MOVE", move: legal })).toBeNull();
  });
  it("UNDO reverses the last move; refused on empty history and when done", () => {
    const s0 = newGame(T0);
    const s1 = gameReducer(s0, { type: "COMMIT_MOVE", move: { color: 1, path: ["1,-5", "1,-4"] } })!;
    expect(gameReducer(s1, { type: "UNDO" })).toEqual(s0);
    expect(gameReducer(s0, { type: "UNDO" })).toBe(s0);
    const done = { ...s1, phase: "done" as const };
    expect(gameReducer(done, { type: "UNDO" })).toBe(done);
  });
});
