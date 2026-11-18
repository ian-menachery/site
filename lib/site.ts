export const contact = {
  email: "ianmenachery@gmail.com",
  linkedin: "https://www.linkedin.com/in/ianmenachery",
  github: "https://github.com/ian-menachery",
  resume: "/ian-menachery-resume.pdf",
};

export type Project = {
  slug: string;
  title: string;
  kind: string;
  summary: string;
  repo?: string; // omitted for private repos
  extra?: { label: string; href: string };
  demo?: string;
};

export const projects: Project[] = [
  {
    slug: "showdown",
    title: "showdown",
    kind: "Heads-up poker lab",
    summary:
      "A CFR solver that matches OpenSpiel bit for bit on Leduc poker, an exact 169×169 preflop equity matrix, and push/fold solved at every stack depth from 1 to 20 big blinds.",
    repo: "https://github.com/ian-menachery/showdown",
    demo: "/lab/push-fold",
  },
  {
    slug: "redline",
    title: "redline",
    kind: "SEC filing monitor and valuation engine",
    summary:
      "Polls EDGAR, filters disclosure changes down to the ones worth reading, and values a company with a DCF only where free cash flow fits.",
    repo: "https://github.com/ian-menachery/redline",
    demo: "/lab/dcf",
  },
  {
    slug: "pmra",
    title: "Prediction Market Research Assistant",
    kind: "Falsification study",
    summary:
      "A harness built to test whether an LLM with web search can beat Kalshi prices after costs. It can't, and the write-up shows why.",
    repo: "https://github.com/ian-menachery/prediction-market-research-assistant",
    extra: {
      label: "Project site",
      href: "https://ian-menachery.github.io/prediction-market-research-assistant/",
    },
  },
  {
    slug: "calibration",
    title: "calibration-tracker",
    kind: "Polymarket calibration study",
    summary:
      "4,522 markets: politics carries real signal a week out (Brier 0.106), while sports barely beats chance (0.236).",
    repo: "https://github.com/ian-menachery/calibration-tracker",
    demo: "/lab/calibration",
  },
  {
    slug: "cutover",
    title: "cutover",
    kind: "Data-migration tie-out kit",
    summary:
      "Checks a new system against the legacy system it replaced, row by row, and decides whether go-live can be signed off. It found 148 of 151 defects planted blind by an agent that never saw the checks.",
    repo: "https://github.com/ian-menachery/cutover",
    demo: "/lab/cutover",
  },
  {
    slug: "deskcheck",
    title: "deskcheck",
    kind: "Helpdesk agent with an eval harness",
    summary:
      "An IT/HR helpdesk agent that only acts through validated tools. On 60 blind, messier cases a rule router took 5 wrong actions; Claude took none in 600 runs.",
    repo: "https://github.com/ian-menachery/deskcheck",
    demo: "/lab/deskcheck",
  },
  {
    slug: "rentroll",
    title: "rentroll",
    kind: "Rent roll tie-out checker",
    summary:
      "Checks that the numbers pulled from a property's rent roll and T12 actually add up, and points at the rows that don't.",
    demo: "/lab/rentroll",
  },
  {
    slug: "dealflow",
    title: "dealflow",
    kind: "Deal underwriting engine",
    summary:
      "Scores and ranks property and small-business acquisitions behind swappable data sources, within a 50-call monthly API quota.",
    demo: "/lab/dealflow",
  },
  {
    slug: "burnout",
    title: "Burnout-App",
    kind: "Burnout risk classifier",
    summary:
      "A random forest at macro F1 0.991 in 5-fold cross-validation, and an ablation showing it mostly restates self-reported stress.",
    repo: "https://github.com/ian-menachery/Burnout-App",
  },
];

export const demos = [
  { href: "/lab/push-fold", title: "Push/fold explorer", from: "showdown" },
  { href: "/lab/calibration", title: "Calibration explorer", from: "calibration-tracker" },
  { href: "/lab/dcf", title: "DCF sliders", from: "redline" },
  { href: "/lab/cutover", title: "Migration tie-out", from: "cutover" },
  { href: "/lab/deskcheck", title: "Helpdesk agent replay", from: "deskcheck" },
  { href: "/lab/rentroll", title: "Rent roll tie-out", from: "rentroll" },
  { href: "/lab/dealflow", title: "Deal calculator", from: "dealflow" },
];
