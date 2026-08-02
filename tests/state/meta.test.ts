import { describe, expect, it } from "vitest";
import { GUEST, recordable } from "../../src/state/meta";
import type { GameMeta } from "../../src/state/meta";

const meta = (players: [string, string], botId?: string): GameMeta =>
  ({ palette: [], players, ...(botId ? { botId } : {}) });

describe("recordable", () => {
  it("PvP: both-Guest games are not recorded, one Guest is", () => {
    expect(recordable(meta([GUEST, GUEST]))).toBe(false);
    expect(recordable(meta(["Paul", GUEST]))).toBe(true);
  });
  it("bot games: recorded only when the human (players[1]) is named", () => {
    expect(recordable(meta(["Lilibeth", "Paul"], "lilibeth"))).toBe(true);
    expect(recordable(meta(["Lilibeth", GUEST], "lilibeth"))).toBe(false);
  });
});
