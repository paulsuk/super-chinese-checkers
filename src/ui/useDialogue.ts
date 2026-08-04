import { useEffect, useRef, useState } from "react";
import { EVENT_PRIORITY, detectEvents, freshMemory, pickLine } from "../bots/dialogue";
import type { DialogueMemory } from "../bots/dialogue";
import type { BotProfile, Line } from "../bots/types";
import type { GameState } from "../engine/types";

export function useDialogue(game: GameState | null, profile: BotProfile | null): Line | null {
  const [line, setLine] = useState<Line | null>(null);
  const mem = useRef<DialogueMemory>(freshMemory());
  const prev = useRef<GameState | null>(null);
  const forGame = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || !game) { prev.current = game; return; }
    if (forGame.current !== game.startedAt) {
      forGame.current = game.startedAt;
      mem.current = freshMemory();
      prev.current = null;
    }
    let picked: Line | null = null;
    if (prev.current === null && game.history.length === 0) {
      const r = pickLine(profile.lines, "intro", mem.current, 0, Math.random);
      if (r) { mem.current = r.mem; picked = r.line; }
    } else if (prev.current !== null && prev.current !== game) {
      const events = detectEvents(prev.current, game, 0);
      for (const ev of EVENT_PRIORITY) {
        if (!events.includes(ev)) continue;
        const r = pickLine(profile.lines, ev, mem.current, game.history.length, Math.random);
        if (r) { mem.current = r.mem; picked = r.line; break; }
      }
    }
    prev.current = game;
    if (picked) setLine(picked);
  }, [game, profile]);

  useEffect(() => {
    if (line === null) return;
    const t = setTimeout(() => setLine(null), 4000);
    return () => clearTimeout(t);
  }, [line]);

  return line;
}
