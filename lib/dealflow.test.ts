import { describe, expect, it } from "vitest";
import reference from "@/data/dealflow/reference_cases.json";
import { underwrite, type DealInputs, type DealOutputs } from "./dealflow";

// reference_cases.json is dealflow's own metrics.py output on made-up deals,
// produced by scripts/export_dealflow_reference.py.

describe("underwrite matches dealflow's metrics.py", () => {
  it("has at least 12 cases, including every null branch", () => {
    expect(reference.cases.length).toBeGreaterThanOrEqual(12);
    const outputs = reference.cases.map((c) => c.outputs);
    for (const key of ["cap_rate", "cash_on_cash", "dscr", "owner_earnings_yield"] as const) {
      expect(outputs.some((o) => o[key] === null)).toBe(true);
    }
  });

  for (const { name, inputs, outputs } of reference.cases) {
    it(name, () => {
      const got = underwrite(inputs as DealInputs);
      const want = outputs as DealOutputs;
      expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
      for (const key of Object.keys(want) as (keyof DealOutputs)[]) {
        const g = got[key];
        const w = want[key];
        if (w === null) {
          expect(g, key).toBeNull();
        } else {
          expect(g, key).not.toBeNull();
          const tolerance = 1e-9 * Math.abs(w);
          expect(Math.abs((g as number) - w), key).toBeLessThanOrEqual(tolerance);
        }
      }
    });
  }
});
