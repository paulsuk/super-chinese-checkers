import { describe, it, expect } from "vitest";
import { isLegalStep, isLegalHop } from "../../src/engine/rules";
import type { Pieces } from "../../src/engine/rules";
import { CELL_MAP, axisOfColor } from "../../src/engine/board";
import { DIRS, classifyDir, add, scale, cellId } from "../../src/engine/coords";
import type { ColorId } from "../../src/engine/types";

describe("isLegalStep (color 1: N->S)", () => {
  it("allows forward and sideways steps to empty cells", () => {
    const empty: Pieces = {};
    expect(isLegalStep(empty, 1, "0,0", "0,1")).toBe(true);   // SE forward
    expect(isLegalStep(empty, 1, "0,0", "-1,1")).toBe(true);  // SW forward
    expect(isLegalStep(empty, 1, "0,0", "1,0")).toBe(true);   // E sideways
    expect(isLegalStep(empty, 1, "0,0", "-1,0")).toBe(true);  // W sideways
  });
  it("rejects backward steps", () => {
    expect(isLegalStep({}, 1, "0,0", "1,-1")).toBe(false); // NE
    expect(isLegalStep({}, 1, "0,0", "0,-1")).toBe(false); // NW
  });
  it("rejects occupied, off-board, and non-adjacent destinations", () => {
    expect(isLegalStep({ "0,1": 4 }, 1, "0,0", "0,1")).toBe(false); // occupied
    expect(isLegalStep({}, 1, "4,-8", "5,-8")).toBe(false);          // E from N tip: off-board
    expect(isLegalStep({}, 1, "0,0", "0,2")).toBe(false);            // distance 2 is not a step
  });
});

describe("isLegalHop (color 1: N->S)", () => {
  it("allows the classic adjacent hop (k=1)", () => {
    expect(isLegalHop({ "0,1": 4 }, 1, "0,0", "0,2")).toBe(true);
  });
  it("allows the symmetric long hop (k=2): x _ o _ _ -> lands 2 beyond pivot", () => {
    expect(isLegalHop({ "0,2": 4 }, 1, "0,0", "0,4")).toBe(true);
  });
  it("pivot may be own color or opponent's", () => {
    expect(isLegalHop({ "0,1": 1 }, 1, "0,0", "0,2")).toBe(true);
    expect(isLegalHop({ "0,1": 5 }, 1, "0,0", "0,2")).toBe(true);
  });
  it("rejects: piece between mover and pivot", () => {
    expect(isLegalHop({ "0,1": 3, "0,2": 4 }, 1, "0,0", "0,4")).toBe(false);
  });
  it("rejects: piece between pivot and landing", () => {
    expect(isLegalHop({ "0,2": 4, "0,3": 3 }, 1, "0,0", "0,4")).toBe(false);
  });
  it("rejects: occupied landing, missing pivot, odd distance", () => {
    expect(isLegalHop({ "0,1": 4, "0,2": 3 }, 1, "0,0", "0,2")).toBe(false); // landing occupied
    expect(isLegalHop({}, 1, "0,0", "0,2")).toBe(false);                      // nothing to jump
    expect(isLegalHop({ "0,1": 4 }, 1, "0,0", "0,3")).toBe(false);            // odd distance
  });
  it("rejects backward hops even when geometrically valid", () => {
    expect(isLegalHop({ "0,-1": 4 }, 1, "0,0", "0,-2")).toBe(false); // NW backward
  });
  it("rejects hops whose line leaves the board (across a notch)", () => {
    // E line from N tip "4,-8": "5,-8" is off-board, so even a would-be pivot there fails
    expect(isLegalHop({ "5,-8": 4 }, 1, "4,-8", "6,-8")).toBe(false);
  });
});

describe("no backward motion — exhaustive (spec property test)", () => {
  it("for every color, cell, and backward direction: step and k=1 hop are illegal", () => {
    for (const color of [0, 1, 2, 3, 4, 5] as ColorId[]) {
      const axis = axisOfColor(color);
      for (const dir of DIRS) {
        if (classifyDir(dir, axis) !== "backward") continue;
        for (const [from, a] of CELL_MAP) {
          const step = cellId(add(a, dir));
          const pivot = cellId(add(a, dir));
          const land = cellId(add(a, scale(dir, 2)));
          expect(isLegalStep({}, color, from, step)).toBe(false);
          expect(isLegalHop({ [pivot]: 0 }, color, from, land)).toBe(false);
        }
      }
    }
  });
});
