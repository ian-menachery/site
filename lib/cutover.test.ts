import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import demo from "@/data/cutover/demo.json";
import {
  compose,
  formatCents,
  norm,
  parseDate,
  parseMoney,
  runChecks,
  toRows,
  type Defect,
  type RegisterEntry,
  type Report,
  type Spec,
  type Tables,
} from "./cutover";

// reference.json is cutover's own Python/DuckDB report for 21 defect combinations,
// produced by scripts/export_site.py in the cutover repo. Read at runtime so the
// type checker never has to infer a type for 600 KB of JSON.
const reference = JSON.parse(
  readFileSync(new URL("../data/cutover/reference.json", import.meta.url), "utf8"),
) as { cases: { name: string; defects: string[]; report: Report }[] };

const spec = demo.spec as unknown as Spec;
const register = demo.register as RegisterEntry[];
const defects = demo.defects as unknown as Defect[];
const side = (s: "source" | "target") =>
  Object.fromEntries(
    Object.entries(demo.base[s]).map(([e, rows]) => [
      e,
      toRows((demo.columns[s] as Record<string, string[]>)[e], rows as string[][]),
    ]),
  );
const base: Tables = { source: side("source"), target: side("target") };

describe("the port matches cutover's Python engine", () => {
  it("covers the 21 registered cases", () => expect(reference.cases).toHaveLength(21));
  for (const c of reference.cases) {
    it(`${c.name}`, () => {
      const tables = compose(spec, base, defects, new Set(c.defects));
      expect(runChecks(spec, tables, register)).toEqual(c.report);
    });
  }
});

describe("value parsing follows DuckDB", () => {
  it("trims space separators but not tabs", () => {
    expect(norm(" a ")).toBe("a");
    expect(norm("\ta")).toBe("\ta");
    expect(norm("  ")).toBeNull();
  });
  it("try_strptime", () => {
    expect(parseDate("7/3/2015", "%m/%d/%Y")).toBe("2015-07-03");
    expect(parseDate("02/30/2015", "%m/%d/%Y")).toBeNull();
    expect(parseDate("2/29/2016", "%m/%d/%Y")).toBe("2016-02-29");
    expect(parseDate("13/01/2015", "%m/%d/%Y")).toBeNull();
    expect(parseDate("2015-07-03T00:00", "%Y-%m-%d")).toBeNull();
    expect(parseDate("02015-07-03", "%Y-%m-%d")).toBeNull();
  });
  it("DECIMAL(18,2) casts and rounds half away from zero", () => {
    const cents = (s: string) => parseMoney(s);
    expect(cents("1,234.5")).toBe(123450);
    expect(cents("1234.565")).toBe(123457);
    expect(cents("-1234.565")).toBe(-123457);
    expect(cents("-0.004")).toBe(0);
    expect(cents(".5")).toBe(50);
    expect(cents("5.")).toBe(500);
    expect(cents("$5")).toBeNull();
    expect(cents("12345678901234567.00")).toBeNull();
    expect(formatCents(-50)).toBe("-0.50");
  });
});
