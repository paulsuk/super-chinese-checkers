import { useEffect, useRef, useState } from "react";
import { gameReducer } from "./state/gameReducer";
import type { GameAction } from "./state/gameReducer";
import { migrateRecords, recordFromGame } from "./state/stats";
import type { GameRecord, Settings, StatsExport } from "./state/stats";
import {
  appendRecord, clearGame, loadGame, loadRecords, loadSettings,
  replaceRecords, saveGame, saveSettings,
} from "./state/persist";
import {
  clearMeta, defaultMeta, isGuestGame, loadLastMeta, loadMeta, saveLastMeta, saveMeta,
} from "./state/meta";
import type { GameMeta } from "./state/meta";
import { devNearWin } from "./state/devFixtures";
import BoardView, { cellAt } from "./ui/BoardView";
import GestureLayer from "./ui/GestureLayer";
import Hud from "./ui/Hud";
import { Menu, SettingsScreen, StatsScreen, WinOverlay } from "./ui/screens";
import SetupScreen from "./ui/SetupScreen";
import { useMoveInput } from "./ui/useMoveInput";
import { useViewTransform } from "./ui/useViewTransform";
import type { GameState } from "./engine/types";

type Screen = "menu" | "game" | "stats" | "settings" | "setup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [game, setGame] = useState<GameState | null>(null);
  const [meta, setMeta] = useState<GameMeta | null>(null);
  const [lastMeta, setLastMeta] = useState<GameMeta | null>(null);
  const [settings, setSettings] = useState<Settings>({ roster: [] });
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const recordedFor = useRef<string | null>(null);
  const view = useViewTransform();

  useEffect(() => {
    void (async () => {
      try {
        const s = await loadSettings();
        const [g, m, lm, rawRecords] = await Promise.all([
          loadGame(), loadMeta(), loadLastMeta(), loadRecords(),
        ]);
        const mig = migrateRecords(rawRecords, s.roster);
        if (mig.changed) await replaceRecords(mig.records);
        setSettings(s);
        setRecords(mig.records);
        setGame(g ?? null);
        if (g && !m) {
          const fallback = defaultMeta(s.roster);
          await saveMeta(fallback);
          setMeta(fallback);
        } else {
          setMeta(m ?? null);
        }
        setLastMeta(lm ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (game ? saveGame(game) : Promise.all([clearGame(), clearMeta()])).catch(console.error);
  }, [game, loaded]);

  const act = (action: GameAction) => {
    const next = gameReducer(game, action);
    if (next === game) return;
    if (next && next.phase === "done" && game?.phase !== "done" && meta && !isGuestGame(meta)) {
      const gameKey = `${next.startedAt}:${next.history.length}`;
      if (recordedFor.current !== gameKey) {
        recordedFor.current = gameKey;
        const rec = recordFromGame(next, meta, new Date().toISOString());
        setRecords((rs) => [...rs, rec]);
        appendRecord(rec).catch(console.error);
      }
    }
    setGame(next);
  };
  const input = useMoveInput(game, (move) => act({ type: "COMMIT_MOVE", move }));

  const beginGame = (m: GameMeta, state?: GameState) => {
    input.cancel();
    setMeta(m);
    setLastMeta(m);
    Promise.all([saveMeta(m), saveLastMeta(m)]).catch(console.error);
    if (state) setGame(state);
    else act({ type: "NEW_GAME", startedAt: new Date().toISOString() });
    setScreen("game");
  };

  const startNew = () => {
    if (game && game.phase !== "done" && !confirm("Abandon the current game?")) return;
    setScreen("setup");
  };

  const addPlayer = (name: string) => {
    const s = { roster: [...settings.roster, name] };
    setSettings(s);
    saveSettings(s).catch(console.error);
  };

  if (!loaded) return <div className="h-full bg-neutral-900" />;
  if (screen === "stats") {
    return <StatsScreen records={records} roster={settings.roster} onBack={() => setScreen("menu")} />;
  }
  if (screen === "settings") {
    return (
      <SettingsScreen
        settings={settings} records={records}
        onAddPlayer={addPlayer}
        onImport={(x: StatsExport) => { setSettings(x.settings); setRecords(x.records); }}
        onBack={() => setScreen("menu")}
      />
    );
  }
  if (screen === "setup") {
    return (
      <SetupScreen
        roster={settings.roster}
        lastMeta={lastMeta}
        onAddPlayer={addPlayer}
        onStart={(m) => beginGame(m)}
        onCancel={() => setScreen(game ? "game" : "menu")}
      />
    );
  }
  if (screen === "game" && game && meta) {
    return (
      <div className="relative h-full bg-neutral-900">
        <GestureLayer view={view} onTap={(pt) => input.tap(cellAt(pt))}>
          <BoardView
            pieces={game.pieces} staged={input.staged}
            shake={input.shake} transform={view.transform}
            palette={meta.palette}
          />
        </GestureLayer>
        <Hud
          game={game} names={meta.players} palette={meta.palette}
          stagedReady={!!input.staged && input.staged.path.length >= 2}
          onLockIn={input.lockIn}
          onCancel={() => input.cancel()}
          onUndo={() => { input.cancel(); act({ type: "UNDO" }); }}
          onResetView={view.reset}
          onMenu={() => setScreen("menu")}
        />
        {game.phase === "done" && (
          <WinOverlay
            game={game} meta={meta}
            onNewGame={startNew}
            onMenu={() => { setGame(null); setMeta(null); setScreen("menu"); }}
          />
        )}
      </div>
    );
  }
  return (
    <Menu
      hasGame={!!game}
      onContinue={() => setScreen("game")}
      onNew={startNew}
      onStats={() => setScreen("stats")}
      onSettings={() => setScreen("settings")}
      onDevNearWin={
        import.meta.env.DEV
          ? () => beginGame(defaultMeta(settings.roster), devNearWin(new Date().toISOString()))
          : undefined
      }
    />
  );
}
