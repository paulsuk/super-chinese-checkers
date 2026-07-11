import { del, get, set } from "idb-keyval";
import type { GameState } from "../engine/types";
import type { GameRecord, Settings, StatsExport } from "./stats";
import { PLAYER_DEFAULTS } from "../config/palette";

const GAME = "game";
const SETTINGS = "settings";
const STATS = "stats";

export const saveGame = (s: GameState): Promise<void> => set(GAME, s);
export const clearGame = (): Promise<void> => del(GAME);
export const loadGame = (): Promise<GameState | undefined> => get<GameState>(GAME);

export const saveSettings = (s: Settings): Promise<void> => set(SETTINGS, s);
export const loadSettings = async (): Promise<Settings> =>
  (await get<Settings>(SETTINGS)) ?? { p1Name: PLAYER_DEFAULTS[0], p2Name: PLAYER_DEFAULTS[1] };

export const loadRecords = async (): Promise<GameRecord[]> => (await get<GameRecord[]>(STATS)) ?? [];
export const appendRecord = async (r: GameRecord): Promise<void> =>
  set(STATS, [...(await loadRecords()), r]);
export const replaceAll = async (x: StatsExport): Promise<void> => {
  await set(STATS, x.records);
  await set(SETTINGS, x.settings);
};
