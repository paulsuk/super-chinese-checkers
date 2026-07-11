import { describe, it, expect } from "vitest";
import { applyDrop, placeFirstEmpty, clearSlot } from "../../src/ui/setupDraft";

const P = (...v: (string | null)[]) => v;

describe("applyDrop", () => {
  it("tray → empty slot fills it", () => {
    expect(applyDrop(P(null, null, null, null, null, null), { hex: "#a", from: "tray" }, 2))
      .toEqual(P(null, null, "#a", null, null, null));
  });
  it("tray → occupied slot replaces; displaced color is no longer present", () => {
    const out = applyDrop(P("#a", null, null, null, null, null), { hex: "#b", from: "tray" }, 0);
    expect(out[0]).toBe("#b");
    expect(out.includes("#a")).toBe(false);
  });
  it("slot → empty slot moves (source becomes empty)", () => {
    expect(applyDrop(P("#a", null, null, null, null, null), { hex: "#a", from: 0 }, 3))
      .toEqual(P(null, null, null, "#a", null, null));
  });
  it("slot → occupied slot swaps the two colors", () => {
    expect(applyDrop(P("#a", "#b", null, null, null, null), { hex: "#a", from: 0 }, 1))
      .toEqual(P("#b", "#a", null, null, null, null));
  });
  it("slot → same slot is a no-op (returns the original reference)", () => {
    const picks = P("#a", null, null, null, null, null);
    expect(applyDrop(picks, { hex: "#a", from: 0 }, 0)).toBe(picks);
  });
  it("never duplicates a color across two slots", () => {
    const out = applyDrop(P("#a", "#b", "#c", null, null, null), { hex: "#a", from: 0 }, 2);
    const placed = out.filter((v): v is string => v !== null);
    expect(new Set(placed).size).toBe(placed.length);
  });
});

describe("placeFirstEmpty", () => {
  it("fills the first null slot", () => {
    expect(placeFirstEmpty(P("#a", null, null, null, null, null), "#b"))
      .toEqual(P("#a", "#b", null, null, null, null));
  });
  it("is a no-op when full", () => {
    const full = P("#a", "#b", "#c", "#d", "#e", "#f");
    expect(placeFirstEmpty(full, "#g")).toBe(full);
  });
});

describe("clearSlot", () => {
  it("clears the given index only", () => {
    expect(clearSlot(P("#a", "#b", "#c", null, null, null), 1))
      .toEqual(P("#a", null, "#c", null, null, null));
  });
});
