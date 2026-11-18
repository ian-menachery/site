"use client";

import { useState } from "react";
import {
  CLASS_NAMES,
  MISTAKE_BB,
  atDepth,
  equilibrium,
  grade,
  type Action,
  type Position,
  type PushFoldData,
} from "@/lib/pushfold";

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
  const [depth, setDepth] = useState(10);
  const [position, setPosition] = useState<Position>("sb");
  const [hand, setHand] = useState("AA");
  const selected = grade(data, depth, position, hand, "allin");

  return (
    <section aria-labelledby="chart-heading">
      <h2 id="chart-heading">Equilibrium chart</h2>
      <p>
        <label>
          Effective stack: {depth} bb{" "}
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </label>
      </p>
      <fieldset>
        <legend>Show</legend>
        {(["sb", "bb"] as const).map((p) => (
          <label key={p} className="mr-4">
            <input
              type="radio"
              name="position"
              checked={position === p}
              onChange={() => setPosition(p)}
            />{" "}
            {p === "sb" ? "Small blind: jam" : "Big blind: call a jam"}
          </label>
        ))}
      </fieldset>
      <p>
        Exploitability at {depth} bb:{" "}
        {atDepth(data, depth).exploitability.toFixed(7)} bb per hand (the most a
        perfect opponent could win against this pair of strategies).
      </p>
      <p>
        Each cell is a percentage. Suited hands sit above the diagonal, offsuit
        below, pairs on it. Select a cell for its EVs.
      </p>
      <div className="overflow-x-auto">
        <div
          role="group"
          aria-label={`How often each hand should ${verb(position)} at ${depth} bb`}
          className="grid min-w-[30rem] grid-cols-[repeat(13,minmax(0,1fr))] gap-px text-xs"
        >
          {CLASS_NAMES.map((name) => {
            const { freq } = equilibrium(data, depth, position, name);
            const whole = Math.round(freq * 100);
            return (
              <button
                key={name}
                type="button"
                aria-label={`${name} ${whole}: ${verb(position)} ${pct(freq)}`}
                aria-pressed={name === hand}
                onClick={() => setHand(name)}
                className="cell flex flex-col items-center py-1"
                style={{ backgroundColor: `color-mix(in oklab, var(--heat) ${Math.round(freq * 100)}%, var(--ground-2))` }}
              >
                <span>{name}</span>
                <span>{whole}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p aria-live="polite">
        {hand} at {depth} bb: the {position === "sb" ? "small" : "big"} blind{" "}
        {position === "sb" ? "jams" : "calls a jam"} {pct(selected.freq)} of the
        time. EV of {position === "sb" ? "jamming" : "calling"}{" "}
        {bb(selected.evs.allin)}; EV of folding {bb(selected.evs.fold)}.
      </p>
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
