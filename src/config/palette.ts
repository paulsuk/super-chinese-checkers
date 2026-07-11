// 12 curated swatches — pairwise distinguishable at piece size on the dark board
export const SWATCHES: readonly string[] = [
  "#e5484d", // red
  "#f76b15", // orange
  "#e3c012", // yellow
  "#99d52a", // lime
  "#2a9d5c", // green
  "#12a594", // teal
  "#00b3d0", // cyan
  "#3b6fe0", // blue
  "#8b5cf6", // violet
  "#cf3897", // magenta
  "#ad7f58", // brown
  "#e8e8e8", // white
];

// Default per-ColorId assignment (0-2 top NW/N/NE, 3-5 bottom SW/S/SE)
export const DEFAULT_ASSIGNMENT: string[] = [
  SWATCHES[9]!, SWATCHES[1]!, SWATCHES[2]!, // magenta, orange, yellow
  SWATCHES[7]!, SWATCHES[4]!, SWATCHES[8]!, // blue, green, violet
];

export const TINT_ALPHA = 0.35; // target-triangle background tint

export const withAlpha = (hex: string, alpha: number): string =>
  hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
