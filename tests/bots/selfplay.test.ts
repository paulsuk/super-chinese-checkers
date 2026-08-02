import { describe, expect, it } from "vitest";
import { chooseMove } from "../../src/bots/chooseMove";
import { BOTS } from "../../src/bots/profiles";
import type { BrainConfig } from "../../src/bots/types";
import { applyMove, newGame } from "../../src/engine/rules";
import type { GameState, PlayerId } from "../../src/engine/types";
import { mulberry32 } from "../helpers/rng";

const CAP = 1000; // plies; way above any real game

function playGame(p0: BrainConfig, p1: BrainConfig, seed: number): GameState {
  const rng = mulberry32(seed);
  let s = newGame("2026-01-01T00:00:00.000Z");
  while (s.phase !== "done" && s.history.length < CAP) {
    s = applyMove(s, chooseMove(s, s.toMove === 0 ? p0 : p1, rng));
  }
  return s;
}

/** Plays n games alternating sides; returns wins for brain A. */
function record(a: BrainConfig, b: BrainConfig, n: number): { aWins: number; done: number } {
  let aWins = 0;
  let done = 0;
  for (let i = 0; i < n; i++) {
    const aIsP0 = i % 2 === 0;
    const s = aIsP0 ? playGame(a, b, i) : playGame(b, a, i);
    if (s.phase === "done") done++;
    const aPlayer: PlayerId = aIsP0 ? 0 : 1;
    if (s.winner === aPlayer) aWins++;
  }
  return { aWins, done };
}

const [mia, june, lilibeth] = BOTS.map((b) => b.brain);

describe("self-play", () => {
  it("every game terminates", () => {
    const r1 = record(june!, mia!, 25);
    const r2 = record(lilibeth!, june!, 25);
    expect(r1.done).toBe(25);
    expect(r2.done).toBe(25);
  }, 240_000);

  it("difficulty ordering holds: june beats mia, lilibeth beats june", () => {
    expect(record(june!, mia!, 25).aWins).toBeGreaterThanOrEqual(17);
    expect(record(lilibeth!, june!, 25).aWins).toBeGreaterThanOrEqual(15);
  }, 240_000);
});
