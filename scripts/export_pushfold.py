"""Export showdown's push/fold solution for the site's /lab/push-fold demo.

Run from the site repo root with showdown's own interpreter:

    C:/Users/ianme/projects/showdown/.venv/Scripts/python.exe scripts/export_pushfold.py

Writes two files into data/pushfold/:
- pushfold.json: per depth (1 to 20 bb) the solved jam and call probabilities and
  the EV of every action for every class, so the site only looks values up and
  subtracts (showdown DECISIONS 12: no game logic in JavaScript).
- reference_cases.json: decisions graded by showdown's own code (policy.py,
  grade.py), which lib/pushfold.test.ts must reproduce within 1e-6.

showdown is read-only from here: this script only reads its data files.
"""

from __future__ import annotations

import sys

sys.dont_write_bytecode = True  # leave no __pycache__ inside the showdown repo

import hashlib  # noqa: E402
import json  # noqa: E402
from pathlib import Path  # noqa: E402

import numpy as np  # noqa: E402
import showdown  # noqa: E402
from showdown import pushfold  # noqa: E402
from showdown.bot.policy import MISTAKE_BB, PushFoldStrategy  # noqa: E402
from showdown.equity.cards import CLASS_NAMES, class_index  # noqa: E402
from showdown.equity.matrix import PreflopMatrix  # noqa: E402
from showdown.games.pushfold import BB_FOLD, SB_FOLD  # noqa: E402
from showdown.hh.grade import depth_for  # noqa: E402

SHOWDOWN = Path(showdown.__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parents[1] / "data" / "pushfold"
DECIMALS = 6
EDGE_HANDS = ("AA", "K9s", "T8o", "72o")
"""Hands graded at depths 1 and 20, both seats and both actions."""
EFFECTIVE_STACKS = (0.3, 1.0, 1.49, 1.5, 7.5, 8.49, 12.5, 19.5, 20.0, 20.4)


def rounded(values: np.ndarray) -> list[float]:
    return [round(float(v), DECIMALS) for v in values]


def nash_label(prob: float) -> str:
    return {1: "allin", 0: "fold", -1: "mixed"}[int(pushfold.classify(np.array([prob]))[0])]


def main() -> None:
    solution = pushfold.PushFoldSolution.load(SHOWDOWN / pushfold.DEFAULT_SOLUTION)
    matrix_path = SHOWDOWN / solution.matrix_path
    npz_sha256 = hashlib.sha256(matrix_path.read_bytes()).hexdigest()
    if npz_sha256 != solution.matrix_sha256:
        raise SystemExit(f"{matrix_path} does not match the solution's matrix_sha256")
    with np.load(matrix_path) as npz:
        npz_class_names = [str(n) for n in npz["class_names"]]
    strategy = PushFoldStrategy(solution, PreflopMatrix.load(matrix_path))

    depths = []
    for depth in pushfold.DEPTHS:
        result = solution.at(depth)
        # The same calls PushFoldStrategy makes when it grades (policy.py).
        sb_fold, sb_jam = pushfold.sb_action_values(result.call, depth, strategy.matrix)
        bb_fold, bb_call = pushfold.bb_action_values(result.push, depth, strategy.matrix)
        assert (sb_fold == SB_FOLD).all() and (bb_fold == -BB_FOLD).all()
        assert np.isfinite(sb_jam).all() and np.isfinite(bb_call).all()
        entry = {
            "stack": depth,
            "exploitability": float(result.exploitability),
            "push": rounded(result.push),
            "call": rounded(result.call),
            "sb_jam_ev": rounded(sb_jam),
            "bb_call_ev": rounded(bb_call),
        }
        check_rounding(strategy, depth, entry)
        depths.append(entry)

    export = {
        "source": "showdown data/pushfold.json",
        "algorithm": "cfr+",
        "iterations": solution.iterations,
        "matrix_sha256": solution.matrix_sha256,
        "sb_fold_ev": SB_FOLD,
        "bb_fold_ev": -BB_FOLD,
        "classes": list(CLASS_NAMES),
        "depths": depths,
    }
    reference = {
        "mistake_bb": MISTAKE_BB,
        "pure": pushfold.PURE,
        "npz_sha256": npz_sha256,
        "npz_class_names": npz_class_names,
        "depth_cases": [{"effective": e, "depth": depth_for(e)} for e in EFFECTIVE_STACKS],
        "cases": reference_cases(strategy),
    }
    OUT.mkdir(parents=True, exist_ok=True)
    for name, payload in (("pushfold.json", export), ("reference_cases.json", reference)):
        path = OUT / name
        text = json.dumps(payload, separators=(",", ":"))
        path.write_text(text + "\n", encoding="utf-8", newline="\n")
        print(f"wrote {path} ({path.stat().st_size:,} bytes)")


def check_rounding(strategy: PushFoldStrategy, depth: int, entry: dict) -> None:
    """Fail if rounding changes a pure/mixed label, a loss by 1e-6 or a mistake flag."""
    for seat, probs, ev, fold in (
        ("sb", "push", "sb_jam_ev", SB_FOLD),
        ("bb", "call", "bb_call_ev", -BB_FOLD),
    ):
        raw = getattr(strategy.solution.at(depth), probs)
        same = pushfold.classify(raw) == pushfold.classify(np.array(entry[probs]))
        assert same.all(), f"rounding changes a pure/mixed label at {depth} bb ({seat})"
        for cls in range(169):
            go = entry[ev][cls]
            for allin in (False, True):
                grade = strategy.grade(depth, seat, cls, allin)
                loss = max(fold, go) - (go if allin else fold)
                assert abs(loss - grade.loss) <= 1e-6, (depth, seat, cls, allin)
                assert (loss > MISTAKE_BB) == grade.mistake, (depth, seat, cls, allin)


def reference_cases(strategy: PushFoldStrategy) -> list[dict]:
    """Every mixed class at every depth, plus EDGE_HANDS at 1 and 20 bb; both actions."""
    picks: list[tuple[int, str, int]] = []
    for depth in pushfold.DEPTHS:
        result = strategy.solution.at(depth)
        for seat, probs in (("sb", result.push), ("bb", result.call)):
            if depth in (1, 20):
                picks += [(depth, seat, class_index(h)) for h in EDGE_HANDS]
            mixed = np.flatnonzero(pushfold.classify(probs) == -1)
            picks += [(depth, seat, int(cls)) for cls in mixed]
    cases = []
    for depth, seat, cls in picks:
        for allin in (False, True):
            grade = strategy.grade(depth, seat, cls, allin)
            cases.append(
                {
                    "depth": depth,
                    "position": seat,
                    "hand": CLASS_NAMES[cls],
                    "action": "allin" if allin else "fold",
                    "bb_lost": grade.loss,
                    "mistake": grade.mistake,
                    "freq": grade.nash_allin,
                    "nash": nash_label(grade.nash_allin),
                    "ev_fold": grade.ev_fold,
                    "ev_allin": grade.ev_allin,
                }
            )
    return cases


if __name__ == "__main__":
    main()
