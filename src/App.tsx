import { useReducer } from "react";
import { gameReducer } from "./state/gameReducer";
import BoardView from "./ui/BoardView";

export default function App() {
  const [game, dispatch] = useReducer(gameReducer, null);
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
    <div className="h-full bg-neutral-900">
      <BoardView pieces={game.pieces} staged={null} shake={null} transform="" />
    </div>
  );
}
