import { CORNER_OF_COLOR, TARGET_OF, axisOfColor, cornerCells, targetCells } from "../engine/board";
import type { CornerName } from "../engine/board";
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

// Row depth inside a corner triangle: 1 on the mouth row (4 cells) .. 4 at the tip.
// Rows are the distinct forward values of the color that targets that corner.
const CORNER_DEPTH: ReadonlyMap<CellId, number> = (() => {
  const depth = new Map<CellId, number>();
  const corners: CornerName[] = ["N", "NE", "SE", "S", "SW", "NW"];
  for (const name of corners) {
    const inward = ([0, 1, 2, 3, 4, 5] as ColorId[]).find(
      (c) => TARGET_OF[CORNER_OF_COLOR[c]!] === name,
    )!;
    const cells = [...cornerCells(name)];
    const rows = [...new Set(cells.map((id) => forwardValue(inward, id)))].sort((a, b) => a - b);
    for (const id of cells) depth.set(id, rows.indexOf(forwardValue(inward, id)) + 1);
  }
  return depth;
})();

/**
 * How deep `cell` sits in a corner this color has no business being in — 0 for the
 * open middle and for the color's own target corner, 1 (mouth) .. 4 (tip) elsewhere,
 * including the color's start corner. Corner tips are near-dead-ends: a piece parked
 * in one blocks the corner's rightful color forever and often cannot get out again.
 */
export function strayDepth(color: ColorId, cell: CellId): number {
  const d = CORNER_DEPTH.get(cell);
  if (d === undefined || HOME_RANKS[color]!.has(cell)) return 0;
  return d;
}

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
  if (w.stray) score += w.stray * (strayDepth(color, from) - strayDepth(color, to));
  return score;
}
