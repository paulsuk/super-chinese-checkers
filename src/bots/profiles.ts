import type { BotProfile, BrainConfig, Line } from "./types";

export const lineText = (l: Line): string => (typeof l === "string" ? l : l.text);
export const isCheer = (l: Line): boolean => typeof l !== "string" && l.cheer === true;

/** Deterministic textbook brain used by AUTO_FINISH (both bot skip and human auto-finish). */
export const AUTOPILOT_BRAIN: BrainConfig = {
  weights: { forward: 1, straggler: 0.8, homeFill: 1.2, chain: 0, gift: 0 },
  temperature: 0,
  topK: 1,
  replyCheck: false,
};

export const BOTS: readonly BotProfile[] = [
  {
    id: "mia",
    name: "Mia",
    tagline: "aspiring DJ. means well. back-it-up",
    difficulty: 1,
    avatar: "mia",
    palette: ["#f472b6", "#22d3ee", "#fb923c"],
    think: { minMs: 400, maxMs: 900 },
    brain: {
      weights: { forward: 1, straggler: 0, homeFill: 0.5, chain: 3, gift: 0 },
      temperature: 3,
      topK: 12,
      replyCheck: false,
    },
    lines: {
      intro: [
        "hiii!! ok ok ok. me first? me first!",
        "Mia-bettybot in the HOUSE. wait. how do the pieces go again?",
        "we got this. wait, who's we? oh no, it's just me",
      ],
      bigChain: [
        { text: "GO MIA! GO MIA! GO MIA!", cheer: true },
        "BACK-IT-UP back-it-up wooooo!",
        "did everybody see that?? somebody clip it!",
      ],
      humanBigChain: [
        "whoa whoa whoa. that was so cool. wait, that was against me",
        "ok that was honestly kind of amazing. can you teach me later?",
        { text: "GO... you? go you!", cheer: true },
      ],
      closingIn: [
        "is it getting spicy in here or is it just my headphones",
        "ok focus, Mia. focus. what were we doing",
        "somebody's almost home!! is it me?? please be me",
      ],
      win: [
        "WAIT. I WON?? cue boppy! this one goes out to my cheer squad!",
        { text: "GO MIA! GO MIA! SHE DID IT!", cheer: true },
      ],
      lose: [
        "aw. AW. ok that's fair, you were so good. rematch after my set?",
        "i lost the game but i WON a friend. also please play boppy on your way out",
      ],
    },
  },
  {
    id: "june",
    name: "June-y",
    tagline: "strict teacher. loves math. no sloppy moves",
    difficulty: 2,
    avatar: "june",
    palette: ["#facc15", "#84cc16", "#f59e0b"],
    think: { minMs: 800, maxMs: 1500 },
    brain: {
      weights: { forward: 1, straggler: 0.6, homeFill: 1, chain: 0.3, gift: 0 },
      temperature: 0.3,
      topK: 4,
      replyCheck: false,
    },
    lines: {
      intro: [
        "June-y-bettybot. Sit up straight, we are starting.",
        "I have graded a lot of games today. Do not disappoint me.",
        "Rule one: forward. Rule two: show your work.",
      ],
      bigChain: [
        "Observe: a simple application of geometry.",
        "That is what a prepared piece looks like. Take notes.",
        "Textbook. I would give myself full marks.",
      ],
      humanBigChain: [
        "Hm. Correct technique. I did not say I liked it.",
        "Partial credit. The setup was luckier than you think.",
        "Acceptable. Do it twice and I will believe it was on purpose.",
      ],
      closingIn: [
        "The endgame is arithmetic now. Do not get sloppy.",
        "Every move you waste, I am counting it.",
        "Check your stragglers. I always check mine.",
      ],
      win: [
        "As calculated. Review your mistakes and come back.",
        "The math was never on your side. See me after class.",
      ],
      lose: [
        "...Recount. Hm. The result stands. Well done — this once.",
        "You have passed. Extra homework anyway: play me again.",
      ],
    },
  },
  {
    id: "lilibeth",
    name: "Lilibeth",
    tagline: "creator of the bettybots. big brain, bigger ego",
    difficulty: 3,
    avatar: "lilibeth",
    palette: ["#e11d9b", "#a21caf", "#f0abfc"],
    think: { minMs: 900, maxMs: 1700 },
    brain: {
      weights: { forward: 1, straggler: 0.6, homeFill: 1, chain: 0.5, gift: 1 },
      temperature: 0.15,
      topK: 6,
      replyCheck: true,
    },
    lines: {
      intro: [
        "I built the bettybots. Beating me is, technically, a firmware issue.",
        "Lilibeth. Creator, visionary, very good girl. Your move first? No — mine.",
        "I ran the simulations. You lose in most of them. Shall we find out which this is?",
      ],
      bigChain: [
        "Yes, that was planned four turns ago. Keep up.",
        "A small demonstration of why I am the hardest setting.",
        "Elegant, isn't it? I designed the ladder before you sat down.",
      ],
      humanBigChain: [
        "Interesting. I permitted that, of course.",
        "Noted. Recalibrating. Do not get comfortable.",
        "A good jump. I invented better ones.",
      ],
      closingIn: [
        "The board is converging exactly as projected.",
        "Endgame protocols engaged. Try to make it dignified.",
        "Almost done. I have already drafted my victory remarks.",
      ],
      win: [
        "As projected. The wings are not just decorative.",
        "Update your priors: still undefeated in this household. Mostly.",
      ],
      lose: [
        "Impossible. ...Improbable. ...Impressive. Rematch, immediately.",
        "You beat the creator. Enjoy this feeling; I am patching it out.",
      ],
    },
  },
];

export const botById = (id: string): BotProfile | null =>
  BOTS.find((b) => b.id === id) ?? null;
