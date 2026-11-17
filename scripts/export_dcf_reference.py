"""Export the DCF demo data from redline, using redline's own valuation code.

Writes data/dcf/companies.json (ULTA and VRTX inputs plus the stored bear/base/bull
results) and data/dcf/reference_cases.json (redline's dcf.py/models.py run on
perturbed inputs; lib/dcf.test.ts must match every case).

Run from the site repo with redline's interpreter:
  C:/Users/ianme/projects/redline/.venv/Scripts/python.exe scripts/export_dcf_reference.py

Reads redline read-only: data/valuation_demo.db (mode=ro), config/valuation/assumptions.yaml,
config/settings.toml. Only ULTA and VRTX are exported; no reference prices.
"""
import json, math, sqlite3, sys, tomllib
from pathlib import Path

REDLINE = Path("C:/Users/ianme/projects/redline")
OUT = Path(__file__).resolve().parent.parent / "data" / "dcf"
sys.path.insert(0, str(REDLINE / "src"))

from redline.valuation.dcf import value_dcf  # noqa: E402
from redline.valuation.models import XbrlBase, load_assumptions, to_dcf_inputs  # noqa: E402

COMPANIES = {"ULTA": 21, "VRTX": 22}  # ticker -> dcf_valuations.id
SCENARIOS = ("bear", "base", "bull")

settings = tomllib.loads((REDLINE / "config/settings.toml").read_text(encoding="utf-8"))["valuation"]
HORIZON, TG_DEFAULT = settings["projection_years"], settings["terminal_growth_default"]
assumptions = load_assumptions(REDLINE / "config/valuation/assumptions.yaml")
db = sqlite3.connect(f"file:{(REDLINE / 'data/valuation_demo.db').as_posix()}?mode=ro", uri=True)


def band(base, a):
    return {s: value_dcf(to_dcf_inputs(base, a, scenario=s, projection_years=HORIZON,
                                       terminal_growth_default=TG_DEFAULT)) for s in SCENARIOS}


def close(x, y):
    return math.isclose(x, y, rel_tol=1e-12)


companies, cases = [], []
for ticker, vid in COMPANIES.items():
    cik, valued_at, snap, bear, base_ps, bull = db.execute(
        "SELECT cik, valued_at, assumptions_json, per_share_bear, per_share_base, per_share_bull "
        "FROM dcf_valuations WHERE id = ?", (vid,)).fetchone()
    snap = json.loads(snap)
    a = assumptions[ticker]
    assert a.cik == cik
    # The YAML must still say what the stored valuation used.
    assert (a.wacc, a.terminal_growth, a.tax_rate, a.revenue_growth, a.operating_margin) == (
        snap["wacc"], snap["terminal_growth"], snap["tax_rate"], snap["revenue_growth"],
        snap["operating_margin"]), ticker
    xb = XbrlBase(cik=cik, ticker=ticker, fiscal_year=snap["fiscal_year"], base_revenue=snap["base_revenue"],
                  net_debt=snap["net_debt"], shares_diluted=snap["shares_diluted"], as_of=valued_at)
    stored = snap["base_result"]
    r = band(xb, a)
    assert close(r["bear"].per_share, bear) and close(r["base"].per_share, base_ps)
    assert close(r["bull"].per_share, bull) and close(r["base"].enterprise_value, stored["enterprise_value"])
    assert close(r["base"].terminal_value_fraction, stored["terminal_value_fraction"])

    companies.append({
        "ticker": ticker, "name": a.name, "valuationId": vid, "valuedAt": valued_at,
        "fiscalYear": snap["fiscal_year"],
        "assumptions": {
            "baseRevenue": xb.base_revenue, "netDebt": xb.net_debt, "sharesDiluted": xb.shares_diluted,
            "taxRate": a.tax_rate, "wacc": a.wacc, "terminalGrowth": a.terminal_growth,
            "revenueGrowth": a.revenue_growth, "operatingMargin": a.operating_margin,
            "capexPctRevenue": a.capex_pct_revenue, "daPctRevenue": a.da_pct_revenue,
            "nwcPctRevenue": a.nwc_pct_revenue,
            "bear": {"growthDelta": a.bear.growth_delta, "marginDelta": a.bear.margin_delta},
            "bull": {"growthDelta": a.bull.growth_delta, "marginDelta": a.bull.margin_delta},
        },
        "stored": {"perShareBear": bear, "perShareBase": base_ps, "perShareBull": bull,
                   "enterpriseValue": stored["enterprise_value"],
                   "terminalValueFraction": stored["terminal_value_fraction"]},
    })

    w, tg, m = a.wacc, a.terminal_growth, a.operating_margin
    perturbations = [
        {}, {"wacc": w - 0.02}, {"wacc": w + 0.02}, {"terminalGrowth": 0.0}, {"terminalGrowth": 0.04},
        {"growthShift": -0.05}, {"growthShift": 0.04}, {"growthShift": -0.12},
        {"operatingMargin": 0.05}, {"operatingMargin": 0.45},
        {"wacc": w + 0.01, "terminalGrowth": 0.03, "growthShift": -0.02, "operatingMargin": m + 0.03},
        {"wacc": w - 0.015, "terminalGrowth": 0.015, "growthShift": 0.06, "operatingMargin": m - 0.04},
        {"wacc": 0.051, "terminalGrowth": 0.05},
        {"wacc": 0.04, "terminalGrowth": 0.04},  # g_T == wacc: redline raises
        {"wacc": 0.04, "terminalGrowth": 0.045, "growthShift": 0.02},  # g_T > wacc
    ]
    for o in perturbations:
        shifted = a.model_copy(update={
            "wacc": o.get("wacc", w), "terminal_growth": o.get("terminalGrowth", tg),
            "revenue_growth": [g + o.get("growthShift", 0.0) for g in a.revenue_growth],
            "operating_margin": o.get("operatingMargin", m),
        })
        case = {"ticker": ticker, "overrides": o}
        try:
            case["expected"] = {s: {"perShare": v.per_share, "enterpriseValue": v.enterprise_value,
                                    "equityValue": v.equity_value,
                                    "terminalValueFraction": v.terminal_value_fraction}
                                for s, v in band(xb, shifted).items()}
        except ValueError as e:
            assert "terminal_growth must be strictly less than wacc" in str(e), e
            case["error"] = "terminal_growth >= wacc"
        cases.append(case)

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "companies.json").write_text(json.dumps(
    {"source": "redline data/valuation_demo.db dcf_valuations (ids 21, 22) + config/valuation/assumptions.yaml",
     "horizon": HORIZON, "companies": companies}, indent=2) + "\n", encoding="utf-8")
(OUT / "reference_cases.json").write_text(json.dumps(
    {"source": "redline.valuation.models.to_dcf_inputs + redline.valuation.dcf.value_dcf, "
               "via scripts/export_dcf_reference.py", "horizon": HORIZON, "cases": cases},
    indent=1) + "\n", encoding="utf-8")
print(f"{len(companies)} companies, {len(cases)} cases "
      f"({sum('error' in c for c in cases)} error) -> {OUT}")
