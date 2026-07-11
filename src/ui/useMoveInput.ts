import { useRef, useState } from "react";
import { isLegalHop, isLegalStep } from "../engine/rules";
import type { Pieces } from "../engine/rules";
import { OWNER_OF_COLOR } from "../engine/board";
import type { CellId, GameState, Move } from "../engine/types";
import type { Staged } from "./BoardView";

interface Staging extends Staged { kind: "step" | "hop" | null; }

export function useMoveInput(game: GameState | null, commit: (move: Move) => void) {
  const [staged, setStaged] = useState<Staging | null>(null);
  const [shake, setShake] = useState<CellId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doShake = (cell: CellId) => {
    clearTimeout(timer.current);
    setShake(null);
    // restart the CSS animation even when shaking the same cell twice
    requestAnimationFrame(() => setShake(cell));
    timer.current = setTimeout(() => setShake(null), 600);
  };

  const tap = (cell: CellId | null) => {
    if (!game || game.phase === "done" || cell === null) return;
    const tappedColor = game.pieces[cell];
    if (tappedColor !== undefined && OWNER_OF_COLOR[tappedColor] === game.toMove) {
      setStaged({ color: tappedColor, path: [cell], kind: null });
      return;
    }
    if (!staged) {
      if (tappedColor !== undefined) doShake(cell); // opponent piece, nothing selected
      return;
    }
    const origin = staged.path[0]!;
    const lifted: Pieces = { ...game.pieces };
    delete lifted[origin];
    const end = staged.path[staged.path.length - 1]!;
    const extend = (kind: "step" | "hop", path: CellId[]) =>
      setStaged({ color: staged.color, path, kind });

    if (staged.kind === "hop") {
      if (isLegalHop(lifted, staged.color, end, cell)) extend("hop", [...staged.path, cell]);
      else doShake(origin);
      return;
    }
    // kind null (just selected) or "step" (re-stage first leg from origin)
    if (isLegalStep(lifted, staged.color, origin, cell)) extend("step", [origin, cell]);
    else if (isLegalHop(lifted, staged.color, origin, cell)) extend("hop", [origin, cell]);
    else doShake(origin);
  };

  const lockIn = () => {
    if (staged && staged.path.length >= 2) commit({ color: staged.color, path: staged.path });
    setStaged(null);
  };
  const cancel = () => setStaged(null);

  return { staged: staged as Staged | null, shake, tap, lockIn, cancel };
}
