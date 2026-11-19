// Lookups over showdown's solved push/fold game (scripts/export_pushfold.py).
// Python computes every number; this file only looks values up and subtracts
// (showdown DECISIONS 12: no game logic or strategy maths in JavaScript).

export type Position = "sb" | "bb";
/** "allin" is a jam for the SB and a call for the BB. */
export type Action = "allin" | "fold";

export type PushFoldDepth = {
  stack: number;
  exploitability: number;
  push: number[];
  call: number[];
  sb_jam_ev: number[];
  bb_call_ev: number[];
  /** Ante files only: per depth, since at 1 bb a fold is capped at the stack. */
  sb_fold_ev?: number;
  bb_fold_ev?: number;
};

export type PushFoldData = {
  source: string;
  algorithm: string;
  iterations: number;
  matrix_sha256: string;
  /** Per player, in bb; absent means no ante. */
  ante?: number;
  /** No-ante file only. */
  sb_fold_ev?: number;
  bb_fold_ev?: number;
  classes: string[];
  depths: PushFoldDepth[];
};

/** A decision losing more than this many bb against Nash is a mistake (policy.py). */
export const MISTAKE_BB = 0.001;
/** At or above this a class plays; at or below 1 - PURE it folds (pushfold.py). */
export const PURE = 0.99;
const RANKS = "AKQJT98765432";

/** 13×13 grid, row-major from A: above the diagonal suited, below offsuit. */
export function className(index: number): string {
  const row = Math.floor(index / 13);
  const col = index % 13;
  const name = RANKS[Math.min(row, col)] + RANKS[Math.max(row, col)];
  return row === col ? name : name + (row < col ? "s" : "o");
}

export const CLASS_NAMES = Array.from({ length: 169 }, (_, i) => className(i));

export function classIndex(name: string): number {
  const index = CLASS_NAMES.indexOf(name);
  if (index < 0) throw new Error(`unknown hand class ${name}`);
  return index;
}

/** Nearest solved depth, halves rounding up, clamped to 1-20 (grade.py). */
export function depthFor(effectiveBb: number): number {
  return Math.max(1, Math.min(20, Math.floor(effectiveBb + 0.5)));
}

export function atDepth(data: PushFoldData, depth: number): PushFoldDepth {
  const entry = data.depths[depth - 1];
  if (!entry || entry.stack !== depth) throw new Error(`no solution at ${depth} bb`);
  return entry;
}

/** The seat's EV of folding at this depth, in bb. */
export function foldEv(data: PushFoldData, depth: number, position: Position): number {
  const entry = atDepth(data, depth);
  const ev =
    position === "sb"
      ? (entry.sb_fold_ev ?? data.sb_fold_ev)
      : (entry.bb_fold_ev ?? data.bb_fold_ev);
  if (ev === undefined) throw new Error(`no fold EV at ${depth} bb`);
  return ev;
}

/** Nash probability of going all-in, and whether that is pure or mixed. */
export function equilibrium(
  data: PushFoldData,
  depth: number,
  position: Position,
  hand: string,
) {
  const entry = atDepth(data, depth);
  const freq = (position === "sb" ? entry.push : entry.call)[classIndex(hand)];
  const action: Action | "mixed" =
    freq >= PURE ? "allin" : freq <= 1 - PURE ? "fold" : "mixed";
  return { freq, action };
}

/** bb lost against the better action, given the opponent's Nash strategy. */
export function grade(
  data: PushFoldData,
  depth: number,
  position: Position,
  hand: string,
  action: Action,
) {
  const entry = atDepth(data, depth);
  const i = classIndex(hand);
  const evs = {
    fold: foldEv(data, depth, position),
    allin: (position === "sb" ? entry.sb_jam_ev : entry.bb_call_ev)[i],
  };
  const bbLost = Math.max(evs.fold, evs.allin) - evs[action];
  const freq = (position === "sb" ? entry.push : entry.call)[i];
  return { bbLost, mistake: bbLost > MISTAKE_BB, evs, freq };
}
