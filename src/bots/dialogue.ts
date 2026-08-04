import { COLORS_OF_PLAYER, OWNER_OF_COLOR, targetCells } from "../engine/board";
import type { Pieces } from "../engine/rules";
import type { GameState, PlayerId } from "../engine/types";
import type { Rng } from "./chooseMove";
import type { Line, LinePools } from "./types";

export type DialogueEvent = "intro" | "bigChain" | "humanBigChain" | "closingIn" | "win" | "lose";

export const EVENT_PRIORITY: readonly DialogueEvent[] =
  ["lose", "win", "bigChain", "humanBigChain", "closingIn"];

const THROTTLED = new Set<DialogueEvent>(["bigChain", "humanBigChain", "closingIn"]);
const MIN_GAP = 6; // history entries (~3 bot turns)
const CLOSING_AT = 25;
const CHAIN_LEGS = 3; // path.length >= CHAIN_LEGS + 1

export interface DialogueMemory {
  lastEventAt: number;
  used: Partial<Record<DialogueEvent, number[]>>;
}

export const freshMemory = (): DialogueMemory => ({ lastEventAt: -Infinity, used: {} });

export function homeCount(pieces: Pieces, player: PlayerId): number {
  let n = 0;
  for (const c of COLORS_OF_PLAYER[player]!) {
    for (const id of targetCells(c)) if (pieces[id] === c) n++;
  }
  return n;
}

export function detectEvents(prev: GameState, next: GameState, botPlayer: PlayerId): DialogueEvent[] {
  const events: DialogueEvent[] = [];
  if (next.phase === "finishOut" && prev.phase === "playing") {
    events.push(next.winner === botPlayer ? "win" : "lose");
  }
  const last = next.history[next.history.length - 1];
  if (last && next.history.length > prev.history.length && last.path.length >= CHAIN_LEGS + 1) {
    events.push(OWNER_OF_COLOR[last.color] === botPlayer ? "bigChain" : "humanBigChain");
  }
  if (next.phase === "playing") {
    for (const p of [0, 1] as PlayerId[]) {
      if (homeCount(prev.pieces, p) < CLOSING_AT && homeCount(next.pieces, p) >= CLOSING_AT) {
        events.push("closingIn");
        break;
      }
    }
  }
  return events;
}

export function pickLine(
  pools: LinePools, event: DialogueEvent, mem: DialogueMemory, turn: number, rng: Rng,
): { line: Line; mem: DialogueMemory } | null {
  if (THROTTLED.has(event) && turn - mem.lastEventAt < MIN_GAP) return null;
  const pool = pools[event];
  if (pool.length === 0) return null;
  const used = mem.used[event] ?? [];
  const unused = pool.map((_, i) => i).filter((i) => !used.includes(i));
  const candidates = unused.length > 0 ? unused : pool.map((_, i) => i);
  const idx = candidates[Math.floor(rng() * candidates.length)]!;
  const nextUsed = unused.length > 0 ? [...used, idx] : [idx];
  return {
    line: pool[idx]!,
    mem: {
      lastEventAt: THROTTLED.has(event) ? turn : mem.lastEventAt,
      used: { ...mem.used, [event]: nextUsed },
    },
  };
}
