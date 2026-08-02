import { useEffect, useState } from "react";
import { chooseMove } from "../bots/chooseMove";
import type { BotProfile } from "../bots/types";
import type { GameState, Move } from "../engine/types";

export function useBotTurn(opts: {
  game: GameState | null;
  profile: BotProfile | null;
  commit(move: Move): void;
}): { thinking: boolean } {
  const { game, profile, commit } = opts;
  const [thinking, setThinking] = useState(false);
  useEffect(() => {
    if (!profile || !game || game.phase === "done" || game.toMove !== 0) {
      setThinking(false);
      return;
    }
    const { minMs, maxMs } = profile.think;
    const pause = game.phase === "finishOut" ? 150 : minMs + Math.random() * (maxMs - minMs);
    setThinking(true);
    const timer = setTimeout(() => {
      setThinking(false);
      try {
        commit(chooseMove(game, profile.brain, Math.random));
      } catch (e) {
        // chooseMove throws on zero legal moves (engine has no pass rule; open product
        // question) — degrade to idle instead of an uncaught throw.
        console.error(e);
      }
    }, pause);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, profile]);
  return { thinking };
}
