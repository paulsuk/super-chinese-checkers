import { describe, it, expect } from "vitest";
import {
  newGame, validateMove, applyMove, undoMove, playerFinished, marginSoFar,
} from "../../src/engine/rules";
import type { Pieces } from "../../src/engine/rules";
import { targetCells } from "../../src/engine/board";
import type { CellId, ColorId, GameState, Move } from "../../src/engine/types";

/** Fill a color's entire target, minus `except`, into `pieces`. */
function fillTarget(pieces: Pieces, color: ColorId, except: CellId[] = []): void {
  for (const id of targetCells(color)) if (!except.includes(id)) pieces[id] = color;
}

/** Player 0 one W-step from winning; player 1 (color 4) has `loserOut.length`
 *  stragglers, each one NW-step from its empty target cell. */
function nearWinState(loserOut: Array<[CellId, CellId]>): GameState {
  const pieces: Pieces = {};
  fillTarget(pieces, 0);                              // color 0 home (SE)
  fillTarget(pieces, 1);                              // color 1 home (S)
  fillTarget(pieces, 2, ["-5,1"]);                    // color 2: 9 home (SW)
  pieces["-4,1"] = 2;                                 //   one W-step from "-5,1"
  fillTarget(pieces, 3);                              // color 3 home (NE)
  fillTarget(pieces, 4, loserOut.map(([, t]) => t));  // color 4 partially home (N)
  for (const [cur] of loserOut) pieces[cur] = 4;
  fillTarget(pieces, 5);                              // color 5 home (NW)
  return { ...newGame("2026-07-10T00:00:00Z"), pieces };
}

describe("validateMove", () => {
  it("accepts a legal opening step; rejects wrong owner, wrong origin, short path", () => {
    const s = newGame("2026-07-10T00:00:00Z");
    expect(validateMove(s, { color: 1, path: ["1,-5", "1,-4"] })).toBe(true);
    expect(validateMove(s, { color: 4, path: ["-1,5", "-1,4"] })).toBe(false); // not their turn
    expect(validateMove(s, { color: 1, path: ["0,0", "0,1"] })).toBe(false);   // no piece there
    expect(validateMove(s, { color: 1, path: ["1,-5"] })).toBe(false);         // too short
  });
  it("validates hop chains hop-by-hop, incl. sideways return to the lifted origin", () => {
    const base = newGame("2026-07-10T00:00:00Z");
    const s: GameState = { ...base, pieces: { "0,0": 1, "0,1": 4, "1,2": 4 } };
    expect(validateMove(s, { color: 1, path: ["0,0", "0,2", "2,2"] })).toBe(true);
    const s2: GameState = { ...base, pieces: { "0,0": 1, "1,0": 4 } };
    // E hop, then W hop back over the same pivot into the (now empty) origin: legal
    expect(validateMove(s2, { color: 1, path: ["0,0", "2,0", "0,0"] })).toBe(true);
  });
  it("rejects backward mid-chain hops and step-then-chain", () => {
    const base = newGame("2026-07-10T00:00:00Z");
    const s: GameState = { ...base, pieces: { "0,0": 1, "0,1": 4, "0,3": 4 } };
    expect(validateMove(s, { color: 1, path: ["0,0", "0,2", "0,4", "0,2"] })).toBe(false);
    expect(validateMove(s, { color: 1, path: ["0,0", "0,1", "0,3"] })).toBe(false);
  });
});

describe("apply / win / finish-out / margin", () => {
  it("alternates turns while playing", () => {
    const s0 = newGame("2026-07-10T00:00:00Z");
    const s1 = applyMove(s0, { color: 1, path: ["1,-5", "1,-4"] });
    expect(s1.toMove).toBe(1);
    expect(s1.phase).toBe("playing");
    const s2 = applyMove(s1, { color: 4, path: ["-1,5", "-1,4"] });
    expect(s2.toMove).toBe(0);
    expect(s2.history.length).toBe(2);
  });
  it("winning move enters finishOut; loser moves every turn; margin counts turns", () => {
    const s = nearWinState([["1,-4", "1,-5"], ["2,-4", "2,-5"]]);
    const win = applyMove(s, { color: 2, path: ["-4,1", "-5,1"] });
    expect(win.phase).toBe("finishOut");
    expect(win.winner).toBe(0);
    expect(win.toMove).toBe(1);
    expect(marginSoFar(win)).toBe(0);
    expect(validateMove(win, { color: 2, path: ["-5,1", "-5,2"] })).toBe(false); // winner done
    const f1 = applyMove(win, { color: 4, path: ["1,-4", "1,-5"] });
    expect(f1.phase).toBe("finishOut");
    expect(f1.toMove).toBe(1); // loser again — no alternation
    expect(marginSoFar(f1)).toBe(1);
    const f2 = applyMove(f1, { color: 4, path: ["2,-4", "2,-5"] });
    expect(f2.phase).toBe("done");
    expect(marginSoFar(f2)).toBe(2);
    expect(validateMove(f2, { color: 4, path: ["1,-5", "1,-4"] })).toBe(false); // game over
  });
  it("playerFinished demands all 30 home", () => {
    const s = nearWinState([["1,-4", "1,-5"]]);
    expect(playerFinished(s.pieces, 0)).toBe(false);
    const done = applyMove(s, { color: 2, path: ["-4,1", "-5,1"] });
    expect(playerFinished(done.pieces, 0)).toBe(true);
  });
  it("no camping rule: an opponent piece in a target cell just means you aren't done", () => {
    const s = nearWinState([["1,-4", "1,-5"]]);
    const camped = { ...s.pieces, "-5,1": 4 as const }; // opponent sits in color 2's last cell
    expect(playerFinished(camped, 0)).toBe(false);
  });
});

describe("undo & serialization", () => {
  it("undo exactly inverts apply, including across the winning move", () => {
    const s0 = newGame("2026-07-10T00:00:00Z");
    const moves: Move[] = [
      { color: 1, path: ["1,-5", "1,-4"] },
      { color: 4, path: ["-1,5", "-1,4"] },
      { color: 0, path: ["-1,-4", "0,-4"] },
    ];
    let s = s0;
    for (const m of moves) {
      expect(validateMove(s, m)).toBe(true);
      s = applyMove(s, m);
    }
    expect(undoMove(undoMove(undoMove(s)))).toEqual(s0);

    const near = nearWinState([["1,-4", "1,-5"]]);
    const won = applyMove(near, { color: 2, path: ["-4,1", "-5,1"] });
    const back = undoMove(won);
    expect(back.phase).toBe("playing");
    expect(back.winner).toBeNull();
    expect(back.winIndex).toBeNull();
    expect(back.pieces).toEqual(near.pieces);
    expect(back.toMove).toBe(0);
  });
  it("GameState survives a JSON round-trip", () => {
    const s = applyMove(newGame("2026-07-10T00:00:00Z"), { color: 1, path: ["1,-5", "1,-4"] });
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
  it("undo on empty history is a no-op", () => {
    const s0 = newGame("2026-07-10T00:00:00Z");
    expect(undoMove(s0)).toEqual(s0);
  });
});
