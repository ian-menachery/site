"""Export the calibration explorer data from calibration-tracker, using its own analysis code.

Writes to data/calibration/:
  buckets.json  overall decile buckets (market-weighted, copied from reports/calibration_buckets.csv)
                and per-category x snapshot decile buckets recomputed from data/markets.db with the
                repo's load_calibration_frame + bucket (95% bootstrap CI, 1000 resamples,
                numpy default_rng(42) per slice; cli.py analyze defaults)
  metrics.json  every row of reports/calibration_metrics.csv
  source/       byte-identical copies of the two CSVs, so lib/calibration.test.ts can check them

Run from the site repo with calibration-tracker's interpreter (-B: no .pyc in the source repo):
  C:/Users/ianme/projects/calibration-tracker/.venv/Scripts/python.exe -B scripts/export_calibration.py

Reads the source repo read-only (markets.db opened mode=ro). Polymarket only: the CSVs predate the
Kalshi rows now in the DB. Aggregates only, no per-market rows.
"""
import csv, json, shutil, sqlite3, sys
from pathlib import Path

import numpy as np
import pandas as pd

CT = Path("C:/Users/ianme/projects/calibration-tracker")
OUT = Path(__file__).resolve().parent.parent / "data" / "calibration"
sys.path.insert(0, str(CT / "src"))

from calibration.analysis.calibration import (  # noqa: E402
    bucket_5pct, bucket_decile, compute_metrics, load_calibration_frame,
)

SNAPSHOTS = ("close", "1h", "24h", "7d")  # cli.py SNAPSHOT_TYPES
SEED, N_ITER = 42, 1000  # cli.py analyze defaults
COLS = ("n_markets", "mean_predicted", "realized_rate", "ci_lo", "ci_hi")
KEYS = ("n", "meanPredicted", "realizedRate", "ciLo", "ciHi")


def read_csv(name):
    with open(CT / "reports" / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(s):
    return None if s == "" else float(s)


def series(rows):
    """Bucket rows -> {n: [...], meanPredicted: [...], ...}; NaN -> null."""
    out = {k: [] for k in KEYS}
    for r in rows:
        for k, c in zip(KEYS, COLS):
            v = r[c]
            v = num(v) if isinstance(v, str) else (None if pd.isna(v) else float(v))
            out[k].append(int(v) if k == "n" else v)
    return out


bucket_csv, metrics_csv = read_csv("calibration_buckets.csv"), read_csv("calibration_metrics.csv")
conn = sqlite3.connect(f"file:{(CT / 'data/markets.db').as_posix()}?mode=ro", uri=True)
frames = {s: load_calibration_frame(conn, s, venue="polymarket") for s in SNAPSHOTS}

# 1. Replay cli.py cmd_analyze (one shared rng, same call order) and require it to reproduce both
#    CSVs exactly, so the per-category numbers below come from the same data and method.
rng = np.random.default_rng(SEED)
replay_b, replay_m = [], []
for snap in SNAPSHOTS:
    df = frames[snap].copy()
    df["volume_quartile"] = pd.qcut(df["volume"], q=4, labels=["q1", "q2", "q3", "q4"], duplicates="drop")
    for label, fn in [("decile", bucket_decile), ("pct5", bucket_5pct)]:
        for weighting, wc in [("market", None), ("volume", "volume")]:
            b = fn(df, n_iter=N_ITER, rng=rng, weight_col=wc)
            replay_b += [dict(r, snapshot_type=snap, bucketing=label, weighting=weighting)
                         for r in b.to_dict("records")]
    for m in (compute_metrics(df), compute_metrics(df, "category"), compute_metrics(df, "volume_quartile")):
        replay_m += [dict(r, snapshot_type=snap) for r in m.to_dict("records")]
    bucket_decile(df, n_iter=N_ITER, rng=rng)  # cmd_analyze's chart call also draws from the rng

assert len(replay_b) == len(bucket_csv) and len(replay_m) == len(metrics_csv)
for got, want in zip(replay_b, bucket_csv):
    for c in want:
        g = got[c]
        ok = (g == want[c]) if isinstance(g, str) else (
            want[c] == "" if pd.isna(g) else float(g) == float(want[c]))
        assert ok, (c, got, want)
for got, want in zip(replay_m, metrics_csv):
    assert got["subgroup"] == want["subgroup"] and got["snapshot_type"] == want["snapshot_type"]
    assert got["n_markets"] == int(want["n_markets"]), (got, want)
    assert got["brier_score"] == float(want["brier_score"]) and got["log_loss"] == float(want["log_loss"])

# 2. Overall rows copied from the CSV; per-category rows recomputed with the repo's bucket().
decile_rows = [r for r in bucket_csv if r["bucketing"] == "decile" and r["weighting"] == "market"]
edges = [float(r["bucket_lo"]) for r in decile_rows[:10]] + [float(decile_rows[9]["bucket_hi"])]
categories = sorted(set().union(*(f["category"] for f in frames.values())))
overall, by_category = {}, {}
for snap in SNAPSHOTS:
    rows = [r for r in decile_rows if r["snapshot_type"] == snap]
    assert [float(r["bucket_lo"]) for r in rows] == edges[:-1]
    overall[snap] = series(rows)
    df = frames[snap]
    by_category[snap] = {
        cat: series(bucket_decile(df[df["category"] == cat], n_iter=N_ITER,
                                  rng=np.random.default_rng(SEED)).to_dict("records"))
        for cat in categories
    }

end = pd.to_datetime(frames["close"]["end_date"], utc=True, format="ISO8601")
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "source").mkdir(exist_ok=True)
for name in ("calibration_buckets.csv", "calibration_metrics.csv"):
    shutil.copyfile(CT / "reports" / name, OUT / "source" / name)
compact = {"separators": (",", ":")}
(OUT / "buckets.json").write_text(json.dumps({
    "source": "calibration-tracker: overall rows from reports/calibration_buckets.csv (decile, market-weighted); "
              "byCategory recomputed from data/markets.db (Polymarket) with load_calibration_frame + bucket_decile, "
              f"95% bootstrap CI, {N_ITER} resamples, numpy default_rng({SEED}) per slice",
    "resolvedFrom": end.min().date().isoformat(), "resolvedTo": end.max().date().isoformat(),
    "snapshots": list(SNAPSHOTS), "categories": categories, "edges": edges,
    "overall": overall, "byCategory": by_category,
}, **compact) + "\n", encoding="utf-8")
(OUT / "metrics.json").write_text(json.dumps({
    "source": "calibration-tracker reports/calibration_metrics.csv",
    "rows": [{"subgroup": r["subgroup"], "nMarkets": int(r["n_markets"]), "brierScore": float(r["brier_score"]),
              "logLoss": float(r["log_loss"]), "snapshotType": r["snapshot_type"]} for r in metrics_csv],
}, **compact) + "\n", encoding="utf-8")
print(f"replay matched {len(replay_b)} bucket rows and {len(replay_m)} metric rows; "
      f"{len(categories)} categories x {len(SNAPSHOTS)} snapshots -> {OUT}")
