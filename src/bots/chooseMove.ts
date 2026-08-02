import { COLORS_OF_PLAYER } from "../engine/board";
import { movesForColor, movesForPlayer } from "../engine/moves";
import { applyMove } from "../engine/rules";
import type { Pieces } from "../engine/rules";
import type { CellId, ColorId, GameState, Move, PlayerId } from "../engine/types";
import { progressOf, scoreMove } from "./evaluate";
import type { BrainConfig, Weights } from "./types";

export type Rng = () => number;

/**
 * How many plies back the `revisit` penalty remembers vacated cells. Raw plies, so it spans
 * about 8 of the brain's own moves during normal play but a full 16 during finishOut, where
 * only the loser moves — which is the phase that needs it most.
 */
export const REVISIT_WINDOW = 16;

const vacatedKey = (color: ColorId, cell: CellId): string => `${color}:${cell}`;

/** `color:cell` keys for every cell vacated in the last REVISIT_WINDOW plies. */
function recentlyVacated(history: readonly Move[]): Set<string> {
  const out = new Set<string>();
  for (let i = Math.max(0, history.length - REVISIT_WINDOW); i < history.length; i++) {
    const m = history[i]!;
    out.add(vacatedKey(m.color, m.path[0]!));
  }
  return out;
}

/** Best single-move forward progress available to `player` (floor 0). */
export function bestProgressFor(pieces: Pieces, player: PlayerId): number {
  let best = 0;
  for (const c of COLORS_OF_PLAYER[player]!) {
    for (const m of movesForColor(pieces, c)) best = Math.max(best, progressOf(m));
  }
  return best;
}

interface Scored { m: Move; s: number; }

function applyReplyCheck(state: GameState, top: Scored[], w: Weights): Scored[] {
  const opp = (1 - state.toMove) as PlayerId;
  const before = bestProgressFor(state.pieces, opp);
  return top
    .map(({ m, s }) => {
      const after = bestProgressFor(applyMove(state, m).pieces, opp);
      return { m, s: s - w.gift * Math.max(0, after - before) };
    })
    .sort((a, b) => b.s - a.s);
}

export function chooseMove(state: GameState, brain: BrainConfig, rng: Rng): Move {
  const moves = movesForPlayer(state);
  if (moves.length === 0) throw new Error("no legal moves");
  const revisit = brain.weights.revisit ?? 0;
  const vacated = revisit === 0 ? null : recentlyVacated(state.history);
  const scored: Scored[] = moves
    .map((m) => {
      let s = scoreMove(state.pieces, m, brain.weights);
      const to = m.path[m.path.length - 1]!;
      if (vacated !== null && vacated.has(vacatedKey(m.color, to))) s -= revisit;
      return { m, s };
    })
    .sort((a, b) => b.s - a.s);
  let top = scored.slice(0, Math.max(1, brain.topK));
  if (brain.replyCheck && state.phase === "playing") {
    top = applyReplyCheck(state, top, brain.weights);
  }
  if (brain.temperature === 0) return top[0]!.m;
  const max = top[0]!.s;
  const weights = top.map(({ s }) => Math.exp((s - max) / brain.temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < top.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return top[i]!.m;
  }
  return top[top.length - 1]!.m;
}
