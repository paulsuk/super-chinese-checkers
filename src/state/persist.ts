import { del, get, set } from "idb-keyval";
import type { GameState } from "../engine/types";
import { normalizeSettings } from "./stats";
import type { GameRecord, Settings, StatsExport } from "./stats";

const GAME = "game";
const SETTINGS = "settings";
const STATS = "stats";

export const saveGame = (s: GameState): Promise<void> => set(GAME, s);
export const clearGame = (): Promise<void> => del(GAME);
export const loadGame = (): Promise<GameState | undefined> => get<GameState>(GAME);

export const saveSettings = (s: Settings): Promise<void> => set(SETTINGS, s);
export const loadSettings = async (): Promise<Settings> => normalizeSettings(await get(SETTINGS));

export const loadRecords = async (): Promise<unknown> => (await get(STATS)) ?? [];
export const replaceRecords = (records: GameRecord[]): Promise<void> => set(STATS, records);
export const appendRecord = async (r: GameRecord): Promise<void> => {
  const current = await get<GameRecord[]>(STATS);
  return set(STATS, [...(current ?? []), r]);
};
export const replaceAll = async (x: StatsExport): Promise<void> => {
  await set(STATS, x.records);
  await set(SETTINGS, x.settings);
};
