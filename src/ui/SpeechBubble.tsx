import { isCheer, lineText } from "../bots/profiles";
import type { BotProfile, Line } from "../bots/types";
import { Avatar } from "./avatars";

export default function SpeechBubble({ profile, line }: { profile: BotProfile; line: Line }) {
  const cheer = isCheer(line);
  return (
    <div className="pointer-events-none absolute left-3 top-20 z-10 flex items-start gap-2">
      <Avatar id={profile.avatar} size={36} />
      <div
        className={`bubble max-w-[70vw] rounded-xl px-3 py-2 text-sm ${
          cheer
            ? "bg-pink-100 font-bold uppercase tracking-wide text-pink-700"
            : "bg-neutral-100 text-neutral-900"
        }`}
      >
        {lineText(line)}
      </div>
    </div>
  );
}
