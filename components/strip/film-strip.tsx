"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Chapter, Frame } from "@/lib/frames";
import { strokeProgress, strokesFor } from "./marks";
import { loupeBox, paintWindow, readPalette, type StripModel } from "./paint";

const LEADER = 2; // blank frames of leader before frame 1 and after the last
const HOLD = 0.55; // share of each frame's scroll during which the strip holds still

type Props = { frames: Frame[]; chapters: Chapter[] };

export default function FilmStrip({ frames, chapters }: Props) {
  const pinRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const pathRefs = useRef<(SVGPathElement | null)[][]>([]);
  const [current, setCurrent] = useState(0);

  const tags = useMemo(
    () => chapters.flatMap((c) => Array.from({ length: c.count }, () => c.tag)),
    [chapters],
  );
  const strokes = useMemo(() => frames.map((f, i) => strokesFor(f.verdict, 11 + i * 7)), [frames]);
  // A hidden copy of the longest caption holds the caption box at its height, so the pin never jumps.
  const longest = useMemo(
    () => frames.reduce((m, f, i) => (f.caption.length + (f.href ? 11 : 0) > frames[m].caption.length + (frames[m].href ? 11 : 0) ? i : m), 0),
    [frames],
  );
  const starts = useMemo(() => chapters.map((_, i) => chapters.slice(0, i).reduce((n, c) => n + c.count, 0)), [chapters]);

  useEffect(() => {
    const pin = pinRef.current!;
    const viewport = viewportRef.current!;
    const strip = stripRef.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = frames.length;
    const model: StripModel = { frames, tags, strokes, progress: frames.map(() => (still ? 1 : 0)), leader: LEADER };

    let u = 6;
    let pitch = 228;
    let readX = 0;
    let offset = 0; // strip x in viewport px
    let intro = still ? 1 : 0;
    let raf = 0;
    let shown = -1;
    let loupe: { redraw: () => void; destroy: () => void } | null = null;
    let alive = true;

    function measure() {
      u = strip.offsetHeight / 35 || 6; // --u can be a clamp(), so measure it
      pitch = 38 * u;
      // On phones the current frame sits left so the resting loupe fits whole beside it.
      readX = viewport.clientWidth < 720 ? (viewport.clientWidth - loupeBox(u)) / 2 : viewport.clientWidth * 0.3;
      // Chapter text holds still under the strip while its frames pass, if it fits.
      const room = window.innerHeight - pin.offsetHeight - 36;
      pin.parentElement!.style.setProperty("--pin-h", `${pin.offsetHeight}px`);
      chapterRefs.current.forEach((el) => {
        const text = el?.firstElementChild as HTMLElement | null;
        if (el && text) el.toggleAttribute("data-loose", text.offsetHeight > room);
      });
    }

    // Frames are painted when they come into view, not all at once on load.
    let pal = readPalette();
    const painted = new Set<number>();
    function paintVisible() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const first = Math.max(0, Math.floor(-offset / pitch) - LEADER - 1);
      const last = Math.min(n - 1, Math.ceil((viewport.clientWidth - offset) / pitch) - LEADER + 1);
      for (let i = first; i <= last; i++) {
        const canvas = canvasRefs.current[i];
        if (!canvas || painted.has(i)) continue;
        painted.add(i);
        canvas.width = Math.round(36 * u * dpr);
        canvas.height = Math.round(24 * u * dpr);
        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        paintWindow(ctx, frames[i], u, pal);
      }
    }
    function repaint() {
      pal = readPalette();
      painted.clear();
      paintVisible();
    }

    function position(): number {
      if (still) {
        return (viewport.scrollLeft + readX) / pitch - LEADER - 0.5;
      }
      const stripBottom = pin.getBoundingClientRect().bottom;
      const readY = stripBottom + 0.3 * (window.innerHeight - stripBottom);
      let f = 0;
      chapterRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= readY) {
          const t = Math.min(1, Math.max(0, (readY - r.top) / r.height));
          f = starts[i] + t * chapters[i].count;
        }
      });
      return f;
    }

    function update() {
      raf = 0;
      const raw = Math.min(n - 1, Math.max(0, position()));
      const k0 = Math.floor(raw);
      const t = Math.max(0, (raw - k0 - HOLD) / (1 - HOLD));
      const f = still ? raw : k0 + (t < 0.5 ? 4 * t ** 3 : 1 - (2 - 2 * t) ** 3 / 2);
      if (!still) {
        offset = readX - (f + LEADER) * pitch - pitch / 2;
        strip.style.transform = `translate3d(${offset.toFixed(1)}px,0,0)`;
        frames.forEach((_, k) => {
          let p = Math.min(1, Math.max(0, (f - k + 0.6) / 0.6));
          if (k === 0) p = Math.min(p, intro);
          model.progress[k] = p;
          const paths = pathRefs.current[k] || [];
          paths.forEach((path, s) => {
            if (!path) return;
            const sp = strokeProgress(paths.length, s, p);
            path.style.strokeDashoffset = String(1 - sp);
            path.style.visibility = sp > 0 ? "visible" : "hidden"; // round caps draw a dot at zero length
          });
        });
      } else {
        offset = -viewport.scrollLeft;
      }
      paintVisible();
      const idx = Math.floor(f + 0.02); // the caption changes when the next frame lands
      if (idx !== shown) {
        shown = idx;
        setCurrent(idx);
      }
      loupe?.redraw();
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    measure();
    update();
    document.fonts?.ready.then(() => {
      if (alive) {
        repaint();
        loupe?.redraw();
      }
    });

    // Frame 1's mark draws itself once on arrival; the rest follow the scroll.
    let introStart = 0;
    const animateIntro = (t: number) => {
      if (!alive) return;
      introStart ||= t;
      intro = Math.min(1, (t - introStart) / 900);
      intro = 1 - Math.pow(1 - intro, 3);
      update();
      if (intro < 1) requestAnimationFrame(animateIntro);
    };
    if (!still) requestAnimationFrame(animateIntro);

    const onResize = () => {
      measure();
      repaint();
      schedule();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(viewport);
    window.addEventListener("scroll", schedule, { passive: true });
    viewport.addEventListener("scroll", schedule, { passive: true });
    const themeWatch = new MutationObserver(() => {
      repaint();
      loupe?.redraw();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // The loupe is WebGL and optional: it loads after the page is readable.
    const startLoupe = () =>
      import("./loupe").then(({ mountLoupe }) => {
        if (!alive) return;
        loupe = mountLoupe({
          host: pin,
          viewport,
          model,
          getU: () => u,
          getOffset: () => offset,
          getReadX: () => readX,
          labelAt: (i) => frames[i]?.title ?? "",
          count: n,
          leader: LEADER,
        });
      });
    // Start it on the first sign of a reader (scroll, pointer, touch or key), so it
    // never competes with the first paint.
    const wake = ["scroll", "pointermove", "pointerdown", "touchstart", "keydown"] as const;
    const onWake = () => {
      wake.forEach((t) => window.removeEventListener(t, onWake));
      startLoupe();
    };
    wake.forEach((t) => window.addEventListener(t, onWake, { passive: true, once: true }));

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeWatch.disconnect();
      window.removeEventListener("scroll", schedule);
      viewport.removeEventListener("scroll", schedule);
      wake.forEach((t) => window.removeEventListener(t, onWake));
      loupe?.destroy();
    };
  }, [frames, tags, strokes, starts, chapters]);


  return (
    <section className="story" aria-label="Three chapters">
      <div className="story-pin" ref={pinRef}>
        <div className="strip-viewport" ref={viewportRef}>
          <div className="strip" ref={stripRef} style={{ "--n": frames.length + 2 * LEADER } as CSSProperties}>
            <span className="edge-print leader-print" aria-hidden="true">
              Ian Menachery {"▸"} Contact sheet {"▸"} {frames.length} frames
            </span>
            <ol aria-label={`Contact sheet, ${frames.length} frames`}>
              {frames.map((frame, i) => {
                const label = `Frame ${i + 1}, ${frame.verdict === "keep" ? "kept" : "crossed out, didn't hold"}: ${frame.caption}`;
                const body = (
                  <>
                    <canvas
                      className="window"
                      aria-hidden="true"
                      ref={(el) => {
                        canvasRefs.current[i] = el;
                      }}
                    />
                    <svg className="mark" viewBox="0 0 38 35" aria-hidden="true">
                      {strokes[i].map((s, k) => (
                        <path
                          key={k}
                          d={s.d}
                          pathLength={1}
                          strokeDasharray="1 1"
                          strokeDashoffset={1}
                          ref={(el) => {
                            (pathRefs.current[i] ||= [])[k] = el;
                          }}
                        />
                      ))}
                    </svg>
                  </>
                );
                return (
                  <li key={i} className="frame" style={{ "--i": i + LEADER } as CSSProperties}>
                    {frame.href ? (
                      <a href={frame.href} aria-label={label}>
                        {body}
                      </a>
                    ) : (
                      <div role="img" aria-label={label}>
                        {body}
                      </div>
                    )}
                    <span className="edge-print" aria-hidden="true">
                      {tags[i]}
                    </span>
                    <span className="frame-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="note" aria-hidden="true">
                      {frame.verdict === "keep" ? "Keep" : "Didn’t hold"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div className="strip-caption" aria-hidden="true">
          {[current, longest].map((i, k) => (
            <p key={k} data-on={k === 0 || undefined}>
              <span className="caps">Frame {i + 1}</span>
              {frames[i].caption}
              {frames[i].href && (
                <>
                  {" "}
                  <a href={frames[i].href} tabIndex={-1}>
                    Case study
                  </a>
                </>
              )}
            </p>
          ))}
        </div>
      </div>
      <div className="chapters">
        {chapters.map((c, i) => (
          <article
            key={c.title}
            className="chapter"
            style={{ "--count": c.count } as CSSProperties}
            aria-labelledby={`ch${i + 1}`}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
          >
            <div className="chapter-text">
              <h2 id={`ch${i + 1}`}>{c.title}</h2>
              <p>{c.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
