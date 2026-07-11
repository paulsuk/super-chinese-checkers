// Pure color-draft algebra for the setup screen (no DOM) — unit-tested independently.
export type DragSource = { hex: string; from: "tray" | number };

/** Drop `src` onto slot `target`: fill from tray, or move/swap between slots. Returns new picks. */
export function applyDrop(
  picks: (string | null)[],
  src: DragSource,
  target: number,
): (string | null)[] {
  const n = [...picks];
  if (src.from === "tray") {
    n[target] = src.hex;
  } else {
    if (src.from === target) return picks;
    const moving = n[src.from] ?? null;
    n[src.from] = n[target] ?? null;
    n[target] = moving;
  }
  return n;
}

/** Place `hex` into the first empty slot; no-op when full. */
export function placeFirstEmpty(picks: (string | null)[], hex: string): (string | null)[] {
  const i = picks.findIndex((v) => v === null);
  if (i < 0) return picks;
  const n = [...picks];
  n[i] = hex;
  return n;
}

/** Clear slot `i`. */
export function clearSlot(picks: (string | null)[], i: number): (string | null)[] {
  return picks.map((v, j) => (j === i ? null : v));
}
