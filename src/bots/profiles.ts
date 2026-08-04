import type { BotProfile, BrainConfig, Line } from "./types";

export const lineText = (l: Line): string => (typeof l === "string" ? l : l.text);
export const isCheer = (l: Line): boolean => typeof l !== "string" && l.cheer === true;

/** Deterministic textbook brain used by AUTO_FINISH (both bot skip and human auto-finish). */
export const AUTOPILOT_BRAIN: BrainConfig = {
  // revisit must stay below this brain's smallest real score gap or it would demote a
  // strictly better move. progress, lag, rank delta and stray depth are all integers, so
  // the reachable scores are 1a + 0.8b + 1.2c + 8d — a lattice of spacing exactly 0.2.
  weights: { forward: 1, straggler: 0.8, homeFill: 1.2, chain: 0, gift: 0, stray: 8, revisit: 0.1 },
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
      // Sloppy on purpose: chain-obsessed, careless about filling home, and hot enough
      // to pick near-randomly. `stray`/`straggler` stay high anyway — those are what keep
      // a game finishing at all, and at this temperature they need a wide score gap to survive.
      // Nerf 2026-08-02: quality weights halved (forward/homeFill/chain) so she picks
      // worse directions, but the safety terms (stray, straggler) keep their full
      // temp-6 ratios — dropping those below ~exp(2) per depth brings back corner
      // squatting and the no-legal-moves crash.
      weights: { forward: 0.5, straggler: 1.2, homeFill: 0.25, chain: 1.5, gift: 0, stray: 12 },
      temperature: 6,
      topK: 22,
      replyCheck: false,
    },
    lines: {
      intro: [
        "hiii!! ok ok ok. me first? me first!",
        "Mia-bettybot in the HOUSE. wait. how do the pieces go again?",
        { text: "BOP-PY-BOP-PY-BOP-PY-BOP! BOP-PY-BOP-PY-BOP-PY-BOP!", cheer: true },
      ],
      bigChain: [
        { text: "GO MIA! GO MIA! GO MIA!", cheer: true },
        { text: "BACK-IT-UP! BACK-IT-UP! BACK-IT-UP!", cheer: true },
        { text: "CAPY-MIA CAPY-MIA CAPY-MIA CAPY-MIA", cheer: true },
      ],
      humanBigChain: [
        "HOW DID YOU DO THAT! CAN YOU TEACH ME",
        "I NEED MY NIGHTGOWN",
      ],
      closingIn: [
        "is it getting spicy in here or is it just my headphones",
        "ok focus, Mia. focus. what were we doing",
        "somebody's almost home!! is it me?? please be me",
      ],
      win: [
        "WAIT. I WON?? cue boppy! this one goes out to the cheerleading squad!",
        { text: "GO MIA! GO MIA! GO MIA!", cheer: true },
      ],
      lose: [
        "aw. AW. ok that's fair, you were so good. rematch after my set?",
        "thank you everyone for coming to my set!",
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
      weights: { forward: 1, straggler: 1.2, homeFill: 1, chain: 0.3, gift: 0, stray: 8 },
      temperature: 0.3,
      topK: 4,
      replyCheck: false,
    },
    lines: {
      intro: [
        "I am June-y-bettybot. RAWR. RAWR. RAWR. We are starting... now.",
        "I have graded a lot of games today. Do not disappoint me.",
      ],
      bigChain: [
        "Observe: a simple application of geometry.",
        "That is what a prepared piece looks like. Take notes.",
        "Textbook. I would give myself full marks.",
      ],
      humanBigChain: [
        "Hm. Correct technique. RAWR.",
        "I DIDN'T CALCULATE THAT",
      ],
      closingIn: [
        "The endgame is arithmetic now.",
        "Every move you waste leads me closer to my Field's medal?",
      ],
      win: [
        "As calculated. Review your mistakes and come back.",
        "The math was never on your side. See me after class.",
      ],
      lose: [
        "...Recount. Hmph. RAWR RAWR.",
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
      weights: { forward: 1, straggler: 1.2, homeFill: 2, chain: 0.5, gift: 1, stray: 10 },
      temperature: 0.1,
      topK: 6,
      replyCheck: true,
    },
    lines: {
      intro: [
        "I AM LILIBETTY-BOT.",
        "Lilibeth. Creator, visionary, very good girl. Your move first? No — mine.",
        "I ran the simulations. You lose in most of them. Shall we find out which this is?",
      ],
      bigChain: [
        "Yes, that was planned four turns ago. Keep up.",
        "A small demonstration of why my brain is so large.",
        "Elegant, isn't it? I planned it before we began.",
      ],
      humanBigChain: [
        "Interesting. I permitted that, of course.",
        "YOU STOLE MY INVENTION",
        "A good jump. I invented better ones.",
      ],
      closingIn: [
        "The board is converging exactly as projected.",
        "Endgame protocols engaged.",
        "Almost done. I have already drafted my victory speech.",
      ],
      win: [
        "As we always expected, Lilibeth number one.",
        { text: "Lilibettybots in the house!!!!", cheer: true },
      ],
      lose: [
        "Impossible. ...Improbable. ...Impressive. Rematch, immediately.",
        "I'M SENDING YOU TO THE DUNGEON",
      ],
    },
  },
];

export const botById = (id: string): BotProfile | null =>
  BOTS.find((b) => b.id === id) ?? null;
