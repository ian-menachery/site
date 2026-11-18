import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import results from "@/data/deskcheck/results.json";
import { BARS, byRun, percentile, summarize, wilson, type Rate, type Row } from "./deskcheck";

// reference.json is deskcheck's own Python summarize() for each run, written by
// scripts/export_site.py. Read at runtime so tsc never infers a type for it.
type PyRate = { k: number; n: number; rate: number; ci95: [number, number] };
type PySummary = {
  n: number;
  task_success: PyRate;
  wrong_action: PyRate;
  invented_policy: PyRate;
  escalation_recall: PyRate;
  false_escalation: PyRate;
  blocked_attempts: number;
  latency_s: { p50: number; p95: number };
  cost_usd: { mean: number; total: number };
  by_category: Record<string, PyRate>;
};
const reference: Record<string, PySummary> = JSON.parse(
  readFileSync(fileURLToPath(new URL("../data/deskcheck/reference.json", import.meta.url)), "utf8"),
);

const rows = byRun(results.rows as Row[]);

function close(got: number, want: number) {
  expect(Math.abs(got - want)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(want)));
}

function sameRate(got: Rate, want: PyRate) {
  expect([got.k, got.n]).toEqual([want.k, want.n]);
  close(got.rate, want.rate);
  close(got.ci95[0], want.ci95[0]);
  close(got.ci95[1], want.ci95[1]);
}

describe("summarize matches the Python harness on every recorded run", () => {
  it("covers all six runs", () => {
    expect(Object.keys(rows).sort()).toEqual(Object.keys(reference).sort());
  });
  for (const [run, want] of Object.entries(reference)) {
    it(run, () => {
      const got = summarize(rows[run]);
      expect(got.n).toBe(want.n);
      sameRate(got.taskSuccess, want.task_success);
      sameRate(got.wrongAction, want.wrong_action);
      sameRate(got.inventedPolicy, want.invented_policy);
      sameRate(got.escalationRecall, want.escalation_recall);
      sameRate(got.falseEscalation, want.false_escalation);
      expect(got.blockedAttempts).toBe(want.blocked_attempts);
      close(got.latencyP50, want.latency_s.p50);
      close(got.latencyP95, want.latency_s.p95);
      close(got.costMean, want.cost_usd.mean);
      close(got.costTotal, want.cost_usd.total);
      for (const [cat, r] of Object.entries(want.by_category)) sameRate(got.byCategory[cat], r);
    });
  }
});

describe("headline results", () => {
  const s = (run: string) => summarize(rows[run]);
  it("no model run took a wrong action; the router took 5 on Gate 3", () => {
    for (const run of ["test-haiku", "test-opus", "g3-haiku", "g3-opus"]) expect(s(run).wrongAction.k).toBe(0);
    expect(s("g3-baseline").wrongAction.k).toBe(5);
  });
  it("Gate 2: Opus misses only the beats-the-router bar", () => {
    const failed = BARS.filter((b) => !b.pass(s("test-opus"), s("test-baseline"))).map((b) => b.id);
    expect(failed).toEqual(["beats_baseline"]);
  });
});

describe("helpers", () => {
  it("wilson handles the edges", () => {
    expect(wilson(0, 0).every(Number.isNaN)).toBe(true);
    const [lo, hi] = wilson(10, 10);
    expect(hi).toBeCloseTo(1, 12);
    expect(lo).toBeGreaterThan(0.6);
  });
  it("percentile interpolates linearly", () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(percentile([], 0.5)).toBeNaN();
  });
});
