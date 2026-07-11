import { del, get, set } from "idb-keyval";
import { DEFAULT_ASSIGNMENT } from "../config/palette";

export const GUEST = "Guest";
export const ROSTER_DEFAULTS: string[] = ["Paul", "Christina"];

export interface GameMeta {
  palette: string[];         // length 6 — hex per ColorId (0-2 top, 3-5 bottom)
  players: [string, string]; // [topName, bottomName] for this game
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

export const defaultMeta = (roster: string[]): GameMeta => ({
  palette: [...DEFAULT_ASSIGNMENT],
  players: [roster[0] ?? ROSTER_DEFAULTS[0]!, roster[1] ?? ROSTER_DEFAULTS[1]!],
});
