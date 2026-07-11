import { marginSoFar } from "../engine/rules";
import type { GameState, PlayerId } from "../engine/types";

export interface GameRecord {
  finishedAt: string;
  winner: PlayerId;
  moveCount: number;
  durationMs: number;
  marginOfVictory: number;
}
export interface Settings { p1Name: string; p2Name: string; }
export interface StatsExport { settings: Settings; records: GameRecord[]; }

export function recordFromGame(state: GameState, finishedAt: string): GameRecord {
  if (state.phase !== "done" || state.winner === null) throw new Error("game not finished");
  return {
    finishedAt,
    winner: state.winner,
    moveCount: state.history.length,
    durationMs: Date.parse(finishedAt) - Date.parse(state.startedAt),
    marginOfVictory: marginSoFar(state)!,
  };
}

export interface Aggregates {
  games: number;
  wins: [number, number];
  streak: { player: PlayerId; count: number } | null;
  avgMoves: number | null;
  avgDurationMs: number | null;
  avgMargin: number | null;
}

export function aggregates(records: GameRecord[]): Aggregates {
  const games = records.length;
  if (games === 0) {
    return { games: 0, wins: [0, 0], streak: null, avgMoves: null, avgDurationMs: null, avgMargin: null };
  }
  const wins: [number, number] = [0, 0];
  for (const r of records) wins[r.winner]++;
  const last = records[games - 1]!;
  let count = 0;
  for (let i = games - 1; i >= 0 && records[i]!.winner === last.winner; i--) count++;
  const mean = (f: (r: GameRecord) => number) => records.reduce((s, r) => s + f(r), 0) / games;
  return {
    games,
    wins,
    streak: { player: last.winner, count },
    avgMoves: mean((r) => r.moveCount),
    avgDurationMs: mean((r) => r.durationMs),
    avgMargin: mean((r) => r.marginOfVictory),
  };
}

export const serializeExport = (x: StatsExport): string => JSON.stringify(x, null, 2);

function isRecord(r: unknown): r is GameRecord {
  if (typeof r !== "object" || r === null) return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.finishedAt === "string" &&
    (o.winner === 0 || o.winner === 1) &&
    typeof o.moveCount === "number" &&
    typeof o.durationMs === "number" &&
    typeof o.marginOfVictory === "number"
  );
}

export function parseImport(json: string): StatsExport | null {
  try {
    const x = JSON.parse(json) as Record<string, unknown>;
    const settings = x.settings as Record<string, unknown> | undefined;
    if (!settings || typeof settings.p1Name !== "string" || typeof settings.p2Name !== "string") return null;
    if (!Array.isArray(x.records) || !x.records.every(isRecord)) return null;
    return { settings: { p1Name: settings.p1Name, p2Name: settings.p2Name }, records: x.records };
  } catch {
    return null;
  }
}
