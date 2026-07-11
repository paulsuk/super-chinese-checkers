import { useCallback, useMemo, useState } from "react";

export interface GestureDelta { dx: number; dy: number; dScale: number; dAngle: number; cx: number; cy: number; }
interface View { tx: number; ty: number; s: number; deg: number; }
const HOME: View = { tx: 0, ty: 0, s: 1, deg: 0 };

export function useViewTransform() {
  const [v, setV] = useState<View>(HOME);
  const reset = useCallback(() => setV(HOME), []);
  const apply = useCallback((g: GestureDelta) => {
    setV((v) => {
      // scale+rotate about the gesture center (cx,cy), then translate
      const s = Math.min(4, Math.max(0.5, v.s * g.dScale));
      const eff = s / v.s;
      const rad = (g.dAngle * Math.PI) / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const ox = v.tx - g.cx, oy = v.ty - g.cy;
      return {
        s,
        deg: v.deg + g.dAngle,
        tx: g.cx + (ox * cos - oy * sin) * eff + g.dx,
        ty: g.cy + (ox * sin + oy * cos) * eff + g.dy,
      };
    });
  }, []);
  const toBoard = useCallback(
    (client: { x: number; y: number }, svg: SVGSVGElement) => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const p = new DOMPoint(client.x, client.y).matrixTransform(ctm.inverse());
      const rad = (-v.deg * Math.PI) / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const x = p.x - v.tx, y = p.y - v.ty;
      return { x: (x * cos - y * sin) / v.s, y: (x * sin + y * cos) / v.s };
    },
    [v],
  );
  const transform = useMemo(() => `translate(${v.tx} ${v.ty}) rotate(${v.deg}) scale(${v.s})`, [v]);
  return { transform, reset, apply, toBoard };
}
