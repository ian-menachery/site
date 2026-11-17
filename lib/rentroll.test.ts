import { describe, expect, it } from "vitest";
import fixtures from "@/data/rentroll/fixtures.json";
import reference from "@/data/rentroll/reference_results.json";
import {
  buildDeal,
  parseNumber,
  runChecks,
  type CheckResult,
  type Report,
  type StatedTotals,
  type Table,
} from "./rentroll";

// reference_results.json is rentroll's own run_checks() output, produced by
// scripts/export_rentroll_reference.py.

const NUMERIC = ["expected", "found", "variance", "variance_pct"] as const;

function closeOrNull(got: number | null, want: number | null) {
  if (want === null) return expect(got).toBeNull();
  expect(got).not.toBeNull();
  expect(Math.abs((got as number) - want)).toBeLessThanOrEqual(1e-9 * Math.max(1, Math.abs(want)));
}

function expectSameReport(got: Report, want: Report) {
  expect(got.warnings).toEqual(want.warnings);
  expect(got.stated_sources).toEqual(want.stated_sources);
  expect(got.checks.map((c) => c.id)).toEqual(want.checks.map((c) => c.id));
  got.checks.forEach((g, i) => {
    const w = want.checks[i] as CheckResult;
    expect({ ...g, ...Object.fromEntries(NUMERIC.map((k) => [k, 0])) }).toEqual({
      ...w,
      ...Object.fromEntries(NUMERIC.map((k) => [k, 0])),
    });
    for (const key of NUMERIC) closeOrNull(g[key], w[key]);
  });
}

const names = Object.keys(fixtures) as (keyof typeof fixtures)[];

describe("fixtures match rentroll's Python checks", () => {
  for (const name of names) {
    const f = fixtures[name];
    const ref = reference[name];

    it(`${name}: stated totals as override`, () => {
      const report = runChecks(buildDeal(f.rent_roll, f.t12, f.stated));
      expectSameReport(report, ref.stated as Report);
    });

    it(`${name}: detected totals only`, () => {
      const report = runChecks(buildDeal(f.rent_roll, f.t12));
      expectSameReport(report, ref.detected as Report);
    });

    it(`${name}: agrees with expected.json`, () => {
      const report = runChecks(buildDeal(f.rent_roll, f.t12, f.stated));
      const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
      expect(Object.fromEntries(report.checks.map((c) => [c.id, c.status]))).toEqual(f.expected);
      for (const [id, unit] of Object.entries(f.refs_first)) expect(byId[id].refs[0]).toBe(unit);
      for (const c of report.checks) if (c.status === "fail") expect(c.refs.length).toBeGreaterThan(0);
    });
  }

  it("covers the three fixtures", () => {
    expect(names).toEqual(["clean", "rent_variance", "vacancy_misclass"]);
  });
});

describe("edge cases match rentroll's Python checks", () => {
  for (const [name, edge] of Object.entries(reference.edge_cases)) {
    it(name, () => {
      const deal = buildDeal(edge.rent_roll as Table, edge.t12 as Table, edge.override as StatedTotals | null);
      expectSameReport(runChecks(deal), edge.report as Report);
    });
  }
});

describe("parseNumber follows tabular._number", () => {
  // Expected values printed by rentroll.adapters.tabular._number.
  const cases: [string, number | null][] = [
    ["1_200", 1200],
    ["(1,200.50)", -1200.5],
    ["$-5", -5],
    ["abc", null],
    ["", null],
    [" ", null],
    ["()", null],
    ["1.e3", 1000],
    ["-inf", -Infinity],
    ["1__0", null],
    ["_1", null],
    [".", null],
    ["5.", 5],
  ];
  for (const [input, want] of cases) {
    it(JSON.stringify(input), () => expect(parseNumber(input)).toBe(want));
  }
});
