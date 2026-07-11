import { describe, it, expect } from "vitest";
import {
  CELLS, cornerCells, startCells, targetCells, initialPieces,
  legalDirs, CORNER_OF_COLOR, TARGET_OF,
} from "../../src/engine/board";
import type { ColorId } from "../../src/engine/types";

const COLORS = [0, 1, 2, 3, 4, 5] as ColorId[];
const NAMES = ["N", "NE", "SE", "S", "SW", "NW"] as const;

describe("star board", () => {
  it("has exactly 121 cells", () => {
    expect(CELLS.size).toBe(121);
  });
  it("has 6 disjoint 10-cell corner triangles (60 corner cells total)", () => {
    const seen = new Set<string>();
    for (const n of NAMES) {
      const cells = cornerCells(n);
      expect(cells.size).toBe(10);
      for (const c of cells) {
        expect(seen.has(c)).toBe(false);
        seen.add(c);
      }
    }
    expect(seen.size).toBe(60);
  });
  it("contains the tip cells at the expected coordinates", () => {
    expect(cornerCells("N").has("4,-8")).toBe(true);
    expect(cornerCells("S").has("-4,8")).toBe(true);
    expect(cornerCells("NE").has("8,-4")).toBe(true);
    expect(cornerCells("SW").has("-8,4")).toBe(true);
    expect(cornerCells("NW").has("-4,-4")).toBe(true);
    expect(cornerCells("SE").has("4,4")).toBe(true);
  });
});

describe("colors", () => {
  it("every color has exactly 4 legal directions (2 forward + 2 sideways)", () => {
    for (const c of COLORS) expect(legalDirs(c).length).toBe(4);
  });
  it("each color targets the corner opposite its start", () => {
    for (const c of COLORS) {
      expect(targetCells(c)).toBe(cornerCells(TARGET_OF[CORNER_OF_COLOR[c]!]));
    }
  });
  it("initial layout: 60 pieces, 10 per color, each inside its start corner", () => {
    const pieces = initialPieces();
    expect(Object.keys(pieces).length).toBe(60);
    for (const c of COLORS) {
      const cells = Object.entries(pieces).filter(([, col]) => col === c);
      expect(cells.length).toBe(10);
      for (const [id] of cells) expect(startCells(c).has(id)).toBe(true);
    }
  });
});
