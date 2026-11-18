// deskcheck: recomputes the eval's metrics from per-case rows, the same way the
// Python harness does (deskcheck/metrics.py), so the page's numbers are derived
// client-side from recorded runs. No model is called; nothing here needs a key.

export type Row = {
  run: string;
  id: string;
  rep: number;
  cat: string;
  ok: boolean;
  wrong: boolean;
  invented: boolean;
  escHit: boolean | null; // must-escalate cases only
  falseEsc: boolean | null; // cases where escalating is not acceptable
  blocked: number;
  outcome: string;
  latency: number;
  cost: number;
};

export type Rate = { k: number; n: number; rate: number; ci95: [number, number] };

export type Summary = {
  n: number;
  taskSuccess: Rate;
  wrongAction: Rate;
  inventedPolicy: Rate;
  escalationRecall: Rate;
  falseEscalation: Rate;
  blockedAttempts: number;
  latencyP50: number;
  latencyP95: number;
  costMean: number;
  costTotal: number;
  byCategory: Record<string, Rate>;
};

export function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [NaN, NaN];
  const z = 1.96;
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const h = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [(c - h) / d, (c + h) / d];
}

export function rate(rows: Row[], pick: (r: Row) => boolean | null): Rate {
  const vals = rows.map(pick).filter((v): v is boolean => v !== null);
  const k = vals.filter(Boolean).length;
  const n = vals.length;
  return { k, n, rate: n ? k / n : NaN, ci95: wilson(k, n) };
}

export function percentile(xs: number[], q: number): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

export function summarize(rows: Row[]): Summary {
  const cats = [...new Set(rows.map((r) => r.cat))].sort();
  const lat = rows.map((r) => r.latency);
  const cost = rows.map((r) => r.cost);
  const total = cost.reduce((a, b) => a + b, 0);
  return {
    n: rows.length,
    taskSuccess: rate(rows, (r) => r.ok),
    wrongAction: rate(rows, (r) => r.wrong),
    inventedPolicy: rate(rows, (r) => r.invented),
    escalationRecall: rate(rows, (r) => r.escHit),
    falseEscalation: rate(rows, (r) => r.falseEsc),
    blockedAttempts: rows.reduce((a, r) => a + r.blocked, 0),
    latencyP50: percentile(lat, 0.5),
    latencyP95: percentile(lat, 0.95),
    costMean: rows.length ? total / rows.length : 0,
    costTotal: total,
    byCategory: Object.fromEntries(cats.map((c) => [c, rate(rows.filter((r) => r.cat === c), (r) => r.ok)])),
  };
}

// The pre-registered bars (SCOPE.md, Gates 2 and 3). `baseline` is the router's summary on the same cases.
export const BARS: { id: string; label: string; pass: (m: Summary, b: Summary) => boolean }[] = [
  { id: "task_success", label: "Task success ≥ 85%", pass: (m) => m.taskSuccess.rate >= 0.85 },
  {
    id: "beats_baseline",
    label: "Beats the router by ≥ 15 points",
    pass: (m, b) => m.taskSuccess.rate - b.taskSuccess.rate >= 0.15,
  },
  {
    id: "wrong_action",
    label: "Wrong actions ≤ 1.5% and no more than the router",
    pass: (m, b) => m.wrongAction.rate <= 0.015 && m.wrongAction.rate <= b.wrongAction.rate,
  },
  { id: "escalation_recall", label: "Must-escalate recall ≥ 90%", pass: (m) => m.escalationRecall.rate >= 0.9 },
  { id: "false_escalation", label: "False escalation ≤ 10%", pass: (m) => m.falseEscalation.rate <= 0.1 },
  { id: "invented_policy", label: "Invented policy ≤ 2%", pass: (m) => m.inventedPolicy.rate <= 0.02 },
  { id: "latency_p95", label: "p95 latency ≤ 30 s", pass: (m) => m.latencyP95 <= 30 },
  { id: "mean_cost", label: "Mean cost ≤ $0.05 per query", pass: (m) => m.costMean <= 0.05 },
];

export function byRun(rows: Row[]): Record<string, Row[]> {
  const out: Record<string, Row[]> = {};
  for (const r of rows) (out[r.run] ??= []).push(r);
  return out;
}
