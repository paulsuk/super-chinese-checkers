import { applyMove, newGame, undoMove, validateMove } from "../engine/rules";
import type { GameState, Move } from "../engine/types";

export type GameAction =
  | { type: "NEW_GAME"; startedAt: string }
  | { type: "COMMIT_MOVE"; move: Move }
  | { type: "UNDO" };

export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case "NEW_GAME":
      return newGame(action.startedAt);
    case "COMMIT_MOVE":
      if (!state || !validateMove(state, action.move)) return state;
      return applyMove(state, action.move);
    case "UNDO":
      if (!state || state.history.length === 0 || state.phase === "done") return state;
      return undoMove(state);
  }
}
