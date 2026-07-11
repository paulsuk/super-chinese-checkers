import { CELL_MAP, targetCells } from "../engine/board";
import { parseId } from "../engine/coords";
import { PALETTE, TINT_ALPHA, withAlpha } from "../config/palette";
import type { CellId, ColorId } from "../engine/types";

const SQRT3 = Math.sqrt(3);
export const VIEWBOX = "-230 -260 460 520";

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

export interface Staged { color: ColorId; path: CellId[]; }

interface Props {
  pieces: Record<CellId, ColorId>;
  staged: Staged | null;
  shake: CellId | null;
  transform: string;
}

export default function BoardView({ pieces, staged, shake, transform }: Props) {
  const origin = staged?.path[0] ?? null;
  const end = staged && staged.path.length > 1 ? staged.path[staged.path.length - 1]! : null;
  return (
    <svg viewBox={VIEWBOX} className="h-full w-full touch-none select-none">
      <g transform={transform}>
        {TINTS.map(({ id, color }) => {
          const { x, y } = PIXELS.get(id)!;
          return <circle key={`t${id}`} cx={x} cy={y} r={12} fill={withAlpha(PALETTE[color]!, TINT_ALPHA)} />;
        })}
        {[...PIXELS].map(([id, { x, y }]) => (
          <circle key={id} cx={x} cy={y} r={7} fill="#3f3f46" />
        ))}
        {Object.entries(pieces).map(([id, color]) => {
          const { x, y } = PIXELS.get(id)!;
          const dimmed = end !== null && id === origin;
          return (
            <circle
              key={`p${id}`} cx={x} cy={y} r={13}
              fill={PALETTE[color]!} stroke="#00000055" strokeWidth={2}
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
            fill={PALETTE[staged.color]!} stroke="#fafafa" strokeWidth={2.5} strokeDasharray="4 3" />
        )}
      </g>
    </svg>
  );
}
