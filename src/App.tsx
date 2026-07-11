import { useEffect, useRef, useState } from "react";
import { gameReducer } from "./state/gameReducer";
import type { GameAction } from "./state/gameReducer";
import { recordFromGame } from "./state/stats";
import type { GameRecord, Settings, StatsExport } from "./state/stats";
import {
  appendRecord, clearGame, loadGame, loadRecords, loadSettings, saveGame, saveSettings,
} from "./state/persist";
import { devNearWin } from "./state/devFixtures";
import { PLAYER_DEFAULTS } from "./config/palette";
import BoardView, { cellAt } from "./ui/BoardView";
import GestureLayer from "./ui/GestureLayer";
import Hud from "./ui/Hud";
import { Menu, SettingsScreen, StatsScreen, WinOverlay } from "./ui/screens";
import { useMoveInput } from "./ui/useMoveInput";
import { useViewTransform } from "./ui/useViewTransform";
import type { GameState } from "./engine/types";

type Screen = "menu" | "game" | "stats" | "settings";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [game, setGame] = useState<GameState | null>(null);
  const [settings, setSettings] = useState<Settings>({
    p1Name: PLAYER_DEFAULTS[0], p2Name: PLAYER_DEFAULTS[1],
  });
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const view = useViewTransform();
  const recordedFor = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [g, s, r] = await Promise.all([loadGame(), loadSettings(), loadRecords()]);
        setGame(g ?? null);
        setSettings(s);
        setRecords(r);
      } catch (e) {
        console.error(e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (game ? saveGame(game) : clearGame()).catch(console.error);
  }, [game, loaded]);

  const act = (action: GameAction) => {
    const next = gameReducer(game, action);
    if (next === game) return;
    if (next && next.phase === "done" && game?.phase !== "done") {
      const gameKey = `${next.startedAt}:${next.history.length}`;
      if (recordedFor.current !== gameKey) {
        recordedFor.current = gameKey;
        const rec = recordFromGame(next, new Date().toISOString());
        setRecords((rs) => [...rs, rec]);
        appendRecord(rec).catch(console.error);
      }
    }
    setGame(next);
  };
  const input = useMoveInput(game, (move) => act({ type: "COMMIT_MOVE", move }));

  const startNew = () => {
    if (game && game.phase !== "done" && !confirm("Abandon the current game?")) return;
    input.cancel();
    act({ type: "NEW_GAME", startedAt: new Date().toISOString() });
    setScreen("game");
  };
  const names: [string, string] = [settings.p1Name, settings.p2Name];

  if (!loaded) return <div className="h-full bg-neutral-900" />;
  if (screen === "stats") {
    return <StatsScreen records={records} names={names} onBack={() => setScreen("menu")} />;
  }
  if (screen === "settings") {
    return (
      <SettingsScreen
        settings={settings} records={records}
        onChange={(s) => { setSettings(s); saveSettings(s).catch(console.error); }}
        onImport={(x: StatsExport) => { setSettings(x.settings); setRecords(x.records); }}
        onBack={() => setScreen("menu")}
      />
    );
  }
  if (screen === "game" && game) {
    return (
      <div className="relative h-full bg-neutral-900">
        <GestureLayer view={view} onTap={(pt) => input.tap(cellAt(pt))}>
          <BoardView
            pieces={game.pieces} staged={input.staged}
            shake={input.shake} transform={view.transform}
          />
        </GestureLayer>
        <Hud
          game={game} names={names}
          stagedReady={!!input.staged && input.staged.path.length >= 2}
          onLockIn={input.lockIn}
          onCancel={() => input.cancel()}
          onUndo={() => { input.cancel(); act({ type: "UNDO" }); }}
          onResetView={view.reset}
          onMenu={() => setScreen("menu")}
        />
        {game.phase === "done" && (
          <WinOverlay
            game={game} names={names}
            onNewGame={startNew}
            onMenu={() => { setGame(null); setScreen("menu"); }}
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
          ? () => { input.cancel(); setGame(devNearWin(new Date().toISOString())); setScreen("game"); }
          : undefined
      }
    />
  );
}
