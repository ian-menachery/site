import { ViewTransition } from "react";
import Link from "next/link";
import type { Project } from "@/lib/site";
import Arrow from "./arrow";

export default function ProjectIndex({ projects }: { projects: Project[] }) {
  return (
    <ul className="list">
      {projects.map((p) => (
        <li key={p.slug}>
          <p className="item-title">
            <Link href={`/work/${p.slug}`}>
              <ViewTransition name={`project-${p.slug}`} share="morph" default="none">
                <span className="vt">{p.title}</span>
              </ViewTransition>
              <Arrow />
            </Link>
          </p>
          <p className="item-side">
            {p.demo && (
              <Link href={p.demo} className="ui-link">
                Demo
              </Link>
            )}
            {p.repo ? (
              <a href={p.repo} className="ui-link">
                Code
              </a>
            ) : (
              <span>Private repo</span>
            )}
          </p>
          <p className="item-desc">
            {p.kind}. {p.summary}
          </p>
        </li>
      ))}
    </ul>
  );
}
