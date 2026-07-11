import type { CellId } from "./types";

export interface Axial { q: number; r: number; }
export interface Units { ux: number; uy: number; }

export const cellId = (a: Axial): CellId => `${a.q},${a.r}`;
export const parseId = (id: CellId): Axial => {
  const [q, r] = id.split(",").map(Number);
  return { q: q!, r: r! };
};

// Order matters and is relied on by tests/UI: E, NE, NW, W, SW, SE
export const DIRS: readonly Axial[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

export const add = (a: Axial, b: Axial): Axial => ({ q: a.q + b.q, r: a.r + b.r });
export const sub = (a: Axial, b: Axial): Axial => ({ q: a.q - b.q, r: a.r - b.r });
export const scale = (a: Axial, k: number): Axial => ({ q: a.q * k, r: a.r * k });

// Integer cartesian-proportional units: ux in halves of sqrt(3), uy in halves of 3.
// Exact dot product: a.ux*b.ux + 3*a.uy*b.uy  (no floating point anywhere).
export const units = (a: Axial): Units => ({ ux: 2 * a.q + a.r, uy: a.r });

export type DirClass = "forward" | "sideways" | "backward";

export function classifyDir(dir: Axial, axis: Units): DirClass {
  const d = units(dir);
  const dot = d.ux * axis.ux + 3 * d.uy * axis.uy;
  return dot > 0 ? "forward" : dot === 0 ? "sideways" : "backward";
}

/** Decompose delta = 2k * dir for one of the 6 DIRS with integer k >= 1, else null. */
export function hopVector(delta: Axial): { dir: Axial; k: number } | null {
  for (const dir of DIRS) {
    // colinear, same orientation, even positive multiple
    const m = dir.q !== 0 ? delta.q / dir.q : delta.r / dir.r;
    if (!Number.isInteger(m) || m <= 0) continue;
    if (delta.q !== dir.q * m || delta.r !== dir.r * m) continue;
    if (m % 2 !== 0) return null; // on a hex line but odd distance: never a hop
    return { dir, k: m / 2 };
  }
  return null;
}
