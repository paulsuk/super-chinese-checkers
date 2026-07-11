import { useRef } from "react";
import { marginSoFar } from "../engine/rules";
import { aggregates, parseImport, serializeExport } from "../state/stats";
import type { GameRecord, Settings, StatsExport } from "../state/stats";
import { replaceAll } from "../state/persist";
import type { GameState } from "../engine/types";

function Btn({ onClick, children, primary = false }: {
  onClick(): void; children: React.ReactNode; primary?: boolean;
}) {
  return (
    <button
      className={`w-64 rounded-xl px-6 py-3 text-xl ${primary ? "bg-emerald-700 text-white" : "bg-neutral-800 text-neutral-100"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const Shell = ({ title, onBack, children }: {
  title: string; onBack?: () => void; children: React.ReactNode;
}) => (
  <div className="flex h-full flex-col items-center gap-4 overflow-y-auto bg-neutral-900 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-neutral-100">
    <h1 className="text-2xl font-semibold">{title}</h1>
    {children}
    {onBack && <Btn onClick={onBack}>Back</Btn>}
  </div>
);

export function Menu(p: {
  hasGame: boolean; onContinue(): void; onNew(): void; onStats(): void;
  onSettings(): void; onDevNearWin?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-900 text-neutral-100">
      <h1 className="mb-4 text-3xl font-semibold">Super Chinese Checkers</h1>
      {p.hasGame && <Btn primary onClick={p.onContinue}>Continue</Btn>}
      <Btn primary={!p.hasGame} onClick={p.onNew}>New game</Btn>
      <Btn onClick={p.onStats}>Stats</Btn>
      <Btn onClick={p.onSettings}>Settings</Btn>
      {p.onDevNearWin && <Btn onClick={p.onDevNearWin}>Near-win (dev)</Btn>}
    </div>
  );
}

export function StatsScreen({ records, names, onBack }: {
  records: GameRecord[]; names: [string, string]; onBack(): void;
}) {
  const a = aggregates(records);
  const min = (ms: number | null) => (ms === null ? "—" : `${Math.round(ms / 60000)} min`);
  const num = (n: number | null, d = 1) => (n === null ? "—" : n.toFixed(d));
  return (
    <Shell title="Stats" onBack={onBack}>
      <div className="text-4xl font-bold">
        {a.wins[0]} <span className="text-neutral-400">—</span> {a.wins[1]}
      </div>
      <div className="text-neutral-400">{names[0]} vs {names[1]} · {a.games} games</div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-lg">
        <span className="text-neutral-400">Streak</span>
        <span>{a.streak ? `${names[a.streak.player]} × ${a.streak.count}` : "—"}</span>
        <span className="text-neutral-400">Avg margin</span><span>{num(a.avgMargin)}</span>
        <span className="text-neutral-400">Avg moves</span><span>{num(a.avgMoves, 0)}</span>
        <span className="text-neutral-400">Avg length</span><span>{min(a.avgDurationMs)}</span>
      </div>
      <div className="mt-4 w-full max-w-sm">
        {records.slice(-10).reverse().map((r, i) => (
          <div key={i} className="flex justify-between border-b border-neutral-800 py-2 text-sm">
            <span>{names[r.winner]} won by {r.marginOfVictory}</span>
            <span className="text-neutral-400">{r.moveCount} moves · {r.finishedAt.slice(0, 10)}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SettingsScreen({ settings, records, onChange, onImport, onBack }: {
  settings: Settings; records: GameRecord[];
  onChange(s: Settings): void; onImport(x: StatsExport): void; onBack(): void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const doExport = async () => {
    const json = serializeExport({ settings, records });
    const file = new File([json], `super-cc-stats-${new Date().toISOString().slice(0, 10)}.json`, {
      type: "application/json",
    });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
    } else {
      const url = URL.createObjectURL(file);
      const el = document.createElement("a");
      el.href = url; el.download = file.name; el.click();
      URL.revokeObjectURL(url);
    }
  };
  const doImport = async (f: File) => {
    const x = parseImport(await f.text());
    if (!x) { alert("Not a valid backup file."); return; }
    if (!confirm(`Replace player names and ${x.records.length} game records?`)) return;
    await replaceAll(x);
    onImport(x);
  };
  const field = (label: string, key: keyof Settings) => (
    <label className="flex w-64 flex-col gap-1">
      <span className="text-sm text-neutral-400">{label}</span>
      <input
        className="rounded-lg bg-neutral-800 px-3 py-2"
        value={settings[key]}
        onChange={(e) => onChange({ ...settings, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <Shell title="Settings" onBack={onBack}>
      {field("Player 1 (top of board)", "p1Name")}
      {field("Player 2 (bottom of board)", "p2Name")}
      <Btn onClick={doExport}>Export backup</Btn>
      <Btn onClick={() => fileRef.current?.click()}>Import backup</Btn>
      <input
        ref={fileRef} type="file" accept="application/json" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ""; }}
      />
    </Shell>
  );
}

export function WinOverlay({ game, names, onNewGame, onMenu }: {
  game: GameState; names: [string, string]; onNewGame(): void; onMenu(): void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-neutral-950/85 text-neutral-100">
      <div className="text-4xl font-bold">{names[game.winner!]} wins!</div>
      <div className="text-xl text-neutral-300">
        Margin of victory: {marginSoFar(game)} · {game.history.length} moves
      </div>
      <Btn primary onClick={onNewGame}>New game</Btn>
      <Btn onClick={onMenu}>Menu</Btn>
    </div>
  );
}
