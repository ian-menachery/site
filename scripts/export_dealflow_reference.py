"""Run dealflow's own underwriting/metrics.py on made-up deals for the calculator demo.

Every input below is invented. The composition (rent x 12, loan from the down
payment, debt service = monthly payment x 12, cash invested and project basis)
mirrors src/dealflow/underwriting/engine.py:27-58, with opex, capex reserve and
closing costs passed as annual dollar amounts, which is what metrics.py takes.

Usage (from the site repo root):
  C:/Users/ianme/projects/dealflow/.venv/Scripts/python.exe scripts/export_dealflow_reference.py [path/to/dealflow]
Writes data/dealflow/reference_cases.json. The dealflow repo is only read.
"""

import sys

sys.dont_write_bytecode = True

import importlib.util  # noqa: E402
import json  # noqa: E402
from pathlib import Path  # noqa: E402

SITE = Path(__file__).resolve().parents[1]
DEALFLOW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "projects" / "dealflow"

# Load metrics.py by path: it is pure and imports nothing else from dealflow.
spec = importlib.util.spec_from_file_location(
    "dealflow_metrics", DEALFLOW / "src" / "dealflow" / "underwriting" / "metrics.py"
)
metrics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metrics)

BASE = {
    "purchase_price": 200_000.0,
    "gross_monthly_rent": 1_800.0,
    "vacancy_rate": 0.05,
    "operating_expenses_annual": 6_000.0,
    "capex_reserve_annual": 2_000.0,
    "closing_costs": 3_000.0,
    "rehab_cost": 10_000.0,
    "down_payment_rate": 0.25,
    "interest_rate": 0.07,
    "loan_term_years": 30,
}

CASES = {
    "baseline (dealflow's worked example)": {},
    "all cash": {"down_payment_rate": 1.0},
    "zero vacancy": {"vacancy_rate": 0.0},
    "zero interest rate": {"interest_rate": 0.0},
    "high leverage (3.5% down)": {"down_payment_rate": 0.035, "interest_rate": 0.0675},
    "capex heavy (negative cash-on-cash)": {"capex_reserve_annual": 9_500.0},
    "full vacancy (negative NOI)": {"vacancy_rate": 1.0},
    "15-year term": {"loan_term_years": 15, "interest_rate": 0.0625},
    "zero-year term (no payment, DSCR none)": {"loan_term_years": 0},
    "value-add rehab": {"purchase_price": 140_000.0, "rehab_cost": 55_000.0, "gross_monthly_rent": 2_150.0},
    "high rate": {"interest_rate": 0.12},
    "fully financed, no closing or rehab (no cash in)": {
        "down_payment_rate": 0.0, "closing_costs": 0.0, "rehab_cost": 0.0,
    },
    "zero price and costs (cap rate and yield none)": {
        "purchase_price": 0.0, "closing_costs": 0.0, "rehab_cost": 0.0,
    },
    "small multifamily, odd cents": {
        "purchase_price": 1_237_500.0, "gross_monthly_rent": 11_433.33, "vacancy_rate": 0.0725,
        "operating_expenses_annual": 47_812.19, "capex_reserve_annual": 6_250.5,
        "closing_costs": 24_750.75, "rehab_cost": 18_300.0, "down_payment_rate": 0.3,
        "interest_rate": 0.0689, "loan_term_years": 25,
    },
}


def underwrite(i: dict) -> dict:
    gross_annual_rent = i["gross_monthly_rent"] * 12
    down_payment = i["purchase_price"] * i["down_payment_rate"]
    loan_amount = i["purchase_price"] - down_payment
    monthly_payment = metrics.mortgage_payment(loan_amount, i["interest_rate"], i["loan_term_years"])
    annual_debt_service = monthly_payment * 12
    total_cash_invested = down_payment + i["closing_costs"] + i["rehab_cost"]
    total_project_basis = i["purchase_price"] + i["closing_costs"] + i["rehab_cost"]

    noi = metrics.net_operating_income(
        gross_annual_rent, i["vacancy_rate"], i["operating_expenses_annual"]
    )
    owner_earnings = metrics.owner_earnings(noi, i["capex_reserve_annual"])
    return {
        "gross_annual_rent": gross_annual_rent,
        "down_payment": down_payment,
        "loan_amount": loan_amount,
        "monthly_payment": monthly_payment,
        "annual_debt_service": annual_debt_service,
        "total_cash_invested": total_cash_invested,
        "total_project_basis": total_project_basis,
        "noi": noi,
        "cap_rate": metrics.cap_rate(noi, i["purchase_price"]),
        "annual_cash_flow": metrics.annual_cash_flow(noi, annual_debt_service),
        "cash_on_cash": metrics.cash_on_cash(
            noi, annual_debt_service, i["capex_reserve_annual"], total_cash_invested
        ),
        "dscr": metrics.dscr(noi, annual_debt_service),
        "owner_earnings": owner_earnings,
        "owner_earnings_yield": metrics.owner_earnings_yield(owner_earnings, total_project_basis),
    }


cases = []
for name, changes in CASES.items():
    inputs = {**BASE, **changes}
    cases.append({"name": name, "inputs": inputs, "outputs": underwrite(inputs)})

out = SITE / "data" / "dealflow" / "reference_cases.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"defaults": BASE, "cases": cases}, indent=1) + "\n", encoding="utf-8")
print("wrote", out, len(cases), "cases")
