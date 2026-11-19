"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { CLASS_NAMES, atDepth, foldEv, type Position, type PushFoldData } from "@/lib/pushfold";

// The all-in EV of every hand, looked up from showdown's export. The only arithmetic
// is EV minus the fold EV, to shade the hands where going all in beats folding.

// Rounds first, so a value that rounds to zero prints as "0.0", never "−0.0".
const sign = (x: number, digits: number) => {
  const r = Number(x.toFixed(digits));
  return r === 0 ? r.toFixed(digits).replace("-", "") : `${r < 0 ? "−" : "+"}${Math.abs(r).toFixed(digits)}`;
};

// `children` are extra controls, placed after the seat switch.
export default function EvGrid({
  data,
  exploitability = false,
  children,
}: {
  data: PushFoldData | null;
  exploitability?: boolean;
  children?: ReactNode;
}) {
  const [depth, setDepth] = useState(10);
  const [position, setPosition] = useState<Position>("sb");
  const [hand, setHand] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);

  const entry = data ? atDepth(data, depth) : null;
  const evs = entry ? (position === "sb" ? entry.sb_jam_ev : entry.bb_call_ev) : null;
  const fold = data ? foldEv(data, depth, position) : 0;
  const who = position === "sb" ? "small blind" : "big blind";
  const act = position === "sb" ? "going all in" : "calling the all-in";

  function move(e: KeyboardEvent, i: number) {
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 13, ArrowUp: -13 }[e.key];
    if (!step) return;
    e.preventDefault();
    const row = Math.floor(i / 13);
    let next = i + step;
    if (Math.abs(step) === 1 && Math.floor(next / 13) !== row) next = i;
    if (next < 0 || next > 168) next = i;
    setHand(next);
    cells.current[next]?.focus();
  }

  return (
    <div className="ev">
      <div className="ev-controls">
        <label>
          Stack {depth} bb
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={depth}
            disabled={!data}
            aria-label="Effective stack in big blinds"
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </label>
        <span className="ev-seg" role="group" aria-label="Whose decision">
          {(["sb", "bb"] as const).map((p) => (
            <button key={p} type="button" aria-pressed={position === p} disabled={!data} onClick={() => setPosition(p)}>
              {p === "sb" ? "Small blind jams" : "Big blind calls"}
            </button>
          ))}
        </span>
        {children}
      </div>
      <div className="ev-scroll">
        <div
          className="ev-grid"
          role="group"
          aria-label={`All-in EV in big blinds for each hand, ${who}, ${depth} bb${data?.ante ? `, ${data.ante} bb ante` : ""}`}
        >
          {CLASS_NAMES.map((name, i) => {
            const ev = evs?.[i];
            const gain = ev === undefined ? 0 : ev - fold;
            // Capped at 80% heat so ink text stays at AA contrast on every cell, in both themes.
            const t = gain > 0 ? 0.2 + 0.6 * Math.min(1, gain / 1.5) : 0;
            return (
              <button
                key={name}
                type="button"
                ref={(el) => {
                  cells.current[i] = el;
                }}
                className={`ev-cell${ev === undefined || gain <= 0 ? " cold" : ""}`}
                tabIndex={i === hand ? 0 : -1}
                aria-pressed={i === hand}
                onClick={() => setHand(i)}
                onKeyDown={(e) => move(e, i)}
                style={t ? { backgroundColor: `color-mix(in srgb, var(--heat) ${Math.round(t * 100)}%, var(--ground-2))` } : undefined}
              >
                <span>{name}</span>
                {ev !== undefined && (
                  <>
                    <span className="v2">{sign(ev, 2)}</span>
                    <span className="v1">{sign(ev, 1)}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <p className="ev-detail" aria-live="polite">
        {evs ? (
          <>
            <b>
              {CLASS_NAMES[hand]} at {depth} bb:
            </b>{" "}
            for the {who}, {act} is worth {sign(evs[hand], 2)} bb, against {sign(fold, 2)} bb for folding.
            {exploitability && entry && (
              <>
                {" "}
                Exploitability at this depth: {entry.exploitability.toFixed(7)} bb per hand.
              </>
            )}
          </>
        ) : (
          "Loading showdown’s solution…"
        )}
      </p>
    </div>
  );
}
