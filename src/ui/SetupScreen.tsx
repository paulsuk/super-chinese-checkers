import { useRef, useState } from "react";
import { SWATCHES } from "../config/palette";
import { GUEST } from "../state/meta";
import type { GameMeta } from "../state/meta";

// Slot index = ColorId. Slots 0,1,2 = top side (NW,N,NE); 3,4,5 = bottom side (SW,S,SE).
type DragSource = { hex: string; from: "tray" | number };
type Ghost = { hex: string; from: "tray" | number; x: number; y: number };

interface Props {
  roster: string[];
  lastMeta: GameMeta | null;
  onAddPlayer(name: string): void;
  onStart(meta: GameMeta): void;
  onCancel(): void;
}

export default function SetupScreen({ roster, lastMeta, onAddPlayer, onStart, onCancel }: Props) {
  const [players, setPlayers] = useState<[string, string]>([
    lastMeta?.players[0] ?? roster[0] ?? GUEST,
    lastMeta?.players[1] ?? roster[1] ?? GUEST,
  ]);
  const [picks, setPicks] = useState<(string | null)[]>(Array(6).fill(null));
  const [ghost, setGhost] = useState<Ghost | null>(null);

  const drag = useRef<DragSource | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const trayColors = SWATCHES.filter((hex) => !picks.includes(hex));
  const ready = picks.every((p) => p !== null);

  const slotAt = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y);
    const slot = el?.closest("[data-slot]") as HTMLElement | null;
    if (!slot) return null;
    const n = Number(slot.dataset.slot);
    return Number.isNaN(n) ? null : n;
  };

  const placeFirstEmpty = (hex: string) =>
    setPicks((p) => {
      const i = p.findIndex((v) => v === null);
      if (i < 0) return p;
      const n = [...p];
      n[i] = hex;
      return n;
    });

  const clearSlot = (i: number) => setPicks((p) => p.map((v, j) => (j === i ? null : v)));

  const drop = (src: DragSource, target: number) =>
    setPicks((p) => {
      const n = [...p];
      if (src.from === "tray") {
        n[target] = src.hex;
      } else {
        if (src.from === target) return p;
        const moving = n[src.from] ?? null;
        n[src.from] = n[target] ?? null;
        n[target] = moving;
      }
      return n;
    });

  const onDown = (e: React.PointerEvent, src: DragSource) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = src;
    start.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setGhost({ ...src, x: e.clientX, y: e.clientY });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (dx * dx + dy * dy > 64) moved.current = true; // 8px
    setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
  };
  const onUp = (e: React.PointerEvent) => {
    const src = drag.current;
    drag.current = null;
    setGhost(null);
    if (!src) return;
    if (moved.current) {
      const target = slotAt(e.clientX, e.clientY);
      if (target !== null) drop(src, target);
    } else if (src.from === "tray") {
      placeFirstEmpty(src.hex);
    } else {
      clearSlot(src.from);
    }
  };
  const dragHandlers = (src: DragSource) => ({
    onPointerDown: (e: React.PointerEvent) => onDown(e, src),
    onPointerMove: onMove,
    onPointerUp: onUp,
  });

  const pickPlayer = (side: 0 | 1, name: string) => {
    if (name === "__new__") {
      const entered = prompt("New player name:")?.trim();
      if (!entered || entered === GUEST || roster.includes(entered)) return;
      onAddPlayer(entered);
      setPlayers((pl) => (side === 0 ? [entered, pl[1]] : [pl[0], entered]));
      return;
    }
    setPlayers((pl) => (side === 0 ? [name, pl[1]] : [pl[0], name]));
  };

  const sideCard = (side: 0 | 1) => (
    <div className="w-full max-w-sm rounded-xl bg-neutral-800 p-3">
      <div className="mb-1 text-xs text-neutral-400">{side === 0 ? "Top half" : "Bottom half"}</div>
      <div className="mb-2 flex flex-wrap gap-2">
        {[...roster, GUEST].map((name) => {
          const takenByOther = name !== GUEST && players[side === 0 ? 1 : 0] === name;
          return (
            <button
              key={name}
              disabled={takenByOther}
              className={`rounded-lg px-3 py-1 disabled:opacity-30 ${
                players[side] === name ? "bg-emerald-600 text-white" : "bg-neutral-600 text-neutral-100"
              }`}
              onClick={() => pickPlayer(side, name)}
            >
              {name}
            </button>
          );
        })}
        <button
          className="rounded-lg bg-neutral-600 px-3 py-1 text-neutral-300"
          onClick={() => pickPlayer(side, "__new__")}
        >
          + New…
        </button>
      </div>
      <div className="flex gap-3">
        {[0, 1, 2].map((k) => {
          const i = side * 3 + k;
          const hex = picks[i];
          return (
            <div
              key={k}
              data-slot={i}
              className={`grid h-12 w-12 place-items-center rounded-full border-2 ${
                hex ? "border-transparent" : "border-dashed border-neutral-500"
              }`}
            >
              {hex && (
                <div
                  className="h-11 w-11 touch-none rounded-full"
                  style={{ background: hex, opacity: ghost?.from === i ? 0.4 : 1 }}
                  {...dragHandlers({ hex, from: i })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col items-center gap-4 overflow-y-auto bg-neutral-900 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-neutral-100">
      <h1 className="text-2xl font-semibold">Game setup</h1>
      {sideCard(0)}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          className="rounded-lg bg-neutral-700 px-3 py-1"
          onClick={() => setPlayers(([a, b]) => [b, a])}
        >
          Swap players
        </button>
        {lastMeta && (
          <button
            className="rounded-lg bg-neutral-700 px-3 py-1"
            onClick={() => { setPlayers([...lastMeta.players]); setPicks([...lastMeta.palette]); }}
          >
            Use last game's setup
          </button>
        )}
        <button
          className="rounded-lg bg-neutral-700 px-3 py-1"
          onClick={() => setPicks(Array(6).fill(null))}
        >
          Reset colors
        </button>
      </div>
      {sideCard(1)}
      <div className="text-xs text-neutral-500">Drag a color onto a slot · drag between slots to swap · tap a slot to clear</div>
      <div className="flex flex-wrap justify-center gap-3">
        {trayColors.map((hex) => (
          <div
            key={hex}
            className="h-11 w-11 touch-none rounded-full"
            style={{ background: hex, opacity: ghost?.from === "tray" && ghost.hex === hex ? 0.4 : 1 }}
            {...dragHandlers({ hex, from: "tray" })}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-3">
        <button
          disabled={!ready}
          className="rounded-xl bg-emerald-700 px-8 py-3 text-xl text-white disabled:opacity-40"
          onClick={() => onStart({ palette: picks as string[], players: [...players] as [string, string] })}
        >
          Start
        </button>
        <button className="rounded-xl bg-neutral-800 px-6 py-3 text-xl" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {ghost && (
        <div
          className="pointer-events-none fixed z-50 h-12 w-12 rounded-full border-2 border-white/70"
          style={{ left: ghost.x, top: ghost.y, transform: "translate(-50%,-50%)", background: ghost.hex }}
        />
      )}
    </div>
  );
}
