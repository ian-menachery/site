"""Export the rentroll demo's fixtures and rentroll's own check results.

Runs the real rentroll package (adapters + checks) on its three synthetic
fixture packages and writes:
  data/rentroll/fixtures.json           raw CSV tables, stated totals, expected verdicts
  data/rentroll/reference_results.json  run_checks() output per fixture, twice:
      "stated"   stated totals passed as the --stated override (the Gate 1 values)
      "detected" stated totals from deterministic detection only
  plus "edge_cases": variants of the clean package (empty rent roll, totals
  rows, missing rent, revenue-only T12, a T12 month breach) with their results.

Usage (from the site repo root, any Python with pydantic>=2.7):
  py scripts/export_rentroll_reference.py [path/to/rentroll]
The rentroll repo is only read; bytecode writing is disabled so nothing lands in it.
"""

import sys

sys.dont_write_bytecode = True

import json  # noqa: E402
import re  # noqa: E402
from pathlib import Path  # noqa: E402

SITE = Path(__file__).resolve().parents[1]
RENTROLL = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "projects" / "rentroll"
sys.path.insert(0, str(RENTROLL / "src"))

from rentroll.adapters import load_json, read_table, to_schema  # noqa: E402
from rentroll.adapters.tabular import (  # noqa: E402
    _stated_with_provenance,
    rent_roll_rows,
    t12_line_items,
)
from rentroll.checks import run_checks  # noqa: E402
from rentroll.tolerances import Tolerances  # noqa: E402

FIXTURES = RENTROLL / "tests" / "fixtures"
NAMES = ["clean", "rent_variance", "vacancy_misclass"]
RENT_ROLL_COLUMNS = [
    "unit_id", "unit_type", "square_feet", "occupancy_status", "in_place_rent",
    "market_rent", "lease_start", "lease_end", "concession_amount",
]


def report_json(deal) -> dict:
    report = run_checks(deal, Tolerances()).model_dump(mode="json")
    return {key: report[key] for key in ("checks", "stated_sources", "warnings")}


fixtures, results = {}, {}
for name in NAMES:
    directory = FIXTURES / name
    rent_roll = read_table(directory / "rent_roll.csv")
    t12 = read_table(directory / "t12.csv")
    expected = json.loads((directory / "expected.json").read_text(encoding="utf-8"))

    # Synthetic-only guard: the known 12-unit layout, made-up unit ids, no extra columns.
    assert all(list(row) == RENT_ROLL_COLUMNS for row in rent_roll), name
    assert [row["unit_id"] for row in rent_roll] == [
        f"U{floor}0{i}" for floor, count in ((1, 8), (2, 4)) for i in range(1, count + 1)
    ], name
    assert all(re.fullmatch(r"[A-Za-z &]+", row["label"]) for row in t12), name

    with_stated = load_json(json.dumps(to_schema(
        directory / "rent_roll.csv", directory / "t12.csv", stated_override=expected["stated"]
    )))
    # Same DealDocs as rentroll's own tests/test_fixtures.py loader.
    gate1 = load_json(json.dumps({
        "rent_roll": rent_roll_rows(rent_roll),
        "t12": t12_line_items(t12),
        "stated": expected["stated"],
    }))
    assert with_stated.rent_roll == gate1.rent_roll and with_stated.t12 == gate1.t12
    assert with_stated.stated == gate1.stated

    detected = load_json(json.dumps(to_schema(directory / "rent_roll.csv", directory / "t12.csv")))

    fixtures[name] = {
        "description": expected["description"],
        "rent_roll": rent_roll,
        "t12": t12,
        "stated": expected["stated"],
        "expected": expected["checks"],
        "refs_first": expected.get("refs_first", {}),
    }
    results[name] = {"stated": report_json(with_stated), "detected": report_json(detected)}

# Edge cases: variants of the clean package, run through the same parse +
# detection functions to_schema() uses, to pin the SKIP rules and provenance.
clean = fixtures["clean"]
stated = clean["stated"]


def edited(table, index, **cells):
    return [dict(row, **cells) if i == index else dict(row) for i, row in enumerate(table)]


blank_t12 = {key: "" for key in clean["t12"][0]}
edges = {
    "empty_rent_roll": ([], clean["t12"], stated),
    "totals_rows_detected": (
        clean["rent_roll"] + [dict({k: "" for k in RENT_ROLL_COLUMNS},
                                   unit_id="Total", in_place_rent="12900.00", market_rent="15600.00")],
        clean["t12"] + [dict(blank_t12, label="Net Operating Income:", stated_annual_total="89,400.00")],
        None,
    ),
    "missing_rent_and_duplicate_unit": (
        edited(clean["rent_roll"], 4, in_place_rent="") + [dict(clean["rent_roll"][10])],
        clean["t12"],
        stated,
    ),
    "revenue_only_t12": (clean["rent_roll"], clean["t12"][:3], stated),
    "t12_month_breach": (
        edited(clean["rent_roll"], 2, in_place_rent="$1,150.00"),
        edited(edited(clean["t12"], 5, month_03="1,000.00"), 1, month_01="(2,700.00)"),
        stated,
    ),
    # Exact binary ties: Python's format() rounds these half-to-even.
    "rounding_ties": (
        edited(clean["rent_roll"], 2, in_place_rent="1200.125"),
        edited(clean["t12"], 8, month_01="1201.625"),
        stated,
    ),
}
results["edge_cases"] = {}
for name, (rent_roll, t12, override) in edges.items():
    stated_values, sources = _stated_with_provenance(rent_roll, t12, override)
    deal = load_json(json.dumps({
        "rent_roll": rent_roll_rows(rent_roll),
        "t12": t12_line_items(t12),
        "stated": stated_values,
        "stated_sources": sources,
    }))
    results["edge_cases"][name] = {
        "rent_roll": rent_roll, "t12": t12, "override": override, "report": report_json(deal),
    }

out = SITE / "data" / "rentroll"
out.mkdir(parents=True, exist_ok=True)
for filename, payload in (("fixtures.json", fixtures), ("reference_results.json", results)):
    (out / filename).write_text(json.dumps(payload, indent=1) + "\n", encoding="utf-8")
    print("wrote", out / filename)
