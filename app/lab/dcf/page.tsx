import type { Metadata } from "next";
import Link from "next/link";
import data from "@/data/dcf/companies.json";
import DcfSliders, { type Company } from "./dcf-sliders";

export const metadata: Metadata = { title: "DCF sliders" };

const companies: Company[] = data.companies.map((c) => ({
  ticker: c.ticker,
  name: c.name,
  assumptions: c.assumptions,
}));
const asOf = data.companies[0].valuedAt.slice(0, 10); // both runs are 2026-07-30 (UTC)

export default function Page() {
  return (
    <>
      <h1>DCF sliders</h1>
      <p>
        redline values a company with a five-year discounted cash flow model and
        reports a bear, base and bull range rather than a single number. This
        page runs the same model in your browser: the math is ported from
        redline&apos;s Python and tested against it to nine significant digits.
        Move the sliders to see how much of the range comes from each
        assumption. It shows sensitivity, not a price target or a view on the
        stock.
      </p>
      <p>
        The inputs are redline&apos;s saved valuations of Ulta Beauty and Vertex
        Pharmaceuticals, as of its {asOf} run: revenue, net debt and diluted shares
        from each company&apos;s latest annual XBRL financials, and growth,
        margin and cost of capital from redline&apos;s assumptions file. More on
        the project: <Link href="/work/redline">redline</Link>.
      </p>
      <DcfSliders companies={companies} horizon={data.horizon} />
    </>
  );
}
