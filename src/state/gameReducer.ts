import { applyMove, newGame, undoMove, validateMove } from "../engine/rules";
import type { GameState, Move } from "../engine/types";
import { chooseMove } from "../bots/chooseMove";
import { AUTOPILOT_BRAIN } from "../bots/profiles";

export type GameAction =
  | { type: "NEW_GAME"; startedAt: string }
  | { type: "COMMIT_MOVE"; move: Move }
  | { type: "UNDO"; pair?: boolean }
  | { type: "AUTO_FINISH" };

export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case "NEW_GAME":
      return newGame(action.startedAt);
    case "COMMIT_MOVE":
      if (!state || !validateMove(state, action.move)) return state;
      return applyMove(state, action.move);
    case "UNDO": {
      if (!state || state.history.length === 0 || state.phase === "done") return state;
      if (action.pair) {
        if (state.history.length < 2) return state; // never single-undo the bot's opener
        return undoMove(undoMove(state));
      }
      return undoMove(state);
    }
    case "AUTO_FINISH": {
      if (!state || state.phase !== "finishOut") return state;
      let s = state;
      for (let i = 0; s.phase !== "done" && i < 1000; i++) {
        let move;
        try {
          move = chooseMove(s, AUTOPILOT_BRAIN, () => 0);
        } catch {
          // No legal move for the finishing player (the engine has no pass rule).
          // Keep the moves already made rather than discarding the whole run.
          break;
        }
        s = applyMove(s, move);
      }
      return s;
    }
  }
}
