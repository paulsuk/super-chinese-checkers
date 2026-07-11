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

// v1 placeholder names that carried no real identity — dropped so roster falls back to real defaults.
const LEGACY_NAMES = ["Player 1", "Player 2"];
const realNames = (names: string[]): string[] =>
  names.filter((n) => n !== GUEST && !LEGACY_NAMES.includes(n));

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

export interface Standing { name: string; wins: number; losses: number; }
export interface Aggregates {
  games: number;
  standings: Standing[];        // real players only (Guest never appears), best record first
  streak: { name: string; count: number } | null;
  avgMoves: number | null;
  avgDurationMs: number | null;
  avgMargin: number | null;
}

export function aggregates(records: GameRecord[]): Aggregates {
  const games = records.length;
  if (games === 0) {
    return { games: 0, standings: [], streak: null, avgMoves: null, avgDurationMs: null, avgMargin: null };
  }
  // Guest is never a tracked competitor, but a real player's win or loss against Guest still counts.
  const wins: Record<string, number> = {};
  const losses: Record<string, number> = {};
  for (const r of records) {
    if (r.winnerName !== GUEST) wins[r.winnerName] = (wins[r.winnerName] ?? 0) + 1;
    if (r.loserName !== GUEST) losses[r.loserName] = (losses[r.loserName] ?? 0) + 1;
  }
  const names = new Set([...Object.keys(wins), ...Object.keys(losses)]);
  const standings: Standing[] = [...names]
    .map((name) => ({ name, wins: wins[name] ?? 0, losses: losses[name] ?? 0 }))
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.name.localeCompare(b.name));
  const last = records[games - 1]!;
  let streak: Aggregates["streak"] = null;
  if (last.winnerName !== GUEST) {
    let count = 0;
    for (let i = games - 1; i >= 0 && records[i]!.winnerName === last.winnerName; i--) count++;
    streak = { name: last.winnerName, count };
  }
  const mean = (f: (r: GameRecord) => number) => records.reduce((s, r) => s + f(r), 0) / games;
  return {
    games,
    standings,
    streak,
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
      const roster = realNames(o.roster as string[]);
      if (roster.length >= 2) return { roster };
      return { roster: [...ROSTER_DEFAULTS] };
    }
    if (typeof o.p1Name === "string" && typeof o.p2Name === "string") {
      const roster = realNames([o.p1Name, o.p2Name]);
      if (roster.length >= 2) return { roster };
      return { roster: [...ROSTER_DEFAULTS] };
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
    const roster = realNames(settings.roster as string[]);
    if (roster.length < 2) return null;
    if (!Array.isArray(x.records) || !x.records.every(isRecord)) return null;
    return { settings: { roster }, records: x.records };
  } catch {
    return null;
  }
}
