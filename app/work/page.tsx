import type { Metadata } from "next";
import { projects } from "@/lib/site";
import ProjectIndex from "@/components/project-index";

export const metadata: Metadata = { title: "Work" };

export default function Work() {
  return (
    <div className="page">
      <h1 className="page-title">Work</h1>
      <ProjectIndex projects={projects} />
    </div>
  );
}
