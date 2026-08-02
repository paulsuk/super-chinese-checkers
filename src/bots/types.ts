export interface Weights {
  forward: number;   // per step unit of forward progress
  straggler: number; // per step unit of how far the mover lags its color's leader
  homeFill: number;  // per rank of net home-cell improvement (deepest rank = 10)
  chain: number;     // per hop beyond the first
  gift: number;      // penalty per step unit of opponent best-reply improvement
  /**
   * Per row of net depth gained inside a corner that is not this color's target
   * (see `strayDepth`). Optional; omit or 0 to disable. Negative score for moves
   * that bury a piece in a dead-end corner, positive for moves that dig one out.
   */
  stray?: number;
  /**
   * Flat penalty for landing a piece back on a cell its own color vacated in the
   * recent past. Optional; omit or 0 to disable. Only a deterministic brain
   * (temperature 0) really needs it: on a plateau every candidate can score
   * exactly 0, and an argmax then repeats the same cycle forever.
   *
   * It is subtracted unconditionally, so size it BELOW the smallest gap the rest of
   * the brain's weights can produce — otherwise it demotes moves that are genuinely
   * better rather than only separating exact ties.
   */
  revisit?: number;
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
