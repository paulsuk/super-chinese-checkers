import { marginSoFar } from "../engine/rules";
import type { GameState } from "../engine/types";
import { GUEST, ROSTER_DEFAULTS } from "./meta";
import type { GameMeta } from "./meta";

export interface GameRecord {
  finishedAt: string;
  winnerName: string;
  loserName: string;
  moveCount: number;
  durationMs: number;
  marginOfVictory: number;
}
export interface Settings { roster: string[]; }
export interface StatsExport { settings: Settings; records: GameRecord[]; }

export function recordFromGame(state: GameState, meta: GameMeta, finishedAt: string): GameRecord {
  if (state.phase !== "done" || state.winner === null) throw new Error("game not finished");
  return {
    finishedAt,
    winnerName: meta.players[state.winner],
    loserName: meta.players[state.winner === 0 ? 1 : 0],
    moveCount: state.history.length,
    durationMs: Date.parse(finishedAt) - Date.parse(state.startedAt),
    marginOfVictory: marginSoFar(state)!,
  };
}

export interface Aggregates {
  games: number;
  winsByName: Record<string, number>;
  streak: { name: string; count: number } | null;
  avgMoves: number | null;
  avgDurationMs: number | null;
  avgMargin: number | null;
}

export function aggregates(records: GameRecord[]): Aggregates {
  const games = records.length;
  if (games === 0) {
    return { games: 0, winsByName: {}, streak: null, avgMoves: null, avgDurationMs: null, avgMargin: null };
  }
  const winsByName: Record<string, number> = {};
  for (const r of records) winsByName[r.winnerName] = (winsByName[r.winnerName] ?? 0) + 1;
  const last = records[games - 1]!;
  let count = 0;
  for (let i = games - 1; i >= 0 && records[i]!.winnerName === last.winnerName; i--) count++;
  const mean = (f: (r: GameRecord) => number) => records.reduce((s, r) => s + f(r), 0) / games;
  return {
    games,
    winsByName,
    streak: { name: last.winnerName, count },
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
    typeof o.winnerName === "string" &&
    typeof o.loserName === "string" &&
    typeof o.moveCount === "number" &&
    typeof o.durationMs === "number" &&
    typeof o.marginOfVictory === "number"
  );
}

export function normalizeSettings(raw: unknown): Settings {
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.roster) && o.roster.length >= 2 && o.roster.every((n) => typeof n === "string")) {
      const roster = (o.roster as string[]).filter((n) => n !== GUEST);
      if (roster.length >= 2) return { roster };
      return { roster: [...ROSTER_DEFAULTS] };
    }
    if (typeof o.p1Name === "string" && typeof o.p2Name === "string") {
      return { roster: [o.p1Name, o.p2Name] };
    }
  }
  return { roster: [...ROSTER_DEFAULTS] };
}

/** One-time load migration: legacy positional records -> name records via roster. */
export function migrateRecords(raw: unknown, roster: string[]): { records: GameRecord[]; changed: boolean } {
  if (!Array.isArray(raw)) return { records: [], changed: false };
  let changed = false;
  const records: GameRecord[] = [];
  for (const item of raw) {
    if (isRecord(item)) { records.push(item); continue; }
    const o = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    if (
      (o.winner === 0 || o.winner === 1) &&
      typeof o.finishedAt === "string" && typeof o.moveCount === "number" &&
      typeof o.durationMs === "number" && typeof o.marginOfVictory === "number"
    ) {
      const w = o.winner as 0 | 1;
      records.push({
        finishedAt: o.finishedAt,
        winnerName: roster[w] ?? `Player ${w + 1}`,
        loserName: roster[1 - w] ?? `Player ${2 - w}`,
        moveCount: o.moveCount,
        durationMs: o.durationMs,
        marginOfVictory: o.marginOfVictory,
      });
    }
    changed = true; // migrated or dropped
  }
  return { records, changed };
}

export function parseImport(json: string): StatsExport | null {
  try {
    const x = JSON.parse(json) as Record<string, unknown>;
    const settings = x.settings as Record<string, unknown> | undefined;
    if (!settings || !Array.isArray(settings.roster) || settings.roster.length < 2 ||
        !settings.roster.every((n) => typeof n === "string")) return null;
    const roster = (settings.roster as string[]).filter((n) => n !== GUEST);
    if (roster.length < 2) return null;
    if (!Array.isArray(x.records) || !x.records.every(isRecord)) return null;
    return { settings: { roster }, records: x.records };
  } catch {
    return null;
  }
}
