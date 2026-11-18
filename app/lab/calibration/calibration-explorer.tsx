"use client";

import { useState } from "react";

type Series = {
  n: number[];
  meanPredicted: (number | null)[];
  realizedRate: (number | null)[];
  ciLo: (number | null)[];
  ciHi: (number | null)[];
};

export type MetricRow = {
  subgroup: string;
  nMarkets: number;
  brierScore: number;
  logLoss: number;
  snapshotType: string;
};

export type CalibrationData = {
  snapshots: string[];
  categories: string[];
  edges: number[];
  overall: Record<string, Series>;
  byCategory: Record<string, Record<string, Series>>;
  metrics: MetricRow[];
};

const ALL = "all";
const HORIZONS: Record<string, string> = { close: "At close", "1h": "1 hour", "24h": "24 hours", "7d": "7 days" };
// Theme colours live in globals.css (--cat-*): fixed per category, validated for
// colour-vision deficiency on both themes' surfaces.
const COLORS: Record<string, string> = {
  [ALL]: "var(--cat-all)",
  crypto: "var(--cat-crypto)",
  entertainment: "var(--cat-entertainment)",
  geopolitics: "var(--cat-geopolitics)",
  other: "var(--cat-other)",
  politics: "var(--cat-politics)",
  sports: "var(--cat-sports)",
};
const label = (s: string) => (s === ALL ? "All markets" : s[0].toUpperCase() + s.slice(1));
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const brier = (x: number) => (x >= 0.001 ? x.toFixed(3) : "< 0.001");

// Plot geometry (SVG user units).
const L = 44, R = 12, T = 12, B = 40, W = 300, H = 300;
const x = (p: number) => L + p * W;
const y = (r: number) => T + (1 - r) * H;
const TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1];
const GRID = Array.from({ length: 11 }, (_, i) => i / 10);

export default function CalibrationExplorer({ data }: { data: CalibrationData }) {
  const [snap, setSnap] = useState("7d");
  const [shown, setShown] = useState<string[]>([ALL, "politics", "sports"]);
  const keys = [ALL, ...data.categories];
  const seriesFor = (k: string) => (k === ALL ? data.overall[snap] : data.byCategory[snap][k]);
  const maxN = Math.max(...data.overall[snap].n);
  const metricsFor = (k: string) =>
    data.metrics.find((m) => m.snapshotType === snap && m.subgroup === (k === ALL ? "overall" : `category=${k}`))!;
  const table = keys
    .map((k) => ({ k, m: metricsFor(k) }))
    .sort((a, b) => (a.k === ALL ? -1 : b.k === ALL ? 1 : a.m.brierScore - b.m.brierScore));
  const toggle = (k: string) => setShown(shown.includes(k) ? shown.filter((s) => s !== k) : [...shown, k]);
  const bucketLabel = (i: number) =>
    `${Math.round(data.edges[i] * 100)}–${Math.round(data.edges[i + 1] * 100)}%`;

  return (
    <section aria-label="Calibration explorer">
      <div role="group" aria-label="Time before resolution" className="segmented">
        {data.snapshots.map((s) => (
          <button key={s} type="button" aria-pressed={s === snap} onClick={() => setSnap(s)}>
            {HORIZONS[s]}
          </button>
        ))}
      </div>
      <p>
        {HORIZONS[snap]}
        {snap === "close" ? "" : " before resolution"}: {metricsFor(ALL).nMarkets.toLocaleString("en-US")} markets.{" "}
        {snap === "close" || snap === "1h"
          ? "This close to resolution, prices have nearly converged to the outcome, so near-perfect calibration here is expected, not impressive. The 24-hour and 7-day views are the real test."
          : "Only markets with a recorded price this far before resolution are included."}
      </p>

      <fieldset>
        <legend>Show</legend>
        {keys.map((k) => (
          <label key={k} style={{ display: "inline-block", marginRight: "1rem" }}>
            <input type="checkbox" checked={shown.includes(k)} onChange={() => toggle(k)} />{" "}
            <span aria-hidden="true" style={{ color: COLORS[k] }}>
              {"●"}
            </span>{" "}
            {label(k)}
          </label>
        ))}
      </fieldset>

      <svg
        viewBox={`0 0 ${L + W + R} ${T + H + B}`}
        role="img"
        aria-label={`Calibration plot, ${HORIZONS[snap]}: share resolved Yes against average price, by price decile`}
        style={{ width: "100%", maxWidth: 520, height: "auto", display: "block", overflow: "visible" }}
      >
        {GRID.map((g) => (
          <g key={g} style={{ stroke: "var(--rule)" }} strokeWidth={0.5}>
            <line x1={x(g)} x2={x(g)} y1={y(0)} y2={y(1)} />
            <line x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} />
          </g>
        ))}
        {TICKS.map((t) => (
          <g key={t} fontSize={10} style={{ fill: "var(--ink-2)" }}>
            <text x={x(t)} y={y(0) + 14} textAnchor="middle">
              {Math.round(t * 100)}%
            </text>
            <text x={x(0) - 4} y={y(t) + 3} textAnchor="end">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        <text x={x(0.5)} y={T + H + 32} textAnchor="middle" fontSize={11} style={{ fill: "var(--ink-2)" }}>
          Average price (predicted probability)
        </text>
        <text transform={`translate(11 ${y(0.5)}) rotate(-90)`} textAnchor="middle" fontSize={11} style={{ fill: "var(--ink-2)" }}>
          Share resolved Yes
        </text>
        <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} style={{ stroke: "var(--ink-2)" }} strokeDasharray="4 3" />
        {keys
          .filter((k) => shown.includes(k))
          .map((k) => {
            const s = seriesFor(k);
            return (
              <g key={k} style={{ stroke: COLORS[k], fill: COLORS[k] }}>
                {s.n.map((n, i) => {
                  if (n === 0) return null;
                  const [p, r, lo, hi] = [s.meanPredicted[i]!, s.realizedRate[i]!, s.ciLo[i]!, s.ciHi[i]!];
                  return (
                    <g key={i}>
                      <title>
                        {`${label(k)}, ${bucketLabel(i)} bucket: ${n.toLocaleString("en-US")} markets, average price ${pct(p)}, resolved Yes ${pct(r)} (95% CI ${pct(lo)} to ${pct(hi)})`}
                      </title>
                      <line x1={x(p)} x2={x(p)} y1={y(lo)} y2={y(hi)} strokeWidth={1} />
                      <circle cx={x(p)} cy={y(r)} r={2 + 10 * Math.sqrt(n / maxN)} fillOpacity={0.45} strokeWidth={1} />
                    </g>
                  );
                })}
              </g>
            );
          })}
      </svg>
      <p>
        Each dot is one price decile: its average price against the share of those markets that resolved
        Yes. Dots on the dashed line are perfectly calibrated. Dot area grows with the number of markets;
        whiskers are 95% bootstrap intervals.
      </p>

      <table>
        <caption>Brier score by category, {HORIZONS[snap].toLowerCase()}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Markets</th>
            <th scope="col">Brier score</th>
          </tr>
        </thead>
        <tbody>
          {table.map(({ k, m }) => (
            <tr key={k}>
              <th scope="row">{label(k)}</th>
              <td>{m.nMarkets.toLocaleString("en-US")}</td>
              <td>{brier(m.brierScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Lower is better. Always guessing 50% scores 0.25; a perfect forecaster scores 0.</p>
    </section>
  );
}
