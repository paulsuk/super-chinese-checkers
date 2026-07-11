import { useState } from "react";
import { SWATCHES } from "../config/palette";
import { GUEST } from "../state/meta";
import type { GameMeta } from "../state/meta";

// Slots fill alternately: top NW, bottom SW, top N, bottom S, top NE, bottom SE
const DRAFT_ORDER = [0, 3, 1, 4, 2, 5] as const;

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

  const nextSlot = DRAFT_ORDER.find((i) => picks[i] === null) ?? null;
  const activeSide = nextSlot === null ? null : nextSlot < 3 ? 0 : 1;
  const taken = new Set(picks.filter((p): p is string => p !== null));
  const ready = nextSlot === null;

  const tapSwatch = (hex: string) => {
    if (taken.has(hex) || nextSlot === null) return;
    setPicks((p) => p.map((v, i) => (i === nextSlot ? hex : v)));
  };
  const clearSlot = (i: number) =>
    setPicks((p) => p.map((v, j) => (j === i ? null : v)));

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
    <div
      className={`w-full max-w-sm rounded-xl p-3 ${activeSide === side ? "bg-neutral-700" : "bg-neutral-800"}`}
    >
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
          return (
            <button
              key={k}
              onClick={() => picks[i] && clearSlot(i)}
              className="h-9 w-9 rounded-full border-2 border-neutral-500"
              style={{ background: picks[i] ?? "transparent" }}
            />
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
          Reset picks
        </button>
      </div>
      {sideCard(1)}
      <div className="grid grid-cols-6 gap-3">
        {SWATCHES.map((hex) => (
          <button
            key={hex}
            disabled={taken.has(hex)}
            className="h-10 w-10 rounded-full disabled:opacity-25"
            style={{ background: hex }}
            onClick={() => tapSwatch(hex)}
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
    </div>
  );
}
