import { describe, it, expect } from "vitest";
import {
  recordFromGame, aggregates, serializeExport, parseImport,
  normalizeSettings, migrateRecords,
} from "../../src/state/stats";
import type { GameRecord, StatsExport } from "../../src/state/stats";
import { isGuestGame, bothGuestGame, defaultMeta, GUEST } from "../../src/state/meta";
import { newGame } from "../../src/engine/rules";

const rec = (winnerName: string, loserName: string, over: Partial<GameRecord> = {}): GameRecord => ({
  finishedAt: "2026-07-11T01:00:00Z", winnerName, loserName, moveCount: 100,
  durationMs: 3_600_000, marginOfVictory: 3, ...over,
});
const META = { palette: ["#1", "#2", "#3", "#4", "#5", "#6"], players: ["Paul", "Christina"] as [string, string] };

describe("recordFromGame", () => {
  it("attributes winner/loser by name from meta", () => {
    const done = {
      ...newGame("2026-07-11T00:00:00Z"),
      phase: "done" as const, winner: 1 as const, winIndex: 7,
      history: new Array(10).fill({ color: 4, path: ["0,0", "0,1"] }),
    };
    expect(recordFromGame(done, META, "2026-07-11T00:30:00Z")).toEqual({
      finishedAt: "2026-07-11T00:30:00Z", winnerName: "Christina", loserName: "Paul",
      moveCount: 10, durationMs: 1_800_000, marginOfVictory: 2,
    });
  });
  it("throws on an unfinished game", () => {
    expect(() => recordFromGame(newGame("2026-07-11T00:00:00Z"), META, "x")).toThrow();
  });
});

describe("aggregates (W/L standings)", () => {
  it("empty list", () => {
    expect(aggregates([])).toEqual({
      games: 0, standings: [], streak: null,
      avgMoves: null, avgDurationMs: null, avgMargin: null,
    });
  });
  it("win/loss follow the person across side swaps; trailing streak by name", () => {
    const a = aggregates([
      rec("Paul", "Christina", { marginOfVictory: 5 }),
      rec("Christina", "Paul"),
      rec("Christina", "Paul", { moveCount: 80 }),
    ]);
    expect(a.games).toBe(3);
    expect(a.standings).toEqual([
      { name: "Christina", wins: 2, losses: 1 },
      { name: "Paul", wins: 1, losses: 2 },
    ]);
    expect(a.streak).toEqual({ name: "Christina", count: 2 });
    expect(a.avgMoves).toBeCloseTo((100 + 100 + 80) / 3);
    expect(a.avgMargin).toBeCloseTo((5 + 3 + 3) / 3);
  });
  it("guest games count for the real player only; Guest never appears in standings", () => {
    const a = aggregates([
      rec("Paul", GUEST),        // Paul beat Guest -> Paul +win
      rec(GUEST, "Paul"),        // Guest beat Paul -> Paul +loss, Guest gets nothing
      rec("Christina", GUEST),   // Christina beat Guest -> Christina +win
    ]);
    expect(a.standings).toEqual([
      { name: "Christina", wins: 1, losses: 0 },
      { name: "Paul", wins: 1, losses: 1 },
    ]);
    expect(a.standings.some((s) => s.name === GUEST)).toBe(false);
    // latest game's winner is real (Christina), so the streak is hers
    expect(a.streak).toEqual({ name: "Christina", count: 1 });
  });
  it("no real-player streak when the latest game was won by Guest", () => {
    const a = aggregates([rec("Paul", GUEST), rec(GUEST, "Paul")]);
    expect(a.streak).toBeNull();
  });
});

describe("guest predicates", () => {
  it("isGuestGame = either side Guest; bothGuestGame = both sides Guest", () => {
    expect(isGuestGame({ ...META, players: [GUEST, "Paul"] })).toBe(true);
    expect(isGuestGame({ ...META, players: ["Paul", GUEST] })).toBe(true);
    expect(isGuestGame(META)).toBe(false);
    expect(bothGuestGame({ ...META, players: [GUEST, GUEST] })).toBe(true);
    expect(bothGuestGame({ ...META, players: [GUEST, "Paul"] })).toBe(false);
    expect(bothGuestGame(META)).toBe(false);
    expect(defaultMeta(["A", "B"]).players).toEqual(["A", "B"]);
    expect(defaultMeta([]).players).toEqual(["Paul", "Christina"]);
  });
});

describe("normalizeSettings", () => {
  it("accepts roster shape, migrates legacy p1/p2, defaults otherwise", () => {
    expect(normalizeSettings({ roster: ["A", "B", "C"] })).toEqual({ roster: ["A", "B", "C"] });
    expect(normalizeSettings({ p1Name: "X", p2Name: "Y" })).toEqual({ roster: ["X", "Y"] });
    expect(normalizeSettings(undefined)).toEqual({ roster: ["Paul", "Christina"] });
    expect(normalizeSettings({ roster: ["only-one"] })).toEqual({ roster: ["Paul", "Christina"] });
  });
  it("excludes Guest from a valid roster array", () => {
    expect(normalizeSettings({ roster: ["Paul", "Guest", "Christina"] })).toEqual({ roster: ["Paul", "Christina"] });
    expect(normalizeSettings({ roster: ["Paul", "Guest"] })).toEqual({ roster: ["Paul", "Christina"] });
  });
  it("drops legacy placeholder names so defaults win", () => {
    expect(normalizeSettings({ p1Name: "Player 1", p2Name: "Player 2" })).toEqual({ roster: ["Paul", "Christina"] });
    expect(normalizeSettings({ roster: ["Player 1", "Player 2"] })).toEqual({ roster: ["Paul", "Christina"] });
    expect(normalizeSettings({ roster: ["Paul", "Player 1", "Christina"] })).toEqual({ roster: ["Paul", "Christina"] });
  });
});

describe("migrateRecords", () => {
  it("maps legacy positional records to names via roster and flags change", () => {
    const legacy = [{ finishedAt: "2026-07-10T01:00:00Z", winner: 1, moveCount: 90, durationMs: 60_000, marginOfVictory: 2 }];
    const out = migrateRecords(legacy, ["Paul", "Christina"]);
    expect(out.changed).toBe(true);
    expect(out.records).toEqual([rec("Christina", "Paul", {
      finishedAt: "2026-07-10T01:00:00Z", moveCount: 90, durationMs: 60_000, marginOfVictory: 2,
    })]);
  });
  it("passes new-shape records through unchanged; drops garbage", () => {
    const good = rec("Paul", "Christina");
    expect(migrateRecords([good], ["Paul", "Christina"])).toEqual({ records: [good], changed: false });
    const out = migrateRecords([good, { junk: true }], ["Paul", "Christina"]);
    expect(out.records).toEqual([good]);
    expect(out.changed).toBe(true);
    expect(migrateRecords(undefined, [])).toEqual({ records: [], changed: false });
  });
});

describe("export / import", () => {
  it("round-trips the roster shape", () => {
    const x: StatsExport = { settings: { roster: ["Paul", "Christina", "Sam"] }, records: [rec("Sam", "Paul")] };
    expect(parseImport(serializeExport(x))).toEqual(x);
  });
  it("rejects malformed input", () => {
    expect(parseImport("not json")).toBeNull();
    expect(parseImport("{}")).toBeNull();
    expect(parseImport(JSON.stringify({ settings: { roster: "nope" }, records: [] }))).toBeNull();
    expect(parseImport(JSON.stringify({ settings: { roster: ["A", "B"] }, records: [{ winner: 0 }] }))).toBeNull();
    expect(parseImport(JSON.stringify({ settings: { roster: ["Guest", "Paul"] }, records: [] }))).toBeNull();
  });
});
