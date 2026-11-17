import type { Metadata } from "next";
import Link from "next/link";
import demo from "@/data/cutover/demo.json";
import Cutover, { type Demo } from "./cutover";

export const metadata: Metadata = { title: "Migration tie-out" };

export default function Page() {
  return (
    <>
      <h1>Migration tie-out</h1>
      <p>
        A made-up insurer has moved 300 customer accounts and about 800 policies
        from an old policy system to a new CRM. Before anyone signs off on
        go-live, cutover checks the new system against the old one: record
        counts, control totals by product and billing mode, every mapped field
        of every matched record, orphans on either side, duplicate and blank
        keys, unmapped picklist values and broken parent links. Each finding
        names the row in the legacy or target file.
      </p>
      <p>
        Nine migration bugs are included, each one a patch on the clean data.
        Turn them on and off and the checks run again in your browser. The
        engine is Python and DuckDB SQL. This page runs a TypeScript port of
        it, tested to give the same report in 21 combinations. Four pending
        policies are held back for manual migration on purpose. They are listed
        in the exception register, so they show as known exceptions and do not
        block sign-off.
      </p>
      <p>
        More on the project: <Link href="/work/cutover">cutover</Link>.
      </p>
      <Cutover demo={demo as unknown as Demo} />
    </>
  );
}
