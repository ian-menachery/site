import type { Metadata } from "next";
import Link from "next/link";
import buckets from "@/data/calibration/buckets.json";
import metrics from "@/data/calibration/metrics.json";
import CalibrationExplorer, { type CalibrationData } from "./calibration-explorer";

export const metadata: Metadata = { title: "Calibration explorer" };

const data: CalibrationData = {
  snapshots: buckets.snapshots,
  categories: buckets.categories,
  edges: buckets.edges,
  overall: buckets.overall,
  byCategory: buckets.byCategory,
  metrics: metrics.rows,
};
const total = metrics.rows.find((r) => r.subgroup === "overall" && r.snapshotType === "close")!.nMarkets;

export default function Page() {
  return (
    <>
      <h1>Calibration explorer</h1>
      <p>
        A market is well calibrated if things it prices at 70% happen about 70% of
        the time. calibration-tracker tests that on {total.toLocaleString("en-US")} resolved
        Polymarket markets that ended between {buckets.resolvedFrom} and {buckets.resolvedTo}.
        It sorts them into price deciles at a fixed time before resolution, then
        compares each decile&apos;s average price with the share that actually resolved
        Yes. Pick a horizon and categories to compare.
      </p>
      <p>
        The numbers are aggregates exported by the project&apos;s own analysis code;
        no individual markets appear here. The all-markets curve and the Brier
        scores come straight from the project&apos;s report files, and the
        per-category curves are recomputed from its database with the same code. More on the project:{" "}
        <Link href="/work/calibration">calibration-tracker</Link>.
      </p>
      <CalibrationExplorer data={data} />
    </>
  );
}
