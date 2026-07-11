import { describe, it, expect } from "vitest";
import { cellId, parseId, DIRS, add, sub, scale, units, classifyDir, hopVector } from "../../src/engine/coords";

describe("cell ids", () => {
  it("round-trips", () => {
    expect(parseId(cellId({ q: -3, r: 7 }))).toEqual({ q: -3, r: 7 });
    expect(cellId({ q: 0, r: 0 })).toBe("0,0");
  });
});

describe("classifyDir", () => {
  // Color starting N traveling S: axis = S tip - N tip = (0,16) in units.
  const axisNtoS = { ux: 0, uy: 16 };
  it("N->S color: SE,SW forward; E,W sideways; NE,NW backward", () => {
    const byName = Object.fromEntries(
      (["E", "NE", "NW", "W", "SW", "SE"] as const).map((n, i) => [n, DIRS[i]!]),
    );
    expect(classifyDir(byName.SE!, axisNtoS)).toBe("forward");
    expect(classifyDir(byName.SW!, axisNtoS)).toBe("forward");
    expect(classifyDir(byName.E!, axisNtoS)).toBe("sideways");
    expect(classifyDir(byName.W!, axisNtoS)).toBe("sideways");
    expect(classifyDir(byName.NE!, axisNtoS)).toBe("backward");
    expect(classifyDir(byName.NW!, axisNtoS)).toBe("backward");
  });
  it("NE->SW color: W,SW forward; NW,SE sideways; E,NE backward", () => {
    const axis = { ux: -24, uy: 8 }; // SW tip (-12,4) minus NE tip (12,-4)
    const byName = Object.fromEntries(
      (["E", "NE", "NW", "W", "SW", "SE"] as const).map((n, i) => [n, DIRS[i]!]),
    );
    expect(classifyDir(byName.W!, axis)).toBe("forward");
    expect(classifyDir(byName.SW!, axis)).toBe("forward");
    expect(classifyDir(byName.NW!, axis)).toBe("sideways");
    expect(classifyDir(byName.SE!, axis)).toBe("sideways");
    expect(classifyDir(byName.E!, axis)).toBe("backward");
    expect(classifyDir(byName.NE!, axis)).toBe("backward");
  });
});

describe("hopVector", () => {
  it("decomposes an even multiple of a direction", () => {
    // 2 * SE(0,1) => k=1 hop; 6 * E(1,0) => k=3 hop
    expect(hopVector({ q: 0, r: 2 })).toEqual({ dir: { q: 0, r: 1 }, k: 1 });
    expect(hopVector({ q: 6, r: 0 })).toEqual({ dir: { q: 1, r: 0 }, k: 3 });
  });
  it("rejects odd multiples, non-colinear, and zero deltas", () => {
    expect(hopVector({ q: 3, r: 0 })).toBeNull();  // odd multiple
    expect(hopVector({ q: 2, r: 1 })).toBeNull();  // not on a hex line
    expect(hopVector({ q: 0, r: 0 })).toBeNull();
  });
});
