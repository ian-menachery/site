import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import exported from "@/data/pushfold/pushfold.json";
import reference from "@/data/pushfold/reference_cases.json";
import {
  CLASS_NAMES,
  MISTAKE_BB,
  PURE,
  classIndex,
  depthFor,
  equilibrium,
  grade,
  type Action,
  type Position,
  type PushFoldData,
} from "./pushfold";

const data = exported as PushFoldData;
const TOL = 1e-6;

describe("reference cases graded by showdown's policy.py and grade.py", () => {
  it("has enough cases, covering depths 1 and 20, both seats, both actions, mixed hands", () => {
    const cases = reference.cases;
    expect(cases.length).toBeGreaterThanOrEqual(30);
    for (const depth of [1, 20]) expect(cases.some((c) => c.depth === depth)).toBe(true);
    for (const position of ["sb", "bb"])
      for (const action of ["allin", "fold"])
        expect(cases.some((c) => c.position === position && c.action === action)).toBe(true);
    expect(cases.some((c) => c.nash === "mixed")).toBe(true);
  });

  it("uses the same constants", () => {
    expect(MISTAKE_BB).toBe(reference.mistake_bb);
    expect(PURE).toBe(reference.pure);
  });

  it.each(reference.cases)(
    "$depth bb $position $hand $action loses $bb_lost bb",
    (c) => {
      const g = grade(data, c.depth, c.position as Position, c.hand, c.action as Action);
      expect(Math.abs(g.bbLost - c.bb_lost)).toBeLessThanOrEqual(TOL);
      expect(g.mistake).toBe(c.mistake);
      expect(Math.abs(g.freq - c.freq)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(g.evs.fold - c.ev_fold)).toBeLessThanOrEqual(TOL);
      expect(Math.abs(g.evs.allin - c.ev_allin)).toBeLessThanOrEqual(TOL);
      expect(equilibrium(data, c.depth, c.position as Position, c.hand).action).toBe(c.nash);
    },
  );

  it.each(reference.depth_cases)("effective $effective bb grades at $depth bb", (c) => {
    expect(depthFor(c.effective)).toBe(c.depth);
  });
});

describe("export integrity", () => {
  it("has 20 depths of 169 classes", () => {
    expect(data.depths.map((d) => d.stack)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
    for (const d of data.depths)
      for (const values of [d.push, d.call, d.sb_jam_ev, d.bb_call_ev])
        expect(values).toHaveLength(169);
  });

  it("lists classes in the npz's grid order", () => {
    expect(data.classes).toEqual(reference.npz_class_names);
    expect(data.classes).toEqual(CLASS_NAMES);
    expect(classIndex("AKs")).toBe(1);
    expect(classIndex("AKo")).toBe(13);
    expect(classIndex("22")).toBe(168);
  });

  it("names the matrix it was solved on", () => {
    expect(data.matrix_sha256).toBe(reference.npz_sha256);
    expect(data.sb_fold_ev).toBe(-0.5);
    expect(data.bb_fold_ev).toBe(-1);
  });
});

// Only runs where the showdown repo is checked out next to this one.
const SHOWDOWN = "C:/Users/ianme/projects/showdown";
describe.skipIf(!existsSync(SHOWDOWN))("against the showdown repo", () => {
  it("matches the matrix file's SHA-256", () => {
    const bytes = readFileSync(`${SHOWDOWN}/data/preflop_169_exact.npz`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(data.matrix_sha256);
  });

  it("matches the committed solution within 1e-6", () => {
    const source = JSON.parse(readFileSync(`${SHOWDOWN}/data/pushfold.json`, "utf8"));
    expect(source.matrix_sha256).toBe(data.matrix_sha256);
    source.depths.forEach(
      (d: { push: Record<string, number>; call: Record<string, number> }, k: number) => {
        CLASS_NAMES.forEach((name, i) => {
          expect(Math.abs(d.push[name] - data.depths[k].push[i])).toBeLessThanOrEqual(TOL);
          expect(Math.abs(d.call[name] - data.depths[k].call[i])).toBeLessThanOrEqual(TOL);
        });
      },
    );
  });
});
