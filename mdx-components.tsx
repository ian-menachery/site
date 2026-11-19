import type { MDXComponents } from "mdx/types";
import { ViewTransition, type ReactNode } from "react";
import { projects } from "@/lib/site";

// A case study's title shares a view-transition name with its entry in the project
// lists, so opening a project carries the title over into the heading.
function H1({ children }: { children?: ReactNode }) {
  const slug = projects.find((p) => p.title === children)?.slug;
  if (!slug) return <h1>{children}</h1>;
  return (
    <ViewTransition name={`project-${slug}`} share="morph" default="none">
      <h1>{children}</h1>
    </ViewTransition>
  );
}

const components: MDXComponents = {
  wrapper: ({ children }) => <article className="prose">{children}</article>,
  h1: H1,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
