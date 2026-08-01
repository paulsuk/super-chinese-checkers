import { describe, expect, it } from "vitest";
import { hopDestinations, movesForColor, movesForPlayer } from "../../src/engine/moves";
import { newGame, validateMove } from "../../src/engine/rules";
import type { Pieces } from "../../src/engine/rules";
import { CELLS } from "../../src/engine/board";
import type { ColorId, GameState, Move } from "../../src/engine/types";

// Color 3 starts SW, targets NE: east and north-east are forward; color 1 (N->S): east is sideways.

describe("hopDestinations", () => {
  it("finds a simple k=1 hop and its path", () => {
    const pieces: Pieces = { "0,0": 3, "1,0": 0 };
    const dests = hopDestinations(pieces, 3, "0,0");
    expect(dests).toContainEqual({ to: "2,0", path: ["0,0", "2,0"] });
  });

  it("chains hops and returns the shortest path per destination", () => {
    const pieces: Pieces = { "0,0": 3, "1,0": 0, "3,0": 0 };
    const dests = hopDestinations(pieces, 3, "0,0");
    const far = dests.find((d) => d.to === "4,0");
    expect(far?.path).toEqual(["0,0", "2,0", "4,0"]);
  });

  it("dedupes converging chains: destinations are unique", () => {
    const pieces: Pieces = { "0,0": 3, "1,0": 0, "3,0": 0, "2,1": 1, "0,1": 2 };
    const dests = hopDestinations(pieces, 3, "0,0");
    const tos = dests.map((d) => d.to);
    expect(new Set(tos).size).toBe(tos.length);
    expect(tos).not.toContain("0,0"); // never returns the origin
  });

  it("terminates on cyclic chains (hop east then back west)", () => {
    // For color 1 (N->S axis) both E and W are sideways => allowed; the return
    // hop to the origin must hit the visited set, not loop forever.
    const pieces: Pieces = { "0,0": 1, "1,0": 0 };
    const dests = hopDestinations(pieces, 1, "0,0");
    expect(dests.map((d) => d.to)).toEqual(["2,0"]);
  });

  it("does not hop when the landing cell is occupied or off-board", () => {
    const blocked: Pieces = { "0,0": 3, "1,0": 0, "2,0": 5 };
    expect(hopDestinations(blocked, 3, "0,0")).toEqual([]);
  });

  it("respects per-hop direction legality (no backward hops)", () => {
    // Color 0 starts NW, targets SE; a pure north-west-ish hop must not appear.
    const pieces: Pieces = { "0,0": 0, "0,-1": 5 };
    const dests = hopDestinations(pieces, 0, "0,0");
    expect(dests.map((d) => d.to)).not.toContain("0,-2");
  });
});

describe("movesForColor / movesForPlayer", () => {
  it("single-leg moves exactly match brute force over validateMove", () => {
    const state = newGame("2026-01-01T00:00:00.000Z");
    for (const color of [0, 3] as ColorId[]) {
      const stateFor: GameState = { ...state, toMove: color < 3 ? 0 : 1 };
      const brute = new Set<string>();
      for (const [from, c] of Object.entries(state.pieces)) {
        if (c !== color) continue;
        for (const to of CELLS) {
          const m: Move = { color, path: [from, to] };
          if (validateMove(stateFor, m)) brute.add(`${from}>${to}`);
        }
      }
      const gen = new Set(
        movesForColor(state.pieces, color)
          .filter((m) => m.path.length === 2)
          .map((m) => `${m.path[0]}>${m.path[1]}`),
      );
      expect(gen).toEqual(brute);
    }
  });

  it("every generated move (including chains) passes validateMove", () => {
    const state = newGame("2026-01-01T00:00:00.000Z");
    const moves = movesForPlayer(state);
    expect(moves.length).toBeGreaterThan(0);
    for (const m of moves) expect(validateMove(state, m)).toBe(true);
  });

  it("movesForPlayer covers all three colors of the mover", () => {
    const state = newGame("2026-01-01T00:00:00.000Z");
    const colors = new Set(movesForPlayer(state).map((m) => m.color));
    expect(colors).toEqual(new Set([0, 1, 2]));
  });
});
