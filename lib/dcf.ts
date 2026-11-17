// Port of redline's DCF engine: src/redline/valuation/dcf.py (project_fcf, value_dcf)
// and src/redline/valuation/models.py (_scenario_drivers, to_dcf_inputs).
// Unlevered FCF, end-of-year discounting, Gordon-growth terminal value.

export type DcfDrivers = {
  revenueGrowth: number[];
  operatingMargin: number[];
  capexPctRevenue: number[];
  daPctRevenue: number[];
  nwcPctRevenue: number[];
};

export type DcfInputs = {
  baseRevenue: number;
  baseNwc: number;
  sharesOutstanding: number;
  netDebt: number;
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  drivers: DcfDrivers;
};

export type DcfResult = {
  perShare: number;
  enterpriseValue: number;
  equityValue: number;
  pvExplicit: number;
  pvTerminal: number;
  terminalValueFraction: number;
};

export type ProjectionYear = {
  year: number;
  revenueGrowth: number;
  revenue: number;
  ebit: number;
  nopat: number;
  fcf: number;
  pv: number;
};

export class TerminalGrowthError extends Error {
  constructor(wacc: number, terminalGrowth: number) {
    super(
      `wacc (${wacc}) must exceed terminal_growth (${terminalGrowth}) for a convergent Gordon terminal value`,
    );
    this.name = "TerminalGrowthError";
  }
}

export function projectFcf(inputs: DcfInputs): ProjectionYear[] {
  const d = inputs.drivers;
  let revenue = inputs.baseRevenue;
  let prevNwc = inputs.baseNwc;
  const discount = 1 + inputs.wacc;
  const rows: ProjectionYear[] = [];
  for (let t = 0; t < d.revenueGrowth.length; t++) {
    revenue = revenue * (1 + d.revenueGrowth[t]);
    const ebit = revenue * d.operatingMargin[t];
    const nopat = ebit * (1 - inputs.taxRate);
    const da = revenue * d.daPctRevenue[t];
    const capex = revenue * d.capexPctRevenue[t];
    const nwc = revenue * d.nwcPctRevenue[t];
    const changeInNwc = nwc - prevNwc;
    prevNwc = nwc;
    const fcf = nopat + da - capex - changeInNwc;
    rows.push({
      year: t + 1,
      revenueGrowth: d.revenueGrowth[t],
      revenue,
      ebit,
      nopat,
      fcf,
      pv: fcf / discount ** (t + 1),
    });
  }
  return rows;
}

/** Throws TerminalGrowthError when terminal growth >= WACC, as redline does. */
export function valueDcf(inputs: DcfInputs): DcfResult {
  const discount = 1 + inputs.wacc;
  const denom = inputs.wacc - inputs.terminalGrowth;
  if (denom <= 0) throw new TerminalGrowthError(inputs.wacc, inputs.terminalGrowth);
  const projection = projectFcf(inputs);
  const pvExplicit = projection.reduce((s, r) => s + r.pv, 0);
  const lastFcf = projection[projection.length - 1].fcf;
  const terminalValue = (lastFcf * (1 + inputs.terminalGrowth)) / denom;
  const pvTerminal = terminalValue / discount ** projection.length;
  const enterpriseValue = pvExplicit + pvTerminal;
  const equityValue = enterpriseValue - inputs.netDebt;
  return {
    perShare: equityValue / inputs.sharesOutstanding,
    enterpriseValue,
    equityValue,
    pvExplicit,
    pvTerminal,
    terminalValueFraction: enterpriseValue !== 0 ? pvTerminal / enterpriseValue : 0,
  };
}

export type ScenarioDelta = { growthDelta: number; marginDelta: number };

export type CompanyAssumptions = {
  baseRevenue: number;
  netDebt: number;
  sharesDiluted: number;
  taxRate: number;
  wacc: number;
  terminalGrowth: number;
  revenueGrowth: number[];
  operatingMargin: number;
  capexPctRevenue: number;
  daPctRevenue: number;
  nwcPctRevenue: number;
  bear: ScenarioDelta;
  bull: ScenarioDelta;
};

export type Scenario = "bear" | "base" | "bull";
export const SCENARIOS: Scenario[] = ["bear", "base", "bull"];

export function toDcfInputs(a: CompanyAssumptions, scenario: Scenario, horizon: number): DcfInputs {
  const { growthDelta, marginDelta } =
    scenario === "base" ? { growthDelta: 0, marginDelta: 0 } : a[scenario];
  // Pad the growth schedule with its last value to the horizon, or trim.
  const growth = [...a.revenueGrowth];
  while (growth.length < horizon) growth.push(growth[growth.length - 1]);
  const flat = (x: number) => Array<number>(horizon).fill(x);
  return {
    baseRevenue: a.baseRevenue,
    baseNwc: a.baseRevenue * a.nwcPctRevenue,
    sharesOutstanding: a.sharesDiluted,
    netDebt: a.netDebt,
    taxRate: a.taxRate,
    wacc: a.wacc,
    terminalGrowth: a.terminalGrowth,
    drivers: {
      revenueGrowth: growth.slice(0, horizon).map((g) => g + growthDelta),
      operatingMargin: flat(a.operatingMargin + marginDelta),
      capexPctRevenue: flat(a.capexPctRevenue),
      daPctRevenue: flat(a.daPctRevenue),
      nwcPctRevenue: flat(a.nwcPctRevenue),
    },
  };
}

/** Slider overrides: WACC, terminal growth and margin replace the base value;
 *  growthShift is added to every year's growth before the scenario deltas. */
export type Overrides = {
  wacc?: number;
  terminalGrowth?: number;
  growthShift?: number;
  operatingMargin?: number;
};

export function valueBand(
  a: CompanyAssumptions,
  horizon: number,
  o: Overrides = {},
): Record<Scenario, DcfResult> {
  const shifted: CompanyAssumptions = {
    ...a,
    wacc: o.wacc ?? a.wacc,
    terminalGrowth: o.terminalGrowth ?? a.terminalGrowth,
    revenueGrowth: a.revenueGrowth.map((g) => g + (o.growthShift ?? 0)),
    operatingMargin: o.operatingMargin ?? a.operatingMargin,
  };
  const band = {} as Record<Scenario, DcfResult>;
  for (const s of SCENARIOS) band[s] = valueDcf(toDcfInputs(shifted, s, horizon));
  return band;
}
