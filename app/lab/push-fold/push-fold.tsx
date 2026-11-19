"use client";

import { useState } from "react";
import {
  CLASS_NAMES,
  MISTAKE_BB,
  grade,
  type Action,
  type Position,
  type PushFoldData,
} from "@/lib/pushfold";
import EvGrid from "@/components/ev-grid";

const bb = (x: number) => `${x < 0 ? "−" : "+"}${Math.abs(x).toFixed(3)} bb`;
const pct = (p: number) => `${Math.round(p * 1000) / 10}%`;
const verb = (position: Position) => (position === "sb" ? "jam" : "call");

export default function PushFold({ data }: { data: PushFoldData }) {
  return (
    <>
      <Chart data={data} />
      <Trainer data={data} />
    </>
  );
}

function Chart({ data }: { data: PushFoldData }) {
  return (
    <section aria-labelledby="chart-heading">
      <h2 id="chart-heading">EV chart</h2>
      <p>
        Each cell is the EV of going all in with that hand, in big blinds, at
        the equilibrium. Shaded cells beat folding (−0.5 bb for the small blind,
        −1 bb for the big blind). Suited hands sit above the diagonal, offsuit
        below, pairs on it. Select a cell for details; exploitability is the
        most a perfect opponent could win against this pair of strategies.
      </p>
      <EvGrid data={data} exploitability />
    </section>
  );
}

type Deal = { depth: number; position: Position; hand: string };
type Result = ReturnType<typeof grade> & { action: Action };

function Trainer({ data }: { data: PushFoldData }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [total, setTotal] = useState({ hands: 0, bbLost: 0, mistakes: 0 });

  function dealHand() {
    setDeal({
      depth: 1 + Math.floor(Math.random() * 20),
      position: Math.random() < 0.5 ? "sb" : "bb",
      hand: CLASS_NAMES[Math.floor(Math.random() * CLASS_NAMES.length)],
    });
    setResult(null);
  }

  function answer(action: Action) {
    if (!deal || result) return;
    const graded = grade(data, deal.depth, deal.position, deal.hand, action);
    setResult({ ...graded, action });
    setTotal((t) => ({
      hands: t.hands + 1,
      bbLost: t.bbLost + graded.bbLost,
      mistakes: t.mistakes + (graded.mistake ? 1 : 0),
    }));
  }

  return (
    <section aria-labelledby="trainer-heading">
      <h2 id="trainer-heading">Trainer</h2>
      {deal && (
        <>
          <p>
            You are in the {deal.position === "sb" ? "small" : "big"} blind with{" "}
            <strong>{deal.hand}</strong>, {deal.depth} bb effective.{" "}
            {deal.position === "sb"
              ? "Jam or fold?"
              : "The small blind has gone all in. Call or fold?"}
          </p>
          <p className="flex gap-4">
            <button type="button" disabled={!!result} onClick={() => answer("allin")}>
              {deal.position === "sb" ? "Jam" : "Call"}
            </button>
            <button type="button" disabled={!!result} onClick={() => answer("fold")}>
              Fold
            </button>
          </p>
        </>
      )}
      <div aria-live="polite">
        {deal && result && (
          <p>
            {result.mistake ? "Mistake" : "Fine"}: you{" "}
            {result.action === "fold"
              ? "folded"
              : deal.position === "sb"
                ? "jammed"
                : "called"}{" "}
            and
            lost {result.bbLost.toFixed(4)} bb against the better play. Equilibrium:{" "}
            {verb(deal.position)} {pct(result.freq)} of the time. EV of{" "}
            {deal.position === "sb" ? "jamming" : "calling"} {bb(result.evs.allin)};
            EV of folding {bb(result.evs.fold)}.
          </p>
        )}
      </div>
      <p>
        <button type="button" onClick={dealHand}>
          {deal ? "Next hand" : "Deal a hand"}
        </button>
      </p>
      <p>
        Hands: {total.hands}. Total lost: {total.bbLost.toFixed(3)} bb. Mistakes
        (over {MISTAKE_BB} bb): {total.mistakes}.
      </p>
    </section>
  );
}
