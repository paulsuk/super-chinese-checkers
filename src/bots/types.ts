export interface Weights {
  forward: number;   // per step unit of forward progress
  straggler: number; // per step unit of how far the mover lags its color's leader
  homeFill: number;  // per rank of net home-cell improvement (deepest rank = 10)
  chain: number;     // per hop beyond the first
  gift: number;      // penalty per step unit of opponent best-reply improvement
}

export interface BrainConfig {
  weights: Weights;
  temperature: number; // softmax temperature; 0 = deterministic argmax
  topK: number;        // candidates kept for sampling
  replyCheck: boolean; // veto-style gift penalty (Lilibeth)
}

export type Line = string | { text: string; cheer: true };

export interface LinePools {
  intro: Line[];
  bigChain: Line[];
  humanBigChain: Line[];
  closingIn: Line[];
  win: Line[];
  lose: Line[];
}

export interface BotProfile {
  id: string;
  name: string;
  tagline: string;
  difficulty: 1 | 2 | 3;
  avatar: string;
  palette: [string, string, string]; // colors 0..2 (bot always plays top)
  think: { minMs: number; maxMs: number };
  brain: BrainConfig;
  lines: LinePools;
}
