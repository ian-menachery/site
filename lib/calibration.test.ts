import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import buckets from "@/data/calibration/buckets.json";
import metrics from "@/data/calibration/metrics.json";

// data/calibration/source/*.csv are byte-identical copies of calibration-tracker's reports/.
function readCsv(name: string): Record<string, string>[] {
  const text = readFileSync(new URL(`../data/calibration/source/${name}`, import.meta.url), "utf8");
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [cols[i], v])));
}
const num = (s: string) => (s === "" ? null : Number(s));

type Series = { n: number[]; meanPredicted: (number | null)[]; realizedRate: (number | null)[]; ciLo: (number | null)[]; ciHi: (number | null)[] };
const overall = buckets.overall as Record<string, Series>;
const byCategory = buckets.byCategory as Record<string, Record<string, Series>>;
const bucketCsv = readCsv("calibration_buckets.csv");
const metricsCsv = readCsv("calibration_metrics.csv");

describe("overall buckets", () => {
  it("equal the decile, market-weighted rows of calibration_buckets.csv exactly", () => {
    expect(bucketCsv).toHaveLength(240);
    for (const snap of buckets.snapshots) {
      const rows = bucketCsv.filter(
        (r) => r.snapshot_type === snap && r.bucketing === "decile" && r.weighting === "market",
      );
      expect(rows).toHaveLength(10);
      expect(rows.map((r) => Number(r.bucket_lo))).toEqual(buckets.edges.slice(0, 10));
      expect(rows.map((r) => Number(r.bucket_hi))).toEqual(buckets.edges.slice(1));
      expect(overall[snap]).toEqual({
        n: rows.map((r) => Number(r.n_markets)),
        meanPredicted: rows.map((r) => num(r.mean_predicted)),
        realizedRate: rows.map((r) => num(r.realized_rate)),
        ciLo: rows.map((r) => num(r.ci_lo)),
        ciHi: rows.map((r) => num(r.ci_hi)),
      });
    }
  });
});

describe("metrics", () => {
  it("equal calibration_metrics.csv exactly", () => {
    expect(metricsCsv).toHaveLength(44);
    expect(metrics.rows).toEqual(
      metricsCsv.map((r) => ({
        subgroup: r.subgroup,
        nMarkets: Number(r.n_markets),
        brierScore: Number(r.brier_score),
        logLoss: Number(r.log_loss),
        snapshotType: r.snapshot_type,
      })),
    );
  });

  it("has the headline 7d Brier scores", () => {
    const brier = (sub: string) =>
      metrics.rows.find((r) => r.snapshotType === "7d" && r.subgroup === sub)!.brierScore;
    expect(brier("category=politics")).toBe(0.10570477160493828);
    expect(brier("category=sports")).toBe(0.23612974762711866);
    expect(brier("overall")).toBe(0.18528803786574874);
  });
});

describe("per-category buckets", () => {
  // Every market gets exactly one category, so categories partition the markets.
  it("counts sum to the overall counts in every bucket and snapshot", () => {
    for (const snap of buckets.snapshots)
      for (let i = 0; i < 10; i++) {
        const sum = buckets.categories.reduce((s, c) => s + byCategory[snap][c].n[i], 0);
        expect(sum).toBe(overall[snap].n[i]);
      }
  });

  it("n-weighted means of predicted and realized equal the overall bucket values", () => {
    for (const snap of buckets.snapshots)
      for (let i = 0; i < 10; i++) {
        const n = overall[snap].n[i];
        if (n === 0) continue;
        for (const k of ["meanPredicted", "realizedRate"] as const) {
          const total = buckets.categories.reduce((s, c) => {
            const b = byCategory[snap][c];
            return s + (b.n[i] ? b.n[i] * b[k][i]! : 0);
          }, 0);
          expect(Math.abs(total - n * overall[snap][k][i]!)).toBeLessThan(1e-9 * n);
        }
      }
  });

  it("category totals match the market counts in calibration_metrics.csv", () => {
    for (const snap of buckets.snapshots) {
      const count = (sub: string) =>
        metrics.rows.find((r) => r.snapshotType === snap && r.subgroup === sub)!.nMarkets;
      let all = 0;
      for (const c of buckets.categories) {
        const n = byCategory[snap][c].n.reduce((a, b) => a + b, 0);
        expect(n).toBe(count(`category=${c}`));
        all += n;
      }
      expect(all).toBe(count("overall"));
    }
  });

  it("CIs bracket the realized rate; empty buckets are null; single-market buckets have a point CI", () => {
    for (const snap of buckets.snapshots)
      for (const c of buckets.categories) {
        const b = byCategory[snap][c];
        b.n.forEach((n, i) => {
          if (n === 0) {
            expect([b.meanPredicted[i], b.realizedRate[i], b.ciLo[i], b.ciHi[i]]).toEqual([null, null, null, null]);
            return;
          }
          const [lo, r, hi] = [b.ciLo[i]!, b.realizedRate[i]!, b.ciHi[i]!];
          expect(0 <= lo && lo <= r && r <= hi && hi <= 1).toBe(true);
          if (n === 1) expect([lo, hi]).toEqual([r, r]);
        });
      }
  });
});
