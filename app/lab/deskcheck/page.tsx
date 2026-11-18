import type { Metadata } from "next";
import Link from "next/link";
import results from "@/data/deskcheck/results.json";
import traces from "@/data/deskcheck/traces.json";
import DeskcheckDemo, { type Results, type Trace } from "./replay";

export const metadata: Metadata = { title: "Helpdesk agent replay" };

export default function Page() {
  return (
    <>
      <h1>Helpdesk agent replay</h1>
      <p>
        deskcheck is an IT and HR helpdesk for a made-up company. Its tools look people up, read
        policies, file access requests, start onboarding and offboarding, and hand work to a human
        team, and code validates every write. A rule-based router and two Claude models (Haiku 5.5 and
        Opus 5.5) answered the same frozen cases. The pass bars were set before any of them ran.
      </p>
      <p>
        Nothing on this page calls a model. The table is recomputed from recorded runs, and the
        replays step through recorded traces, including the cases where an agent got it wrong.
      </p>
      <p>
        More on the project: <Link href="/work/deskcheck">deskcheck</Link>.
      </p>
      <DeskcheckDemo results={results as unknown as Results} traces={traces as unknown as Trace[]} />
    </>
  );
}
