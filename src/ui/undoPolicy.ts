import type { GameState } from "../engine/types";

/**
 * Whether the Undo button is unavailable. PvP is never blocked here — the reducer's
 * own empty-history and done-phase guards cover it.
 *
 * In a bot game undo is blocked while the bot is to move (thinking, or grinding its
 * auto finish-out), at the win boundary (the last move IS the bot's winning move, so
 * undoing it would un-win the game and let the bot re-roll), and on the opener where
 * pair-undo is a designed no-op.
 */
export function undoBlocked(game: GameState, isBotGame: boolean): boolean {
  if (!isBotGame) return false;
  return (
    game.toMove === 0 ||
    (game.phase === "finishOut" && game.history.length - 1 === game.winIndex) ||
    game.history.length < 2
  );
}

/** Undo pops the human's move and the bot's reply together during normal play. */
export const undoPairs = (game: GameState, isBotGame: boolean): boolean =>
  isBotGame && game.phase === "playing";
