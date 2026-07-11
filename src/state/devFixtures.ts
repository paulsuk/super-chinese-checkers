import { newGame } from "../engine/rules";
import type { Pieces } from "../engine/rules";
import { targetCells } from "../engine/board";
import type { CellId, ColorId, GameState } from "../engine/types";

/** Player 0 one W-step ("-4,1"→"-5,1") from winning; player 1 (color 4) needs
 *  two NW finishing steps ("1,-4"→"1,-5", "2,-4"→"2,-5"). Dev QA only. */
export function devNearWin(startedAt: string): GameState {
  const pieces: Pieces = {};
  const fill = (color: ColorId, except: CellId[] = []) => {
    for (const id of targetCells(color)) if (!except.includes(id)) pieces[id] = color;
  };
  fill(0); fill(1); fill(3); fill(5);
  fill(2, ["-5,1"]);
  pieces["-4,1"] = 2;
  fill(4, ["1,-5", "2,-5"]);
  pieces["1,-4"] = 4;
  pieces["2,-4"] = 4;
  return { ...newGame(startedAt), pieces };
}
