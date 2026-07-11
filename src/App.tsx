import { useState } from "react";
import { gameReducer } from "./state/gameReducer";
import type { GameAction } from "./state/gameReducer";
import { PLAYER_DEFAULTS } from "./config/palette";
import BoardView, { cellAt } from "./ui/BoardView";
import GestureLayer from "./ui/GestureLayer";
import Hud from "./ui/Hud";
import { useMoveInput } from "./ui/useMoveInput";
import { useViewTransform } from "./ui/useViewTransform";
import type { GameState } from "./engine/types";

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const view = useViewTransform();
  const act = (action: GameAction) => setGame((g) => gameReducer(g, action));
  const input = useMoveInput(game, (move) => act({ type: "COMMIT_MOVE", move }));

  if (!game) {
    return (
      <div className="grid h-full place-items-center bg-neutral-900 text-neutral-100">
        <button
          className="rounded-xl bg-emerald-700 px-8 py-4 text-2xl"
          onClick={() => act({ type: "NEW_GAME", startedAt: new Date().toISOString() })}
        >
          New game
        </button>
      </div>
    );
  }
  return (
    <div className="relative h-full bg-neutral-900">
      <GestureLayer view={view} onTap={(pt) => input.tap(cellAt(pt))}>
        <BoardView
          pieces={game.pieces}
          staged={input.staged}
          shake={input.shake}
          transform={view.transform}
        />
      </GestureLayer>
      <Hud
        game={game}
        names={PLAYER_DEFAULTS}
        stagedReady={!!input.staged && input.staged.path.length >= 2}
        onLockIn={input.lockIn}
        onCancel={() => input.cancel()}
        onUndo={() => { input.cancel(); act({ type: "UNDO" }); }}
        onResetView={view.reset}
      />
    </div>
  );
}
