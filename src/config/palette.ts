// ColorId order: 0 NW, 1 N, 2 NE (player 0) | 3 SW, 4 S, 5 SE (player 1)
export const PALETTE = ["#d1345b", "#e8871e", "#e3c012", "#3b6fe0", "#2a9d5c", "#7b4fd8"] as const;
export const TINT_ALPHA = 0.22; // target-triangle background tint
export const PLAYER_DEFAULTS: [string, string] = ["Player 1", "Player 2"];

export const withAlpha = (hex: string, alpha: number): string =>
  hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
