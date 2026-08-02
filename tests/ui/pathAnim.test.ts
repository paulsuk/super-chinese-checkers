import { describe, expect, it } from "vitest";
import { pointAlongPath } from "../../src/ui/pathAnim";

const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 20 }];

describe("pointAlongPath", () => {
  it("clamps to endpoints", () => {
    expect(pointAlongPath(pts, -0.5)).toEqual({ x: 0, y: 0 });
    expect(pointAlongPath(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlongPath(pts, 1)).toEqual({ x: 10, y: 20 });
    expect(pointAlongPath(pts, 2)).toEqual({ x: 10, y: 20 });
  });
  it("hits interior waypoints at leg boundaries", () => {
    expect(pointAlongPath(pts, 0.5)).toEqual({ x: 10, y: 0 });
  });
  it("moves within the correct leg", () => {
    const p = pointAlongPath(pts, 0.25); // middle of leg 1, eased => halfway
    expect(p.y).toBe(0);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(10);
    expect(pointAlongPath(pts, 0.75).x).toBe(10);
  });
  it("handles a single-leg path", () => {
    expect(pointAlongPath([{ x: 0, y: 0 }, { x: 4, y: 0 }], 0.5)).toEqual({ x: 2, y: 0 });
  });
});
