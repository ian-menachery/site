import { describe, expect, it } from "vitest";
import companiesData from "@/data/dcf/companies.json";
import referenceData from "@/data/dcf/reference_cases.json";
import {
  type CompanyAssumptions,
  type DcfInputs,
  type Overrides,
  SCENARIOS,
  TerminalGrowthError,
  valueBand,
  valueDcf,
} from "./dcf";

const REL = 1e-9;
const close = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThanOrEqual(REL);

const { horizon } = companiesData;
const byTicker = Object.fromEntries(
  companiesData.companies.map((c) => [c.ticker, c.assumptions as CompanyAssumptions]),
);

describe("stored redline valuations (dcf_valuations ids 21, 22)", () => {
  // Values from redline data/valuation_demo.db, independent of the exported JSON.
  const stored = {
    ULTA: [296.9798327597857, 463.5588055002078, 620.6023470015728, 21489674218.26, 0.766487255462765],
    VRTX: [351.75689122133264, 483.01430668380004, 592.4546494635149, 119229791124.42, 0.8566899269526246],
  };
  for (const [ticker, [bear, base, bull, ev, tvf]] of Object.entries(stored)) {
    it(`${ticker} bear/base/bull per share, EV and TV fraction`, () => {
      const b = valueBand(byTicker[ticker], horizon);
      close(b.bear.perShare, bear);
      close(b.base.perShare, base);
      close(b.bull.perShare, bull);
      expect(Math.abs(b.base.enterpriseValue - ev)).toBeLessThan(0.01); // stored to the cent
      close(b.base.terminalValueFraction, tvf);
      const c = companiesData.companies.find((x) => x.ticker === ticker)!.stored;
      close(b.base.enterpriseValue, c.enterpriseValue);
      close(b.base.terminalValueFraction, c.terminalValueFraction);
    });
  }

  it("exports only ULTA and VRTX, with no reference price", () => {
    expect(companiesData.companies.map((c) => c.ticker)).toEqual(["ULTA", "VRTX"]);
    expect(JSON.stringify(companiesData)).not.toMatch(/reference|price/i);
  });
});

describe("redline Python reference cases", () => {
  const cases = referenceData.cases as {
    ticker: string;
    overrides: Overrides;
    expected?: Record<string, Record<string, number>>;
    error?: string;
  }[];

  it("covers at least 10 perturbed input sets per company", () => {
    for (const t of ["ULTA", "VRTX"])
      expect(cases.filter((c) => c.ticker === t && c.expected).length).toBeGreaterThanOrEqual(10);
  });

  cases.forEach((c, i) => {
    it(`case ${i}: ${c.ticker} ${JSON.stringify(c.overrides)}`, () => {
      const run = () => valueBand(byTicker[c.ticker], referenceData.horizon, c.overrides);
      if (c.error) {
        expect(run).toThrow(TerminalGrowthError);
        return;
      }
      const band = run();
      for (const s of SCENARIOS)
        for (const k of ["perShare", "enterpriseValue", "equityValue", "terminalValueFraction"] as const)
          close(band[s][k], c.expected![s][k]);
    });
  });
});

describe("hand-computed case (redline tests/test_dcf.py:53-74)", () => {
  const inputs: DcfInputs = {
    baseRevenue: 1000,
    baseNwc: 100,
    sharesOutstanding: 100,
    netDebt: 437.5,
    taxRate: 0.25,
    wacc: 0.1,
    terminalGrowth: 0.02,
    drivers: {
      revenueGrowth: [0.1],
      operatingMargin: [0.2],
      capexPctRevenue: [0.05],
      daPctRevenue: [0.05],
      nwcPctRevenue: [0.1],
    },
  };

  it("EV 1937.5, equity 1500, $15.00 per share", () => {
    const r = valueDcf(inputs);
    close(r.enterpriseValue, 1937.5);
    close(r.equityValue, 1500);
    close(r.perShare, 15);
    close(r.terminalValueFraction, 1796.590909090909 / 1937.5);
  });

  it("throws when terminal growth >= WACC", () => {
    expect(() => valueDcf({ ...inputs, terminalGrowth: 0.1 })).toThrow(TerminalGrowthError);
    expect(() => valueDcf({ ...inputs, terminalGrowth: 0.12 })).toThrow(TerminalGrowthError);
    expect(() => valueBand(byTicker.ULTA, horizon, { wacc: 0.03, terminalGrowth: 0.03 })).toThrow(
      TerminalGrowthError,
    );
  });
});
