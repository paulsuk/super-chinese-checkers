import { describe, it, expect } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { newGame, applyMove } from "../../src/engine/rules";
import { chooseMove } from "../../src/bots/chooseMove";
import { forwardValue } from "../../src/bots/evaluate";
import { AUTOPILOT_BRAIN } from "../../src/bots/profiles";
import { COLORS_OF_PLAYER, legalDirs, targetCells } from "../../src/engine/board";
import { add, cellId, parseId, scale } from "../../src/engine/coords";
import type { CellId, ColorId, GameState } from "../../src/engine/types";

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
    expect(gameReducer(null, { type: "UNDO" })).toBeNull();
    const done = { ...s1, phase: "done" as const };
    expect(gameReducer(done, { type: "UNDO" })).toBe(done);
  });
});

const start = "2026-01-01T00:00:00.000Z";
const auto = (s: GameState) => chooseMove(s, AUTOPILOT_BRAIN, () => 0);

describe("UNDO pair", () => {
  it("pops two moves when history >= 2", () => {
    let s = gameReducer(null, { type: "NEW_GAME", startedAt: start })!;
    s = gameReducer(s, { type: "COMMIT_MOVE", move: auto(s) })!;
    s = gameReducer(s, { type: "COMMIT_MOVE", move: auto(s) })!;
    const undone = gameReducer(s, { type: "UNDO", pair: true })!;
    expect(undone.history).toHaveLength(0);
    expect(undone.toMove).toBe(0);
  });
  it("is a no-op at history length 1 (never rerolls the bot)", () => {
    let s = gameReducer(null, { type: "NEW_GAME", startedAt: start })!;
    s = gameReducer(s, { type: "COMMIT_MOVE", move: auto(s) })!;
    expect(gameReducer(s, { type: "UNDO", pair: true })).toBe(s);
  });
});

describe("AUTO_FINISH", () => {
  // Player 0 fully home; player 1 (the loser) has 9 of each color home and one
  // traveler parked two forward-steps shy of the empty mouth cell (mid-board).
  function nearDoneLoser(): GameState {
    const pieces: Record<CellId, ColorId> = {};
    for (const c of COLORS_OF_PLAYER[0]!) {
      for (const id of targetCells(c as ColorId)) pieces[id] = c as ColorId;
    }
    for (const c of COLORS_OF_PLAYER[1]! as ColorId[]) {
      const targets = [...targetCells(c)].sort((a, b) => forwardValue(c, a) - forwardValue(c, b));
      const mouth = targets[0]!;
      for (const id of targets.slice(1)) pieces[id] = c;
      // forwardValue on a direction returns the axis dot product (value at cell from origin)
      const dir = [...legalDirs(c)].reduce((best, d) =>
        forwardValue(c, cellId(d)) > forwardValue(c, cellId(best)) ? d : best);
      const spot = cellId(add(parseId(mouth), scale(dir, -2)));
      pieces[spot] = c;
    }
    return {
      pieces, toMove: 1, phase: "finishOut", winner: 0, winIndex: 0,
      history: [{ color: 0, path: ["0,0", "0,1"] }], startedAt: start,
    };
  }
  it("plays the loser out to done deterministically", () => {
    const s = nearDoneLoser();
    expect(Object.keys(s.pieces)).toHaveLength(60);
    const a = gameReducer(s, { type: "AUTO_FINISH" })!;
    const b = gameReducer(s, { type: "AUTO_FINISH" })!;
    expect(a.phase).toBe("done");
    expect(a).toEqual(b);
    expect(a.history.length).toBeGreaterThan(s.history.length);
  });
  it("is a no-op outside finishOut", () => {
    const s = gameReducer(null, { type: "NEW_GAME", startedAt: start })!;
    expect(gameReducer(s, { type: "AUTO_FINISH" })).toBe(s);
  });
});
