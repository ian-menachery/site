"use client";

import { useState } from "react";
import {
  type CompanyAssumptions,
  type DcfResult,
  type Scenario,
  SCENARIOS,
  TerminalGrowthError,
  valueBand,
} from "@/lib/dcf";

export type Company = {
  ticker: string;
  name: string;
  assumptions: CompanyAssumptions;
};

// Slider state is held in basis points (integers) so the defaults reproduce
// redline's inputs exactly: 830 / 10000 === 0.083.
type Bp = { wacc: number; terminalGrowth: number; growthShift: number; operatingMargin: number };
const toBp = (x: number) => Math.round(x * 10000);
const defaults = (a: CompanyAssumptions): Bp => ({
  wacc: toBp(a.wacc),
  terminalGrowth: toBp(a.terminalGrowth),
  growthShift: 0,
  operatingMargin: toBp(a.operatingMargin),
});

const pct = (bp: number) => `${(bp / 100).toFixed(1)}%`;
const pts = (bp: number) => `${bp > 0 ? "+" : bp < 0 ? "−" : ""}${Math.abs(bp / 100).toFixed(1)} pts`;
const sign = (x: number) => (x < 0 ? "−" : "");
const usd = (x: number) =>
  `${sign(x)}$${Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const billions = (x: number) => `${sign(x)}$${Math.abs(x / 1e9).toFixed(1)}B`;
const ptsFrac = (x: number) => pts(Math.round(x * 10000));

const LABELS: Record<Scenario, string> = { bear: "Bear", base: "Base", bull: "Bull" };

function Slider(props: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (bp: number) => string;
  onChange: (bp: number) => void;
}) {
  return (
    <p>
      <label htmlFor={props.id}>
        {props.label}: <output htmlFor={props.id}>{props.format(props.value)}</output>
      </label>
      <br />
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </p>
  );
}

export default function DcfSliders({ companies, horizon }: { companies: Company[]; horizon: number }) {
  const [ticker, setTicker] = useState(companies[0].ticker);
  const company = companies.find((c) => c.ticker === ticker)!;
  const a = company.assumptions;
  const [bp, setBp] = useState<Bp>(() => defaults(a));
  const set = (k: keyof Bp) => (v: number) => setBp({ ...bp, [k]: v });

  let band: Record<Scenario, DcfResult> | null = null;
  try {
    band = valueBand(a, horizon, {
      wacc: bp.wacc / 10000,
      terminalGrowth: bp.terminalGrowth / 10000,
      growthShift: bp.growthShift / 10000,
      operatingMargin: bp.operatingMargin / 10000,
    });
  } catch (e) {
    if (!(e instanceof TerminalGrowthError)) throw e;
  }

  const growth = a.revenueGrowth.map((g) => pct(toBp(g) + bp.growthShift)).join(", ");

  return (
    <section aria-label="DCF sliders">
      <fieldset>
        <legend>Company</legend>
        {companies.map((c) => (
          <label key={c.ticker} style={{ marginRight: "1rem" }}>
            <input
              type="radio"
              name="dcf-company"
              value={c.ticker}
              checked={c.ticker === ticker}
              onChange={() => {
                setTicker(c.ticker);
                setBp(defaults(c.assumptions));
              }}
            />{" "}
            {c.ticker} ({c.name})
          </label>
        ))}
      </fieldset>

      <Slider id="dcf-wacc" label="WACC" value={bp.wacc} min={300} max={1500} step={10} format={pct} onChange={set("wacc")} />
      <Slider
        id="dcf-tg"
        label="Terminal growth"
        value={bp.terminalGrowth}
        min={0}
        max={500}
        step={10}
        format={pct}
        onChange={set("terminalGrowth")}
      />
      <Slider
        id="dcf-shift"
        label="Revenue growth shift (every year)"
        value={bp.growthShift}
        min={-1000}
        max={1000}
        step={50}
        format={pts}
        onChange={set("growthShift")}
      />
      <Slider
        id="dcf-margin"
        label="Operating margin"
        value={bp.operatingMargin}
        min={0}
        max={5000}
        step={50}
        format={pct}
        onChange={set("operatingMargin")}
      />
      <p>
        Base-case revenue growth, years 1 to {horizon}: {growth}.{" "}
        <button type="button" onClick={() => setBp(defaults(a))}>
          Reset to redline&apos;s assumptions
        </button>
      </p>

      {band ? (
        <table>
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Per share</th>
              <th scope="col">Enterprise value</th>
              <th scope="col">Terminal value share of EV</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => (
              <tr key={s}>
                <th scope="row">{LABELS[s]}</th>
                <td>{usd(band[s].perShare)}</td>
                <td>{billions(band[s].enterpriseValue)}</td>
                <td>{(band[s].terminalValueFraction * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p role="alert">
          No valuation: terminal growth ({pct(bp.terminalGrowth)}) must be below WACC ({pct(bp.wacc)}).
          Otherwise the Gordon growth terminal value never converges, and redline refuses to compute it.
        </p>
      )}
      <p>
        Bear and bull move every year&apos;s growth and the margin by redline&apos;s fixed deltas for{" "}
        {ticker}: bear {ptsFrac(a.bear.growthDelta)} growth, {ptsFrac(a.bear.marginDelta)} margin; bull{" "}
        {ptsFrac(a.bull.growthDelta)} growth, {ptsFrac(a.bull.marginDelta)} margin. Capex, D&amp;A and
        working capital stay at {pct(toBp(a.capexPctRevenue))}, {pct(toBp(a.daPctRevenue))} and{" "}
        {pct(toBp(a.nwcPctRevenue))} of revenue; tax is {pct(toBp(a.taxRate))}.
      </p>
    </section>
  );
}
