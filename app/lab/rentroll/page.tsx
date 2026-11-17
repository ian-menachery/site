import type { Metadata } from "next";
import Link from "next/link";
import fixtures from "@/data/rentroll/fixtures.json";
import TieOut from "./tie-out";

export const metadata: Metadata = { title: "Rent roll tie-out" };

export default function Page() {
  return (
    <>
      <h1>Rent roll tie-out</h1>
      <p>
        rentroll checks a multifamily rent roll and its trailing-twelve-month
        operating statement (T12) against the totals printed on them. Each of
        the five checks returns pass, fail or skip, and a failure names the rows
        at fault. A skip means the documents did not give enough to compare,
        which is not the same as a pass.
      </p>
      <p>
        The repo is private, so this is a TypeScript port of its parsing and
        checks, tested against the Python output. The three packages are the
        repo&apos;s synthetic test fixtures: twelve made-up units and an
        invented T12. Their CSVs carry no totals rows, so the stated totals are
        passed in as an override, the way the repo&apos;s own tests do it.
      </p>
      <p>
        More on the project: <Link href="/work/rentroll">rentroll</Link>.
      </p>
      <TieOut fixtures={fixtures} />
    </>
  );
}
