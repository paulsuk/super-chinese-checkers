import { cellId, classifyDir, DIRS } from "./coords";
import type { Axial, Units } from "./coords";
import type { CellId, ColorId, PlayerId } from "./types";

export type CornerName = "N" | "NE" | "SE" | "S" | "SW" | "NW";

// ColorId -> start corner. Player 0 = top half (NW, N, NE); player 1 = bottom half.
export const CORNER_OF_COLOR: readonly CornerName[] = ["NW", "N", "NE", "SW", "S", "SE"];
export const TARGET_OF: Record<CornerName, CornerName> = {
  N: "S", S: "N", NE: "SW", SW: "NE", NW: "SE", SE: "NW",
};
export const OWNER_OF_COLOR: readonly PlayerId[] = [0, 0, 0, 1, 1, 1];
export const COLORS_OF_PLAYER: readonly ColorId[][] = [[0, 1, 2], [3, 4, 5]];

// Star = union of two side-13 triangles in cube coords (x=q, y=-q-r, z=r).
function generateCells(): Map<CellId, Axial> {
  const m = new Map<CellId, Axial>();
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      const x = q, z = r, y = -q - r;
      const inUp = x >= -4 && y >= -4 && z >= -4;
      const inDown = x <= 4 && y <= 4 && z <= 4;
      if (inUp || inDown) m.set(cellId({ q, r }), { q, r });
    }
  }
  return m;
}

export const CELL_MAP: ReadonlyMap<CellId, Axial> = generateCells();
export const CELLS: ReadonlySet<CellId> = new Set(CELL_MAP.keys());

function cornerOf(a: Axial): CornerName | null {
  const y = -a.q - a.r;
  if (a.r <= -5) return "N";
  if (a.r >= 5) return "S";
  if (a.q >= 5) return "NE";
  if (a.q <= -5) return "SW";
  if (y >= 5) return "NW";
  if (y <= -5) return "SE";
  return null;
}

const cornerSets = new Map<CornerName, Set<CellId>>(
  (["N", "NE", "SE", "S", "SW", "NW"] as CornerName[]).map((n) => [n, new Set()]),
);
for (const [id, a] of CELL_MAP) {
  const c = cornerOf(a);
  if (c) cornerSets.get(c)!.add(id);
}
export const cornerCells = (c: CornerName): ReadonlySet<CellId> => cornerSets.get(c)!;

export const startCells = (color: ColorId): ReadonlySet<CellId> =>
  cornerCells(CORNER_OF_COLOR[color]!);
export const targetCells = (color: ColorId): ReadonlySet<CellId> =>
  cornerCells(TARGET_OF[CORNER_OF_COLOR[color]!]);

// Tip positions in integer units (ux = 2q+r, uy = r) — see plan "Board geometry".
const TIP_UNITS: Record<CornerName, Units> = {
  N: { ux: 0, uy: -8 }, S: { ux: 0, uy: 8 },
  NE: { ux: 12, uy: -4 }, SW: { ux: -12, uy: 4 },
  NW: { ux: -12, uy: -4 }, SE: { ux: 12, uy: 4 },
};

export function axisOfColor(color: ColorId): Units {
  const start = TIP_UNITS[CORNER_OF_COLOR[color]!];
  const target = TIP_UNITS[TARGET_OF[CORNER_OF_COLOR[color]!]];
  return { ux: target.ux - start.ux, uy: target.uy - start.uy };
}

const legalDirsByColor: readonly Axial[][] = ([0, 1, 2, 3, 4, 5] as ColorId[]).map((c) =>
  DIRS.filter((d) => classifyDir(d, axisOfColor(c)) !== "backward"),
);
export const legalDirs = (color: ColorId): readonly Axial[] => legalDirsByColor[color]!;

export function initialPieces(): Record<CellId, ColorId> {
  const pieces: Record<CellId, ColorId> = {};
  for (const c of [0, 1, 2, 3, 4, 5] as ColorId[]) {
    for (const id of startCells(c)) pieces[id] = c;
  }
  return pieces;
}
