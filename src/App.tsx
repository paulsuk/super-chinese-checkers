import { useReducer } from "react";
import { gameReducer } from "./state/gameReducer";
import BoardView, { cellAt } from "./ui/BoardView";
import GestureLayer from "./ui/GestureLayer";
import { useViewTransform } from "./ui/useViewTransform";

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, null);
  const view = useViewTransform();
  if (!game) {
    return (
      <div className="grid h-full place-items-center bg-neutral-900 text-neutral-100">
        <button
          className="rounded-xl bg-emerald-700 px-8 py-4 text-2xl"
          onClick={() => dispatch({ type: "NEW_GAME", startedAt: new Date().toISOString() })}
        >
          New game
        </button>
      </div>
    );
  }
  return (
    <div className="relative h-full bg-neutral-900">
      <GestureLayer view={view} onTap={(pt) => console.log("tap", cellAt(pt))}>
        <BoardView pieces={game.pieces} staged={null} shake={null} transform={view.transform} />
      </GestureLayer>
      <button
        className="absolute right-3 top-3 rounded-lg bg-neutral-700 px-3 py-2 text-neutral-100"
        onClick={view.reset}
      >
        ⟲
      </button>
    </div>
  );
}
