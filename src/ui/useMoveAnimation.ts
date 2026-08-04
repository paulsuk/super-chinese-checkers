import { useCallback, useEffect, useRef, useState } from "react";
import type { CellId, Move } from "../engine/types";
import { pixelOf } from "./BoardView";
import { pointAlongPath } from "./pathAnim";

export interface PieceOverride { id: CellId; x: number; y: number; }

export function useMoveAnimation(): {
  override: PieceOverride | null;
  play(move: Move, msPerLeg?: number): void;
} {
  const [override, setOverride] = useState<PieceOverride | null>(null);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const play = useCallback((move: Move, msPerLeg = 180) => {
    cancelAnimationFrame(raf.current);
    const points = move.path.map(pixelOf);
    const dest = move.path[move.path.length - 1]!;
    const total = msPerLeg * (points.length - 1);
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = (now - t0) / total;
      if (t >= 1) { setOverride(null); return; }
      setOverride({ id: dest, ...pointAlongPath(points, t) });
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, []);
  return { override, play };
}
