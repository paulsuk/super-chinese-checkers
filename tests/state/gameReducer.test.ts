import { describe, it, expect } from "vitest";
import { gameReducer } from "../../src/state/gameReducer";
import { newGame, applyMove } from "../../src/engine/rules";
import { chooseMove } from "../../src/bots/chooseMove";
import { forwardValue } from "../../src/bots/evaluate";
import { AUTOPILOT_BRAIN } from "../../src/bots/profiles";
import { COLORS_OF_PLAYER, startCells, targetCells } from "../../src/engine/board";
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
  // Player 0 fully home; player 1 (the loser) has one piece per color still traveling.
  // The empty target cell must be the SHALLOWEST (corner mouth) so a greedy forward
  // walk can finish with a plain step — leaving the deep tip empty could require a
  // precise hop and let a deterministic argmax cycle.
  function nearDoneLoser(): GameState {
    const pieces: Record<CellId, ColorId> = {};
    for (const c of COLORS_OF_PLAYER[0]!) for (const id of targetCells(c as ColorId)) pieces[id] = c as ColorId;
    for (const c of COLORS_OF_PLAYER[1]!) {
      const targets = [...targetCells(c as ColorId)]
        .sort((a, b) => forwardValue(c as ColorId, a) - forwardValue(c as ColorId, b));
      for (const id of targets.slice(1)) pieces[id] = c as ColorId; // mouth cell stays empty
      pieces[[...startCells(c as ColorId)][0]!] = c as ColorId;
    }
    return {
      pieces, toMove: 1, phase: "finishOut", winner: 0, winIndex: 0,
      history: [{ color: 0, path: ["0,0", "0,1"] }], startedAt: start,
    };
  }
  it("plays the loser out to done deterministically", () => {
    const s = nearDoneLoser();
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
