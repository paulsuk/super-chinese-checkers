import { add, cellId, parseId, scale } from "./coords";
import type { Axial } from "./coords";
import { CELLS, COLORS_OF_PLAYER, legalDirs } from "./board";
import { isLegalStep } from "./rules";
import type { Pieces } from "./rules";
import type { CellId, ColorId, GameState, Move } from "./types";

export interface HopDestination { to: CellId; path: CellId[]; }

/**
 * The one legal hop from `from` along `dir`, or null. The pivot must be the
 * FIRST piece along the line (any gap cell must exist and be empty), landing
 * mirrors the pivot distance. `pieces` must already have the mover lifted.
 */
function hopInDir(pieces: Pieces, from: Axial, dir: Axial): CellId | null {
  for (let d = 1; ; d++) {
    const c = cellId(add(from, scale(dir, d)));
    if (!CELLS.has(c)) return null; // ran off the board before finding a pivot
    if (!(c in pieces)) continue;
    const land = cellId(add(from, scale(dir, 2 * d)));
    if (!CELLS.has(land) || land in pieces) return null;
    for (let i = d + 1; i < 2 * d; i++) {
      const mid = cellId(add(from, scale(dir, i)));
      if (!CELLS.has(mid) || mid in pieces) return null;
    }
    return land;
  }
}

/** All hop-chain destinations from `from`, shortest path each, origin excluded. */
export function hopDestinations(pieces: Pieces, color: ColorId, from: CellId): HopDestination[] {
  const lifted: Pieces = { ...pieces };
  delete lifted[from];
  const dirs = legalDirs(color);
  const pathTo = new Map<CellId, CellId[]>([[from, [from]]]);
  const queue: CellId[] = [from];
  const out: HopDestination[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curAxial = parseId(cur);
    for (const dir of dirs) {
      const land = hopInDir(lifted, curAxial, dir);
      if (land === null || pathTo.has(land)) continue;
      const path = [...pathTo.get(cur)!, land];
      pathTo.set(land, path);
      out.push({ to: land, path });
      queue.push(land);
    }
  }
  return out;
}

export function movesForColor(pieces: Pieces, color: ColorId): Move[] {
  const moves: Move[] = [];
  for (const [from, c] of Object.entries(pieces)) {
    if (c !== color) continue;
    const lifted: Pieces = { ...pieces };
    delete lifted[from];
    const origin = parseId(from);
    for (const dir of legalDirs(color)) {
      const to = cellId(add(origin, dir));
      if (isLegalStep(lifted, color, from, to)) moves.push({ color, path: [from, to] });
    }
    for (const h of hopDestinations(pieces, color, from)) moves.push({ color, path: h.path });
  }
  return moves;
}

export function movesForPlayer(state: GameState): Move[] {
  return COLORS_OF_PLAYER[state.toMove]!.flatMap((c) => movesForColor(state.pieces, c));
}
