import { describe, expect, it } from "vitest";
import { GUEST, botMeta, recordable } from "../../src/state/meta";
import { DEFAULT_ASSIGNMENT } from "../../src/config/palette";
import type { GameMeta } from "../../src/state/meta";
import type { BotId } from "../../src/bots/types";

const meta = (players: [string, string], botId?: BotId): GameMeta =>
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

describe("botMeta", () => {
  const bot = { id: "mia" as const, name: "Mia", palette: ["#a", "#b", "#c"] as [string, string, string] };
  const pvpLast: GameMeta = {
    palette: ["#1", "#2", "#3", "#x", "#y", "#z"], players: ["Paul", "Christina"],
  };

  it("gives the bot the top three colors and the human their last PvP bottom three", () => {
    const m = botMeta(bot, "Paul", pvpLast);
    expect(m.palette).toEqual(["#a", "#b", "#c", "#x", "#y", "#z"]);
    expect(m.players).toEqual(["Mia", "Paul"]);
    expect(m.botId).toBe("mia");
  });

  it("falls back to defaults when there is no prior game", () => {
    expect(botMeta(bot, "Paul", null).palette.slice(3)).toEqual(DEFAULT_ASSIGNMENT.slice(3));
  });

  it("never carries colors out of a previous bot game", () => {
    const botLast: GameMeta = { ...pvpLast, botId: "june" };
    expect(botMeta(bot, "Paul", botLast).palette.slice(3)).toEqual(DEFAULT_ASSIGNMENT.slice(3));
  });
});
