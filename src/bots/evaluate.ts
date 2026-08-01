import { axisOfColor, targetCells } from "../engine/board";
import { parseId, units } from "../engine/coords";
import type { Pieces } from "../engine/rules";
import type { CellId, ColorId, Move } from "../engine/types";
import type { Weights } from "./types";

/** Exact integer position along the color's forward axis. One full step = 48. */
export function forwardValue(color: ColorId, cell: CellId): number {
  const u = units(parseId(cell));
  const a = axisOfColor(color);
  return u.ux * a.ux + 3 * u.uy * a.uy;
}

export function progressOf(move: Move): number {
  const { color, path } = move;
  return (forwardValue(color, path[path.length - 1]!) - forwardValue(color, path[0]!)) / 48;
}

// Per color: target cell -> fill rank, deepest (highest forwardValue) = 10 .. shallowest = 1.
const HOME_RANKS: ReadonlyMap<CellId, number>[] = ([0, 1, 2, 3, 4, 5] as ColorId[]).map((c) => {
  const sorted = [...targetCells(c)].sort((a, b) => forwardValue(c, b) - forwardValue(c, a));
  return new Map(sorted.map((id, i) => [id, 10 - i]));
});

export const homeRank = (color: ColorId, cell: CellId): number =>
  HOME_RANKS[color]!.get(cell) ?? 0;

export function scoreMove(pieces: Pieces, move: Move, w: Weights): number {
  const { color, path } = move;
  const from = path[0]!;
  const to = path[path.length - 1]!;
  const progress = progressOf(move);
  let score = w.forward * progress;
  if (progress > 0 && w.straggler !== 0) {
    let maxVal = -Infinity;
    for (const [id, c] of Object.entries(pieces)) {
      if (c === color) maxVal = Math.max(maxVal, forwardValue(color, id));
    }
    score += w.straggler * ((maxVal - forwardValue(color, from)) / 48);
  }
  score += w.homeFill * (homeRank(color, to) - homeRank(color, from));
  score += w.chain * Math.max(0, path.length - 2);
  return score;
}
