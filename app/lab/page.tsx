import type { Metadata } from "next";
import Link from "next/link";
import { demos } from "@/lib/site";

export const metadata: Metadata = { title: "Lab" };

export default function Lab() {
  return (
    <>
      <h1>Lab</h1>
      <p>
        Each demo runs in your browser on data exported from the project it
        comes from. Tests check the numbers against the original Python.
      </p>
      <ul>
        {demos.map((d) => (
          <li key={d.href}>
            <Link href={d.href}>{d.title}</Link> (from {d.from})
          </li>
        ))}
      </ul>
    </>
  );
}
