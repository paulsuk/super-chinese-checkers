import { describe, expect, it } from "vitest";
import { AUTOPILOT_BRAIN, BOTS, botById, isCheer, lineText } from "../../src/bots/profiles";

describe("profiles", () => {
  it("ships mia, june, lilibeth ordered by difficulty", () => {
    expect(BOTS.map((b) => b.id)).toEqual(["mia", "june", "lilibeth"]);
    expect(BOTS.map((b) => b.difficulty)).toEqual([1, 2, 3]);
  });
  it("ids are unique, palettes are 3 hexes, all pools are non-empty", () => {
    expect(new Set(BOTS.map((b) => b.id)).size).toBe(BOTS.length);
    for (const b of BOTS) {
      expect(b.palette).toHaveLength(3);
      for (const hex of b.palette) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
      for (const pool of Object.values(b.lines)) expect(pool.length).toBeGreaterThan(0);
      expect(b.think.minMs).toBeLessThan(b.think.maxMs);
    }
  });
  it("botById looks up and misses safely", () => {
    expect(botById("june")?.name).toBe("June-y");
    expect(botById("nope")).toBeNull();
  });
  it("autopilot brain is deterministic (temperature 0, topK 1)", () => {
    expect(AUTOPILOT_BRAIN.temperature).toBe(0);
    expect(AUTOPILOT_BRAIN.topK).toBe(1);
  });
  it("line helpers unwrap plain and cheer lines", () => {
    expect(lineText("hi")).toBe("hi");
    expect(lineText({ text: "GO", cheer: true })).toBe("GO");
    expect(isCheer("hi")).toBe(false);
    expect(isCheer({ text: "GO", cheer: true })).toBe(true);
  });
});
