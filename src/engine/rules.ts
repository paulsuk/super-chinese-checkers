import { add, cellId, hopVector, parseId, scale, sub, classifyDir, DIRS } from "./coords";
import type { Axial } from "./coords";
import { CELLS, axisOfColor, initialPieces, targetCells, COLORS_OF_PLAYER, OWNER_OF_COLOR } from "./board";
import type { CellId, ColorId, GameState, Move, Phase, PlayerId } from "./types";

export type Pieces = Record<CellId, ColorId>;

const isEmpty = (pieces: Pieces, id: CellId): boolean => !(id in pieces);

const dirAllowed = (color: ColorId, dir: Axial): boolean =>
  classifyDir(dir, axisOfColor(color)) !== "backward";

/** Step legality. `pieces` has the mover lifted (origin removed). */
export function isLegalStep(pieces: Pieces, color: ColorId, from: CellId, to: CellId): boolean {
  if (!CELLS.has(to) || !isEmpty(pieces, to)) return false;
  const delta = sub(parseId(to), parseId(from));
  const dir = DIRS.find((d) => d.q === delta.q && d.r === delta.r);
  return dir !== undefined && dirAllowed(color, dir);
}

/** Symmetric-hop legality. `pieces` has the mover lifted (origin removed). */
export function isLegalHop(pieces: Pieces, color: ColorId, from: CellId, to: CellId): boolean {
  if (!CELLS.has(to) || !isEmpty(pieces, to)) return false;
  const hv = hopVector(sub(parseId(to), parseId(from)));
  if (!hv || !dirAllowed(color, hv.dir)) return false;
  const origin = parseId(from);
  for (let i = 1; i < 2 * hv.k; i++) {
    const cell = cellId(add(origin, scale(hv.dir, i)));
    if (!CELLS.has(cell)) return false; // the whole line of holes must exist
    if (i === hv.k) {
      if (isEmpty(pieces, cell)) return false; // pivot must hold a piece (any color)
    } else if (!isEmpty(pieces, cell)) {
      return false; // every other cell strictly between from and landing must be empty
    }
  }
  return true;
}

export function newGame(startedAt: string): GameState {
  return {
    pieces: initialPieces(),
    toMove: 0,
    phase: "playing",
    winner: null,
    winIndex: null,
    history: [],
    startedAt,
  };
}

export function playerFinished(pieces: Pieces, player: PlayerId): boolean {
  for (const color of COLORS_OF_PLAYER[player]!) {
    let home = 0;
    for (const id of targetCells(color)) if (pieces[id] === color) home++;
    if (home !== 10) return false;
  }
  return true;
}

export function validateMove(state: GameState, move: Move): boolean {
  if (state.phase === "done") return false;
  if (OWNER_OF_COLOR[move.color] !== state.toMove) return false;
  const { color, path } = move;
  if (path.length < 2) return false;
  const from = path[0]!;
  if (state.pieces[from] !== color) return false;
  const lifted: Pieces = { ...state.pieces };
  delete lifted[from];
  if (path.length === 2) {
    return (
      isLegalStep(lifted, color, from, path[1]!) ||
      isLegalHop(lifted, color, from, path[1]!)
    );
  }
  for (let i = 0; i + 1 < path.length; i++) {
    if (!isLegalHop(lifted, color, path[i]!, path[i + 1]!)) return false;
  }
  return true;
}

export function applyMove(state: GameState, move: Move): GameState {
  const pieces: Pieces = { ...state.pieces };
  delete pieces[move.path[0]!];
  pieces[move.path[move.path.length - 1]!] = move.color;
  const history = [...state.history, move];
  const mover = OWNER_OF_COLOR[move.color]!;
  let { phase, winner, winIndex } = state;
  let toMove: PlayerId;
  if (phase === "playing") {
    toMove = (1 - mover) as PlayerId;
    if (playerFinished(pieces, mover)) {
      phase = "finishOut";
      winner = mover;
      winIndex = history.length - 1;
    }
  } else {
    toMove = mover; // finish-out: the loser moves every turn (holds only because callers validateMove first — the winner can never pass the toMove gate)
    if (playerFinished(pieces, mover)) phase = "done";
  }
  return { ...state, pieces, history, toMove, phase, winner, winIndex };
}

export function replay(history: Move[], startedAt: string): GameState {
  return history.reduce(applyMove, newGame(startedAt));
}

export function undoMove(state: GameState): GameState {
  const last = state.history[state.history.length - 1];
  if (!last) return state;
  const history = state.history.slice(0, -1);
  const pieces: Pieces = { ...state.pieces };
  delete pieces[last.path[last.path.length - 1]!];
  pieces[last.path[0]!] = last.color;
  const winIndex =
    state.winIndex !== null && state.winIndex >= history.length ? null : state.winIndex;
  const winner = winIndex === null ? null : state.winner;
  const phase: Phase = winner === null ? "playing" : "finishOut";
  const toMove: PlayerId =
    phase === "playing" ? OWNER_OF_COLOR[last.color]! : ((1 - winner!) as PlayerId);
  return { ...state, pieces, history, toMove, phase, winner, winIndex };
}

export function marginSoFar(state: GameState): number | null {
  return state.winIndex === null ? null : state.history.length - 1 - state.winIndex;
}
