export interface Pt { x: number; y: number; }

const easeInOutQuad = (u: number): number => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);

/** Position along a polyline at t in [0,1]; equal time per leg, each leg eased. */
export function pointAlongPath(points: Pt[], t: number): Pt {
  const legs = points.length - 1;
  if (t <= 0 || legs < 1) return points[0]!;
  if (t >= 1) return points[legs]!;
  const scaled = t * legs;
  const i = Math.min(legs - 1, Math.floor(scaled));
  const u = easeInOutQuad(scaled - i);
  const a = points[i]!;
  const b = points[i + 1]!;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
}
