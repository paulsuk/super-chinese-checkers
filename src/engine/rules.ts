import { add, cellId, hopVector, parseId, scale, sub, classifyDir, DIRS } from "./coords";
import type { Axial } from "./coords";
import { CELLS, axisOfColor } from "./board";
import type { CellId, ColorId } from "./types";

export type Pieces = Record<CellId, ColorId>;

const isEmpty = (pieces: Pieces, id: CellId): boolean => !(id in pieces);

const dirAllowed = (color: ColorId, dir: Axial): boolean =>
  classifyDir(dir, axisOfColor(color)) !== "backward";

/** Step legality. `pieces` has the mover lifted (origin removed). */
export function isLegalStep(pieces: Pieces, color: ColorId, from: CellId, to: CellId): boolean {
  if (!CELLS.has(to) || !isEmpty(pieces, to)) return false;
  const delta = sub(parseId(to), parseId(from));
  const dir = DIRS.find((d) => d.q === delta.q && d.r === delta.r);
  return dir !== undefined && dirAllowed(color, dir);
}

/** Symmetric-hop legality. `pieces` has the mover lifted (origin removed). */
export function isLegalHop(pieces: Pieces, color: ColorId, from: CellId, to: CellId): boolean {
  if (!CELLS.has(to) || !isEmpty(pieces, to)) return false;
  const hv = hopVector(sub(parseId(to), parseId(from)));
  if (!hv || !dirAllowed(color, hv.dir)) return false;
  const origin = parseId(from);
  for (let i = 1; i < 2 * hv.k; i++) {
    const cell = cellId(add(origin, scale(hv.dir, i)));
    if (!CELLS.has(cell)) return false; // the whole line of holes must exist
    if (i === hv.k) {
      if (isEmpty(pieces, cell)) return false; // pivot must hold a piece (any color)
    } else if (!isEmpty(pieces, cell)) {
      return false; // every other cell strictly between from and landing must be empty
    }
  }
  return true;
}
