import { useRef } from "react";
import type { ReactNode } from "react";
import type { useViewTransform } from "./useViewTransform";

interface Props {
  view: ReturnType<typeof useViewTransform>;
  onTap: (boardPt: { x: number; y: number }) => void;
  children: ReactNode; // the <svg>; must be the only child
}

interface Ptr { x: number; y: number; }

export default function GestureLayer({ view, onTap, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const ptrs = useRef(new Map<number, Ptr>());
  const moved = useRef(0);
  const multi = useRef(false);

  const toView = (e: React.PointerEvent): Ptr | null => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y }; // viewBox space (pre-board-transform)
  };

  const onDown = (e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    const p = toView(e);
    if (!p) return;
    ptrs.current.set(e.pointerId, p);
    if (ptrs.current.size === 1) { moved.current = 0; multi.current = false; }
    else multi.current = true;
  };

  const onMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId);
    const p = toView(e);
    if (!prev || !p) return;
    const all = [...ptrs.current.entries()];
    if (all.length === 1) {
      moved.current += Math.hypot(p.x - prev.x, p.y - prev.y);
      view.apply({ dx: p.x - prev.x, dy: p.y - prev.y, dScale: 1, dAngle: 0, cx: p.x, cy: p.y });
    } else if (all.length === 2) {
      const otherId = all.find(([id]) => id !== e.pointerId)![0];
      const other = ptrs.current.get(otherId)!;
      const c = { x: (p.x + other.x) / 2, y: (p.y + other.y) / 2 };
      const dPrev = Math.hypot(prev.x - other.x, prev.y - other.y);
      const dNow = Math.hypot(p.x - other.x, p.y - other.y);
      const aPrev = Math.atan2(prev.y - other.y, prev.x - other.x);
      const aNow = Math.atan2(p.y - other.y, p.x - other.x);
      const cPrev = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
      view.apply({
        dx: c.x - cPrev.x, dy: c.y - cPrev.y,
        dScale: dPrev > 0 ? dNow / dPrev : 1,
        dAngle: ((aNow - aPrev) * 180) / Math.PI,
        cx: c.x, cy: c.y,
      });
    }
    ptrs.current.set(e.pointerId, p);
  };

  const onUp = (e: React.PointerEvent) => {
    const svgEl = ref.current?.querySelector("svg");
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0 && !multi.current && moved.current < 10 && svgEl) {
      onTap(view.toBoard({ x: e.clientX, y: e.clientY }, svgEl));
    }
  };

  return (
    <div
      ref={ref}
      className="h-full w-full touch-none"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {children}
    </div>
  );
}
