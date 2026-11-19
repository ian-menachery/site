"use client";

import { useEffect, useRef, useState } from "react";
import type { PushFoldData } from "@/lib/pushfold";
import EvGrid from "./ev-grid";

// Home's live figure. The grid renders at once without values; showdown's export
// (about 120 KB) loads only when the figure nears the viewport, so it never
// competes with the first screen.
export default function HomeEv() {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<PushFoldData | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        import("@/data/pushfold/pushfold.json").then((m) => setData(m.default as PushFoldData));
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <EvGrid data={data} />
    </div>
  );
}
