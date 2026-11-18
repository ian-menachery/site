import Link from "next/link";
import type { Project } from "@/lib/site";

export default function ProjectIndex({ projects }: { projects: Project[] }) {
  return (
    <ul className="index">
      {projects.map((p) => (
        <li key={p.slug} className="index-row">
          <div>
            <p className="index-title">
              <Link href={`/work/${p.slug}`}>{p.title}</Link>
            </p>
            <p className="caps">{p.kind}</p>
          </div>
          <p className="index-summary">{p.summary}</p>
          <p className="index-links">
            <Link href={`/work/${p.slug}`}>Case study</Link>
            {p.demo && <Link href={p.demo}>Demo</Link>}
            {p.repo ? <a href={p.repo}>Code</a> : <span className="caps">Private repo</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
