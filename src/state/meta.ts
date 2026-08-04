import { del, get, set } from "idb-keyval";
import { DEFAULT_ASSIGNMENT } from "../config/palette";
import type { BotId } from "../bots/types";

export const GUEST = "Guest";
export const ROSTER_DEFAULTS: string[] = ["Paul", "Christina"];

export interface GameMeta {
  palette: string[];         // length 6 — hex per ColorId (0-2 top, 3-5 bottom)
  players: [string, string]; // [topName, bottomName] for this game
  botId?: BotId;             // set = single-player; the bot plays the top side
}

const META = "meta";
const LAST_META = "lastMeta";

export const saveMeta = (m: GameMeta): Promise<void> => set(META, m);
export const loadMeta = (): Promise<GameMeta | undefined> => get<GameMeta>(META);
export const clearMeta = (): Promise<void> => del(META);
export const saveLastMeta = (m: GameMeta): Promise<void> => set(LAST_META, m);
export const loadLastMeta = (): Promise<GameMeta | undefined> => get<GameMeta>(LAST_META);

export const isGuestGame = (m: GameMeta): boolean =>
  m.players[0] === GUEST || m.players[1] === GUEST;

export const bothGuestGame = (m: GameMeta): boolean =>
  m.players[0] === GUEST && m.players[1] === GUEST;

/** Whether finishing this game should write a stats record. */
export const recordable = (m: GameMeta): boolean =>
  m.botId ? m.players[1] !== GUEST : !bothGuestGame(m);

/**
 * Meta for a single-player game: the bot takes the top three colors, the human keeps
 * the bottom three from their last PvP game. A bot meta is never stored as lastMeta,
 * but the botId guard means even a stale one can't leak a bot palette into these slots.
 */
export const botMeta = (
  bot: { id: BotId; name: string; palette: [string, string, string] },
  humanName: string,
  lastMeta: GameMeta | null,
): GameMeta => ({
  palette: [
    ...bot.palette,
    ...(lastMeta && !lastMeta.botId ? lastMeta.palette.slice(3) : DEFAULT_ASSIGNMENT.slice(3)),
  ],
  players: [bot.name, humanName],
  botId: bot.id,
});

export const defaultMeta = (roster: string[]): GameMeta => ({
  palette: [...DEFAULT_ASSIGNMENT],
  players: [roster[0] ?? ROSTER_DEFAULTS[0]!, roster[1] ?? ROSTER_DEFAULTS[1]!],
});
