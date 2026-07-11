import { CELL_MAP, targetCells, CORNER_OF_COLOR, TARGET_OF } from "../engine/board";
import type { CornerName } from "../engine/board";
import { parseId } from "../engine/coords";
import { TINT_ALPHA, withAlpha } from "../config/palette";
import type { CellId, ColorId } from "../engine/types";

const SQRT3 = Math.sqrt(3);
export const VIEWBOX = "-260 -290 520 580";

export function pixelOf(id: CellId): { x: number; y: number } {
  const { q, r } = parseId(id);
  return { x: 20 * SQRT3 * (q + r / 2), y: 30 * r };
}

const PIXELS: ReadonlyMap<CellId, { x: number; y: number }> = new Map(
  [...CELL_MAP.keys()].map((id) => [id, pixelOf(id)]),
);

export function cellAt(pt: { x: number; y: number }): CellId | null {
  let best: CellId | null = null;
  let bestD = 16 * 16;
  for (const [id, p] of PIXELS) {
    const d = (p.x - pt.x) ** 2 + (p.y - pt.y) ** 2;
    if (d < bestD) { bestD = d; best = id; }
  }
  return best;
}

const TINTS: ReadonlyArray<{ id: CellId; color: ColorId }> = ([0, 1, 2, 3, 4, 5] as ColorId[])
  .flatMap((c) => [...targetCells(c)].map((id) => ({ id, color: c })));

// Outermost cell of each corner triangle (from the board's fixed geometry)
const TIP_CELL: Record<CornerName, CellId> = {
  N: "4,-8", NE: "8,-4", SE: "4,4", S: "-4,8", SW: "-8,4", NW: "-4,-4",
};

// One destination dot per color, floating radially past its TARGET corner's tip
const DOT_OFFSET = 34;
const DOTS: ReadonlyArray<{ color: ColorId; x: number; y: number }> =
  ([0, 1, 2, 3, 4, 5] as ColorId[]).map((color) => {
    const tip = pixelOf(TIP_CELL[TARGET_OF[CORNER_OF_COLOR[color]!]]);
    const k = (Math.hypot(tip.x, tip.y) + DOT_OFFSET) / Math.hypot(tip.x, tip.y);
    return { color, x: tip.x * k, y: tip.y * k };
  });

export interface Staged { color: ColorId; path: CellId[]; }

interface Props {
  pieces: Record<CellId, ColorId>;
  staged: Staged | null;
  shake: CellId | null;
  transform: string;
  palette: string[];
}

export default function BoardView({ pieces, staged, shake, transform, palette }: Props) {
  const origin = staged?.path[0] ?? null;
  const end = staged && staged.path.length > 1 ? staged.path[staged.path.length - 1]! : null;
  return (
    <svg viewBox={VIEWBOX} className="h-full w-full touch-none select-none">
      <g transform={transform}>
        {TINTS.map(({ id, color }) => {
          const { x, y } = PIXELS.get(id)!;
          return <circle key={`t${id}`} cx={x} cy={y} r={12} fill={withAlpha(palette[color]!, TINT_ALPHA)} />;
        })}
        {DOTS.map(({ color, x, y }) => (
          <circle key={`d${color}`} cx={x} cy={y} r={9} fill={palette[color]!} opacity={0.9} />
        ))}
        {[...PIXELS].map(([id, { x, y }]) => (
          <circle key={id} cx={x} cy={y} r={7} fill="#3f3f46" />
        ))}
        {Object.entries(pieces).map(([id, color]) => {
          const { x, y } = PIXELS.get(id)!;
          const dimmed = end !== null && id === origin;
          return (
            <circle
              key={`p${id}`} cx={x} cy={y} r={13}
              fill={palette[color]!} stroke="#00000055" strokeWidth={2}
              opacity={dimmed ? 0.35 : 1}
              className={shake === id ? "shake" : undefined}
            />
          );
        })}
        {origin !== null && (
          <circle cx={PIXELS.get(origin)!.x} cy={PIXELS.get(origin)!.y} r={17}
            fill="none" stroke="#fafafa" strokeWidth={2.5} />
        )}
        {staged && staged.path.length > 2 && staged.path.slice(1, -1).map((id, i) => {
          const { x, y } = PIXELS.get(id)!;
          return <circle key={`w${i}`} cx={x} cy={y} r={4} fill="#fafafa" opacity={0.7} />;
        })}
        {end !== null && staged && (
          <circle cx={PIXELS.get(end)!.x} cy={PIXELS.get(end)!.y} r={13}
            fill={palette[staged.color]!} stroke="#fafafa" strokeWidth={2.5} strokeDasharray="4 3" />
        )}
      </g>
    </svg>
  );
}
