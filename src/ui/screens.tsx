import { useRef, useState } from "react";
import { marginSoFar } from "../engine/rules";
import { aggregates, parseImport, serializeExport } from "../state/stats";
import type { GameRecord, Settings, StatsExport } from "../state/stats";
import { replaceAll } from "../state/persist";
import { isGuestGame } from "../state/meta";
import type { GameMeta } from "../state/meta";
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

export function StatsScreen({ records, roster, onBack }: {
  records: GameRecord[]; roster: string[]; onBack(): void;
}) {
  const a = aggregates(records);
  const entries = Object.entries(a.winsByName).sort((x, y) => y[1] - x[1]);
  const top = entries[0] ?? [roster[0] ?? "Player 1", 0];
  const second = entries[1] ?? [(roster.find((n) => n !== top[0]) ?? "Player 2"), 0];
  const min = (ms: number | null) => (ms === null ? "—" : `${Math.round(ms / 60000)} min`);
  const num = (n: number | null, d = 1) => (n === null ? "—" : n.toFixed(d));
  return (
    <Shell title="Stats" onBack={onBack}>
      <div className="text-4xl font-bold">
        {top[1]} <span className="text-neutral-400">—</span> {second[1]}
      </div>
      <div className="text-neutral-400">{top[0]} vs {second[0]} · {a.games} games</div>
      {entries.slice(2).map(([name, wins]) => (
        <div key={name} className="text-sm text-neutral-400">{name}: {wins} wins</div>
      ))}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-lg">
        <span className="text-neutral-400">Streak</span>
        <span>{a.streak ? `${a.streak.name} × ${a.streak.count}` : "—"}</span>
        <span className="text-neutral-400">Avg margin</span><span>{num(a.avgMargin)}</span>
        <span className="text-neutral-400">Avg moves</span><span>{num(a.avgMoves, 0)}</span>
        <span className="text-neutral-400">Avg length</span><span>{min(a.avgDurationMs)}</span>
      </div>
      <div className="mt-4 w-full max-w-sm">
        {records.slice(-10).reverse().map((r, i) => (
          <div key={`${r.finishedAt}-${i}`} className="flex justify-between border-b border-neutral-800 py-2 text-sm">
            <span>{r.winnerName} beat {r.loserName} by {r.marginOfVictory}</span>
            <span className="text-neutral-400">{r.moveCount} moves · {r.finishedAt.slice(0, 10)}</span>
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function SettingsScreen({ settings, records, onAddPlayer, onImport, onBack }: {
  settings: Settings; records: GameRecord[];
  onAddPlayer(name: string): void; onImport(x: StatsExport): void; onBack(): void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState("");
  const canAdd = newName.trim().length > 0 &&
    newName.trim() !== "Guest" && !settings.roster.includes(newName.trim());
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
    if (!confirm(`Replace roster and ${x.records.length} game records?`)) return;
    await replaceAll(x);
    onImport(x);
  };
  return (
    <Shell title="Settings" onBack={onBack}>
      <div className="w-64">
        <div className="mb-1 text-sm text-neutral-400">Players</div>
        {settings.roster.map((name) => (
          <div key={name} className="border-b border-neutral-800 py-1">{name}</div>
        ))}
        <div className="mt-2 flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg bg-neutral-800 px-3 py-2"
            placeholder="New player name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            className="rounded-lg bg-neutral-700 px-3 py-2 disabled:opacity-40"
            disabled={!canAdd}
            onClick={() => { onAddPlayer(newName.trim()); setNewName(""); }}
          >
            Add
          </button>
        </div>
      </div>
      <Btn onClick={doExport}>Export backup</Btn>
      <Btn onClick={() => fileRef.current?.click()}>Import backup</Btn>
      <input
        ref={fileRef} type="file" accept="application/json" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ""; }}
      />
    </Shell>
  );
}

export function WinOverlay({ game, meta, onNewGame, onMenu }: {
  game: GameState; meta: GameMeta; onNewGame(): void; onMenu(): void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-neutral-950/85 text-neutral-100">
      <div className="text-4xl font-bold">{meta.players[game.winner!]} wins!</div>
      <div className="text-xl text-neutral-300">
        Margin of victory: {marginSoFar(game)} · {game.history.length} moves
      </div>
      {isGuestGame(meta) && (
        <div className="text-sm text-neutral-400">guest game — not recorded</div>
      )}
      <Btn primary onClick={onNewGame}>New game</Btn>
      <Btn onClick={onMenu}>Menu</Btn>
    </div>
  );
}
