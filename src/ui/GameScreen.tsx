import { botById } from "../bots/profiles";
import type { GameAction } from "../state/gameReducer";
import type { GameMeta } from "../state/meta";
import type { GameState, Move } from "../engine/types";
import { Avatar } from "./avatars";
import BoardView, { cellAt } from "./BoardView";
import GestureLayer from "./GestureLayer";
import Hud from "./Hud";
import SpeechBubble from "./SpeechBubble";
import { WinOverlay } from "./screens";
import { useBotTurn } from "./useBotTurn";
import { useDialogue } from "./useDialogue";
import { useMoveAnimation } from "./useMoveAnimation";
import { useMoveInput } from "./useMoveInput";
import type { useViewTransform } from "./useViewTransform";

interface Props {
  game: GameState;
  meta: GameMeta;
  view: ReturnType<typeof useViewTransform>;
  act(a: GameAction): void;
  onMenu(): void;
  onNewGame(): void;
  onExitToMenu(): void;
}

export default function GameScreen({ game, meta, view, act, onMenu, onNewGame, onExitToMenu }: Props) {
  const profile = meta.botId ? botById(meta.botId) : null;
  const anim = useMoveAnimation();
  const commit = (move: Move) => {
    act({ type: "COMMIT_MOVE", move });
    anim.play(move, game.phase === "finishOut" ? 60 : 180);
  };
  const input = useMoveInput(game, commit);
  const { thinking } = useBotTurn({ game, profile, commit });
  const line = useDialogue(game, profile);
  const botToMove = profile !== null && game.toMove === 0;
  const inFinishOut = game.phase === "finishOut";
  return (
    <div className="relative h-full bg-neutral-900">
      <GestureLayer view={view} onTap={(pt) => { if (!botToMove) input.tap(cellAt(pt)); }}>
        <BoardView
          pieces={game.pieces} staged={input.staged}
          shake={input.shake} transform={view.transform}
          palette={meta.palette} override={anim.override}
        />
      </GestureLayer>
      <Hud
        game={game} names={meta.players} palette={meta.palette}
        stagedReady={!!input.staged && input.staged.path.length >= 2}
        avatar={profile ? <Avatar id={profile.avatar} size={32} /> : undefined}
        thinking={thinking}
        undoDisabled={profile !== null && game.toMove === 0}
        onLockIn={input.lockIn}
        onCancel={() => input.cancel()}
        onUndo={() => {
          input.cancel();
          act({ type: "UNDO", pair: profile !== null && game.phase === "playing" });
        }}
        onResetView={view.reset}
        onMenu={onMenu}
      />
      {profile && line && <SpeechBubble profile={profile} line={line} />}
      {profile && inFinishOut && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            className="pointer-events-auto rounded-xl bg-neutral-700 px-6 py-3 text-lg text-neutral-100"
            onClick={() => act({ type: "AUTO_FINISH" })}
          >
            {game.winner === 1 ? "Skip" : "Auto-finish"}
          </button>
        </div>
      )}
      {game.phase === "done" && (
        <WinOverlay game={game} meta={meta} onNewGame={onNewGame} onMenu={onExitToMenu} />
      )}
    </div>
  );
}
