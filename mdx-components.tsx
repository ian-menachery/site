import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { cross, loop } from "@/components/strip/marks";

const held = [loop(3, 12, 12, 10, 9)];
const failed = cross(9, 3, 3, 21, 21);

// A grease-pencil mark in the margin: a loop beside Results, a cross beside
// the section that reports what didn't work.
function H2({ children }: { children?: ReactNode }) {
  const text = typeof children === "string" ? children : "";
  const strokes = /^Results$/.test(text)
    ? held
    : /^(What didn['’]t work|The catch|What I caught)$/.test(text)
      ? failed
      : null;
  return (
    <h2>
      {strokes && (
        <svg className="margin-mark" viewBox="0 0 24 24" aria-hidden="true">
          {strokes.map((s, i) => (
            <path key={i} d={s.d} />
          ))}
        </svg>
      )}
      {children}
    </h2>
  );
}

const components: MDXComponents = {
  wrapper: ({ children }) => <article className="prose">{children}</article>,
  h2: H2,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
