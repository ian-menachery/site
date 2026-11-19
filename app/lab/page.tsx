import type { Metadata } from "next";
import Link from "next/link";
import { demos } from "@/lib/site";
import Arrow from "@/components/arrow";

export const metadata: Metadata = { title: "Lab" };

export default function Lab() {
  return (
    <>
      <h1>Lab</h1>
      <p>
        Each demo runs in your browser on data exported from the project it
        comes from. Tests check the numbers against the original Python.
      </p>
      <ul className="list">
        {demos.map((d) => (
          <li key={d.href}>
            <p className="item-title">
              <Link href={d.href}>
                {d.title}
                <Arrow />
              </Link>
            </p>
            <p className="item-side">From {d.from}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
