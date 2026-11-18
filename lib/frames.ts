// The home page's contact sheet: one frame per checked claim, with figures
// reduced from each project's own exported data. Every number is from the
// case studies or the data files; nothing here is computed fresh.
import pushfold from "@/data/pushfold/pushfold.json";
import buckets from "@/data/calibration/buckets.json";
import metrics from "@/data/calibration/metrics.json";
import dcf from "@/data/dcf/companies.json";
import { CLASS_NAMES } from "@/lib/pushfold";
import type { Verdict } from "@/components/strip/marks";

export type Fig =
  | { kind: "stat"; big: string; lines: string[] }
  | { kind: "list"; head: string; items: string[] }
  | {
      kind: "calibration";
      series: { label: string; brier: string; shape: "dot" | "square"; points: [number, number][] }[];
    }
  | { kind: "ranges"; rows: { label: string; bear: number; base: number; bull: number }[] }
  | { kind: "grid"; values: number[]; names: string[]; depth: number }
  | { kind: "dots"; total: number; found: number }
  | { kind: "tally"; passed: number; total: number; bar: number };

export type Frame = {
  title: string;
  fig: Fig;
  verdict: Verdict;
  caption: string;
  href?: string;
};

export type Chapter = {
  tag: string;
  title: string;
  body: string;
  count: number;
};

function series(category: "politics" | "sports", shape: "dot" | "square") {
  const s = buckets.byCategory["7d"][category];
  const points: [number, number][] = [];
  s.meanPredicted.forEach((p, i) => {
    const r = s.realizedRate[i];
    if (p !== null && r !== null) points.push([+p.toFixed(3), +r.toFixed(3)]);
  });
  const row = metrics.rows.find((m) => m.subgroup === `category=${category}` && m.snapshotType === "7d")!;
  const label = category[0].toUpperCase() + category.slice(1);
  return { label, brier: row.brierScore.toFixed(3), shape, points };
}

const depth = 10;
const jam = pushfold.depths[depth - 1];
const [ulta, vrtx] = ["ULTA", "VRTX"].map((t) => {
  const c = dcf.companies.find((x) => x.ticker === t)!;
  return {
    label: t,
    bear: Math.round(c.stored.perShareBear),
    base: Math.round(c.stored.perShareBase),
    bull: Math.round(c.stored.perShareBull),
  };
});

export const chapters: Chapter[] = [
  {
    tag: "Sun Life ▸ Reporting analyst co-op ▸ Jul 2025 – Jan 2026",
    title: "Numbers people rely on",
    body: "As a reporting analyst co-op at Sun Life, I fixed figures senior stakeholders relied on: duplicate Hinge Health enrollments, overcounted sales rep prospects, and quarter-to-date goals calculated on month-end instead of quarter-end dates. I automated cross-sell reporting with a 1,000-line SQL query, saving the product team an estimated 5–10 hours a quarter, and replaced a manual VBA QA task with an unattended monthly SQL job.",
    count: 3,
  },
  {
    tag: "EY ▸ Technology consulting intern ▸ Jun – Aug 2026",
    title: "AI that behaves",
    body: "As a technology consulting intern at EY, I built two Copilot Studio agents that gave an SAP S/4HANA implementation team self-serve staffing and task lookups, routed through deterministic Power Automate flows instead of free-form LLM output. I replaced manual onboarding, offboarding and access requests with flows, and an audit of role-to-course mappings for a 17,300-employee client caught 20 unassigned courses that would have left roles untrained at go-live. I presented the agent framework to an 80-person engagement and wrote its handoff documentation.",
    count: 3,
  },
  {
    tag: "Personal projects ▸ Claims, tested",
    title: "Claims, tested",
    body: "On my own time I take a claim and try to break it. Can an LLM with web search beat prediction-market prices? Not after costs. Are those prices calibrated? A week out, politics yes and sports barely. What is a company worth from its filings? A DCF answers only where free cash flow fits. Can I solve a poker game exactly? Bit for bit against DeepMind’s OpenSpiel, and 40 of 40 pre-registered checks against a published equilibrium.",
    count: 6,
  },
];

export const frames: Frame[] = [
  {
    title: "Sun Life · Reporting",
    fig: {
      kind: "list",
      head: "3 figures fixed",
      items: ["Duplicate Hinge Health enrollments", "Overcounted sales rep prospects", "QTD goals on month-end dates"],
    },
    verdict: "keep",
    caption:
      "Sun Life: fixed figures senior stakeholders relied on: duplicate enrollments, overcounted prospects, and QTD goals on month-end dates.",
  },
  {
    title: "Sun Life · Cross-sell reporting",
    fig: { kind: "stat", big: "5–10 h", lines: ["a quarter, estimated, saved by", "one 1,000-line SQL query"] },
    verdict: "keep",
    caption: "Sun Life: automated cross-sell reporting with a 1,000-line SQL query, an estimated 5–10 hours saved a quarter.",
  },
  {
    title: "Sun Life · Monthly QA",
    fig: { kind: "stat", big: "VBA → SQL", lines: ["a manual QA task, now an", "unattended monthly SQL job"] },
    verdict: "keep",
    caption: "Sun Life: replaced a manual VBA QA task with an unattended monthly SQL job.",
  },
  {
    title: "EY · Copilot Studio",
    fig: { kind: "stat", big: "2 agents", lines: ["routed through deterministic", "Power Automate flows"] },
    verdict: "keep",
    caption:
      "EY: two Copilot Studio agents for self-serve staffing and task lookups, routed through deterministic Power Automate flows.",
  },
  {
    title: "EY · Role-to-course audit",
    fig: { kind: "stat", big: "20", lines: ["unassigned courses caught before", "go-live, 17,300-employee client"] },
    verdict: "keep",
    caption: "EY: a role-to-course audit caught 20 unassigned courses before go-live for a 17,300-employee client.",
  },
  {
    title: "EY · Handoff",
    fig: { kind: "stat", big: "80", lines: ["people at the engagement where I", "presented the agent framework"] },
    verdict: "keep",
    caption: "EY: presented the agent framework to an 80-person engagement and wrote its handoff documentation.",
  },
  {
    title: "PMRA · LLM vs Kalshi, after costs",
    fig: { kind: "stat", big: "No edge", lines: ["1 of 13 paper trades right on", "direction; net paper loss $586.82"] },
    verdict: "cross",
    caption:
      "PMRA: an LLM with web search did not beat Kalshi prices after costs; 1 of 13 settled paper trades got the direction right.",
    href: "/work/pmra",
  },
  {
    title: "Polymarket · 7 days out",
    fig: { kind: "calibration", series: [series("politics", "dot"), series("sports", "square")] },
    verdict: "keep",
    caption:
      "calibration-tracker: a week before resolution, politics carries real signal (Brier 0.106) while sports barely beats chance (0.236).",
    href: "/work/calibration",
  },
  {
    title: "redline · DCF per share, bear to bull",
    fig: { kind: "ranges", rows: [ulta, vrtx] },
    verdict: "keep",
    caption: `redline: DCF value per share, bear to bull, only where free cash flow fits. ULTA $${ulta.bear} to $${ulta.bull}; VRTX $${vrtx.bear} to $${vrtx.bull}.`,
    href: "/work/redline",
  },
  {
    title: `showdown · Push/fold at ${depth} bb`,
    fig: {
      kind: "grid",
      values: jam.push.map((v) => Math.round(v * 100) / 100),
      names: CLASS_NAMES,
      depth,
    },
    verdict: "keep",
    caption:
      "showdown: the small blind’s jam chart at 10 big blinds. The solver matches OpenSpiel bit for bit; 40 of 40 pre-registered checks pass.",
    href: "/work/showdown",
  },
  {
    title: "showdown · Exploit gate",
    fig: { kind: "tally", passed: 3, total: 10, bar: 8 },
    verdict: "cross",
    caption: "showdown: an exploit test passed on 3 of 10 flops against a bar of 8, so that claim stays unvalidated.",
    href: "/work/showdown",
  },
  {
    title: "cutover · Blind defect test",
    fig: { kind: "dots", total: 151, found: 148 },
    verdict: "keep",
    caption: "cutover: found 148 of 151 defects planted blind by an agent that never saw the checks.",
    href: "/work/cutover",
  },
];
