import type { Metadata } from "next";
import Link from "next/link";
import exported from "@/data/pushfold/pushfold.json";
import type { PushFoldData } from "@/lib/pushfold";
import PushFold from "./push-fold";

export const metadata: Metadata = { title: "Push/fold explorer" };

export default function Page() {
  return (
    <>
      <h1>Push/fold explorer</h1>
      <p>
        In the heads-up push/fold game the small blind either goes all in or
        folds, and the big blind either calls the all-in or folds. This page shows
        the equilibrium of that game at every effective stack from 1 to 20 big
        blinds, and grades your own decisions against it.
      </p>
      <p>
        The strategies come from{" "}
        <Link href="/work/showdown">showdown</Link>, my heads-up poker lab: CFR+
        run for 1,000 iterations at each depth, with payoffs from an exact
        169×169 preflop equity matrix. Every number on this page (frequencies,
        EVs, bb lost) was computed in Python by showdown and exported; the page
        only looks values up.
      </p>
      <p>
        This is the equilibrium of the simplified push/fold game only: blinds of
        0.5 and 1 bb, either no ante or a 0.1 bb ante from each player (10% of
        the big blind), no limps and no smaller raises. It is not a strategy for
        full no-limit hold&apos;em. EVs are the net result of the hand in big
        blinds, so folding the small blind is −0.5 bb and folding the big blind
        to a jam is −1 bb, or −0.6 and −1.1 bb with the ante. The stack is
        counted before anything is posted, and no one loses more than it: at
        1 bb with the ante, the big blind&apos;s fold costs 1 bb.
      </p>
      <PushFold data={exported as PushFoldData} />
    </>
  );
}
