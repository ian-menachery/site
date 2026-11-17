import type { Metadata } from "next";
import Link from "next/link";
import reference from "@/data/dealflow/reference_cases.json";
import Calculator from "./calculator";

export const metadata: Metadata = { title: "Deal calculator" };

export default function Page() {
  return (
    <>
      <h1>Deal calculator</h1>
      <p>
        The real-estate underwriting math from dealflow, a deal-underwriting
        engine.
        NOI is rent after vacancy less operating expenses, before debt service
        and capex. Cap rate is NOI over price. Cash-on-cash takes off debt
        service and the capex reserve and divides by the cash put in. DSCR is
        NOI over debt service, and an all-cash deal gets N/A rather than a
        number. Owner-earnings yield is NOI less capex over price plus closing
        plus rehab.
      </p>
      <p>
        The repo is private, so this is a TypeScript port of its metrics,
        checked against the Python on 14 made-up deals. The defaults are an
        invented $200,000 rental, not a real property.
      </p>
      <p>
        More on the project: <Link href="/work/dealflow">dealflow</Link>.
      </p>
      <Calculator defaults={reference.defaults} />
    </>
  );
}
