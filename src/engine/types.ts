export type ColorId = 0 | 1 | 2 | 3 | 4 | 5;
export type PlayerId = 0 | 1;
export type CellId = string; // "q,r"
export type Phase = "playing" | "finishOut" | "done";

export interface Move {
  color: ColorId;
  path: CellId[]; // path[0] = origin; length 2 = step or single hop; >2 = hop chain
}

export interface GameState {
  pieces: Record<CellId, ColorId>;
  toMove: PlayerId;
  phase: Phase;
  winner: PlayerId | null;
  winIndex: number | null; // index in history of the winning move
  history: Move[];
  startedAt: string; // ISO
}
