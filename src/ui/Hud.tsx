import { COLORS_OF_PLAYER } from "../engine/board";
import { marginSoFar } from "../engine/rules";
import { PALETTE } from "../config/palette";
import type { GameState } from "../engine/types";

interface Props {
  game: GameState;
  names: [string, string];
  stagedReady: boolean;
  onLockIn(): void;
  onCancel(): void;
  onUndo(): void;
  onResetView(): void;
}

export default function Hud({ game, names, stagedReady, onLockIn, onCancel, onUndo, onResetView }: Props) {
  const margin = marginSoFar(game);
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 rounded-xl bg-neutral-800/90 px-3 py-2 text-neutral-100">
          <span className="text-lg font-medium">{names[game.toMove]}</span>
          {COLORS_OF_PLAYER[game.toMove]!.map((c) => (
            <span key={c} className="inline-block h-4 w-4 rounded-full" style={{ background: PALETTE[c] }} />
          ))}
          {game.phase === "finishOut" && (
            <span className="ml-2 rounded-md bg-amber-600 px-2 py-0.5 text-sm">
              {names[game.winner!]} wins — margin {margin}
            </span>
          )}
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button className="rounded-lg bg-neutral-700 px-3 py-2 text-neutral-100" onClick={onUndo}>Undo</button>
          <button className="rounded-lg bg-neutral-700 px-3 py-2 text-neutral-100" onClick={onResetView}>⟲</button>
        </div>
      </div>
      {stagedReady && (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button className="rounded-xl bg-emerald-600 px-8 py-3 text-lg text-white" onClick={onLockIn}>
            Lock in
          </button>
          <button className="rounded-xl bg-neutral-700 px-6 py-3 text-lg text-neutral-100" onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
