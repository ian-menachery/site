import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/lib/site";

export const metadata: Metadata = { title: "Work" };

export default function Work() {
  return (
    <>
      <h1>Work</h1>
      <ul>
        {projects.map((p) => (
          <li key={p.slug}>
            <Link href={`/work/${p.slug}`}>{p.title}</Link>: {p.kind}. {p.summary}
          </li>
        ))}
      </ul>
    </>
  );
}
