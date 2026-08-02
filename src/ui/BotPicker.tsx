import { useState } from "react";
import { BOTS } from "../bots/profiles";
import { DEFAULT_ASSIGNMENT } from "../config/palette";
import { GUEST } from "../state/meta";
import type { GameMeta } from "../state/meta";
import { Avatar } from "./avatars";

interface Props {
  roster: string[];
  lastMeta: GameMeta | null;
  onStart(m: GameMeta): void;
  onCancel(): void;
}

export default function BotPicker({ roster, lastMeta, onStart, onCancel }: Props) {
  const [botId, setBotId] = useState(BOTS[0]!.id);
  const [human, setHuman] = useState(roster[0] ?? GUEST);
  const names = [...roster, GUEST];
  const start = () => {
    const bot = BOTS.find((b) => b.id === botId)!;
    const bottom3 =
      lastMeta && !lastMeta.botId ? lastMeta.palette.slice(3) : [...DEFAULT_ASSIGNMENT].slice(3);
    onStart({
      palette: [...bot.palette, ...bottom3],
      players: [bot.name, human],
      botId: bot.id,
    });
  };
  return (
    <div className="flex h-full flex-col items-center gap-5 overflow-y-auto bg-neutral-900 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] text-neutral-100">
      <h1 className="text-2xl font-semibold">Play the bettybots</h1>
      <div className="flex w-full max-w-md flex-col gap-3">
        {BOTS.map((b) => (
          <button
            key={b.id}
            className={`flex items-center gap-4 rounded-2xl bg-neutral-800 p-4 text-left ${
              b.id === botId ? "ring-2 ring-emerald-500" : ""
            }`}
            onClick={() => setBotId(b.id)}
          >
            <Avatar id={b.avatar} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium">{b.name}</span>
                <span className="flex gap-1">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={`h-2 w-2 rounded-full ${
                        n <= b.difficulty ? "bg-emerald-500" : "bg-neutral-600"
                      }`}
                    />
                  ))}
                </span>
              </div>
              <div className="truncate text-sm text-neutral-400">{b.tagline}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="w-full max-w-md">
        <div className="mb-1 text-sm text-neutral-400">Playing as</div>
        <div className="flex flex-wrap gap-2">
          {names.map((n) => (
            <button
              key={n}
              className={`rounded-lg px-3 py-2 ${
                n === human ? "bg-emerald-700 text-white" : "bg-neutral-800"
              }`}
              onClick={() => setHuman(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <button className="w-64 rounded-xl bg-emerald-600 px-6 py-3 text-xl text-white" onClick={start}>
        Start
      </button>
      <button className="w-64 rounded-xl bg-neutral-800 px-6 py-3 text-xl" onClick={onCancel}>
        Back
      </button>
    </div>
  );
}
