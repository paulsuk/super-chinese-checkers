import { describe, it, expect } from "vitest";
import { recordFromGame, aggregates, serializeExport, parseImport } from "../../src/state/stats";
import type { GameRecord, StatsExport } from "../../src/state/stats";
import { newGame } from "../../src/engine/rules";

const rec = (winner: 0 | 1, over: Partial<GameRecord> = {}): GameRecord => ({
  finishedAt: "2026-07-10T01:00:00Z", winner, moveCount: 100,
  durationMs: 3_600_000, marginOfVictory: 3, ...over,
});

describe("recordFromGame", () => {
  it("builds a record from a done game", () => {
    const done = {
      ...newGame("2026-07-10T00:00:00Z"),
      phase: "done" as const, winner: 0 as const, winIndex: 7,
      history: new Array(10).fill({ color: 0, path: ["0,0", "0,1"] }),
    };
    expect(recordFromGame(done, "2026-07-10T00:30:00Z")).toEqual({
      finishedAt: "2026-07-10T00:30:00Z", winner: 0, moveCount: 10,
      durationMs: 1_800_000, marginOfVictory: 2, // 10 - 1 - 7
    });
  });
  it("throws on an unfinished game", () => {
    expect(() => recordFromGame(newGame("2026-07-10T00:00:00Z"), "x")).toThrow();
  });
});

describe("aggregates", () => {
  it("empty list", () => {
    expect(aggregates([])).toEqual({
      games: 0, wins: [0, 0], streak: null,
      avgMoves: null, avgDurationMs: null, avgMargin: null,
    });
  });
  it("wins, trailing streak, and means", () => {
    const a = aggregates([rec(0, { marginOfVictory: 5 }), rec(1), rec(1, { moveCount: 80 })]);
    expect(a.games).toBe(3);
    expect(a.wins).toEqual([1, 2]);
    expect(a.streak).toEqual({ player: 1, count: 2 });
    expect(a.avgMoves).toBeCloseTo((100 + 100 + 80) / 3);
    expect(a.avgMargin).toBeCloseTo((5 + 3 + 3) / 3);
  });
});

describe("export / import", () => {
  it("round-trips", () => {
    const x: StatsExport = { settings: { p1Name: "Paul", p2Name: "Ali" }, records: [rec(0)] };
    expect(parseImport(serializeExport(x))).toEqual(x);
  });
  it("rejects malformed input", () => {
    expect(parseImport("not json")).toBeNull();
    expect(parseImport("{}")).toBeNull();
    expect(parseImport(JSON.stringify({ settings: { p1Name: "a" }, records: [] }))).toBeNull();
    expect(parseImport(JSON.stringify({ settings: { p1Name: "a", p2Name: "b" }, records: [{ winner: 2 }] }))).toBeNull();
  });
});
