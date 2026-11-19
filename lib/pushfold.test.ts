import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import exported from "@/data/pushfold/pushfold.json";
import exportedAnte from "@/data/pushfold/pushfold_ante10.json";
import reference from "@/data/pushfold/reference_cases.json";
import {
  CLASS_NAMES,
  MISTAKE_BB,
  PURE,
  classIndex,
  depthFor,
  equilibrium,
  foldEv,
  grade,
  type Action,
  type Position,
  type PushFoldData,
} from "./pushfold";

const data = exported as PushFoldData;
const ante = exportedAnte as PushFoldData;
const DEPTHS = Array.from({ length: 20 }, (_, i) => i + 1);
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
  it.each([
    ["no ante", data],
    ["10% ante", ante],
  ])("has 20 depths of 169 classes (%s)", (_, file) => {
    expect(file.depths.map((d) => d.stack)).toEqual(DEPTHS);
    expect(file.classes).toEqual(CLASS_NAMES);
    expect(file.matrix_sha256).toBe(reference.npz_sha256);
    for (const d of file.depths)
      for (const values of [d.push, d.call, d.sb_jam_ev, d.bb_call_ev])
        expect(values).toHaveLength(169);
  });

  it("folding costs 0.6 and 1.1 bb with the ante, capped at the 1 bb stack", () => {
    expect(ante.ante).toBe(0.1);
    expect(data.ante).toBeUndefined();
    for (const depth of DEPTHS) {
      expect(foldEv(data, depth, "sb")).toBe(-0.5);
      expect(foldEv(data, depth, "bb")).toBe(-1);
      expect(foldEv(ante, depth, "sb")).toBe(-0.6);
      expect(foldEv(ante, depth, "bb")).toBe(depth === 1 ? -1 : -1.1);
    }
    expect(grade(ante, 1, "bb", "72o", "fold").evs.fold).toBe(-1);
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

  it.each([
    ["pushfold.json", data],
    ["pushfold_ante10.json", ante],
  ])("matches the committed %s within 1e-6", (path, file) => {
    const source = JSON.parse(readFileSync(`${SHOWDOWN}/data/${path}`, "utf8"));
    expect(source.matrix_sha256).toBe(file.matrix_sha256);
    expect(source.ante).toBe(file.ante);
    source.depths.forEach(
      (d: { push: Record<string, number>; call: Record<string, number> }, k: number) => {
        CLASS_NAMES.forEach((name, i) => {
          expect(Math.abs(d.push[name] - file.depths[k].push[i])).toBeLessThanOrEqual(TOL);
          expect(Math.abs(d.call[name] - file.depths[k].call[i])).toBeLessThanOrEqual(TOL);
        });
      },
    );
  });
});
