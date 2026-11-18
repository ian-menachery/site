// Grease-pencil marks, drawn in frame units (one unit = 1 mm of 35 mm film).
// A frame box is 38 x 35; its picture window sits at (1, 5.5) and is 36 x 24.
// Paths are deterministic per seed, so server and client render the same mark.

export type Stroke = { d: string; length: number };
export type Verdict = "keep" | "cross";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = [number, number];

// Catmull-Rom through the points, as cubic Beziers.
function smooth(points: Pt[]): Stroke {
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    length += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  }
  return { d, length };
}

/** A loop drawn fast around a picture: it overshoots its start and drifts outward. */
export function loop(seed: number, cx = 19, cy = 17.5, rx = 18.4, ry = 13.1): Stroke {
  const r = rng(seed);
  const start = -2.2 + r() * 0.8;
  const turn = Math.PI * 2 + 0.45 + r() * 0.25;
  const tilt = (r() - 0.5) * 0.08;
  const p1 = r() * 6;
  const p2 = r() * 6;
  const pts: Pt[] = [];
  const steps = 24;
  for (let i = 0; i <= steps; i++) {
    const s = i / steps;
    const a = start + s * turn;
    const wobble = 1 + 0.018 * Math.sin(2 * a + p1) + 0.012 * Math.sin(3 * a + p2);
    const drift = 1 - 0.03 + 0.06 * s;
    const x = Math.cos(a) * rx * wobble * drift;
    const y = Math.sin(a) * ry * wobble * drift;
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }
  return smooth(pts);
}

function line(r: () => number, from: Pt, to: Pt, bow: number): Stroke {
  const pts: Pt[] = [];
  const nx = -(to[1] - from[1]);
  const ny = to[0] - from[0];
  const len = Math.hypot(nx, ny);
  for (let i = 0; i <= 8; i++) {
    const s = i / 8;
    const b = Math.sin(s * Math.PI) * bow + (r() - 0.5) * 0.25;
    pts.push([from[0] + (to[0] - from[0]) * s + (nx / len) * b, from[1] + (to[1] - from[1]) * s + (ny / len) * b]);
  }
  return smooth(pts);
}

/** Two quick strokes corner to corner. */
export function cross(seed: number, x0 = 2.6, y0 = 7.2, x1 = 35.6, y1 = 28.2): Stroke[] {
  const r = rng(seed);
  const j = () => (r() - 0.5) * 1.2;
  return [
    line(r, [x0 + j(), y0 + j()], [x1 + j(), y1 + j()], 0.9 + r() * 0.6),
    line(r, [x1 - 0.4 + j(), y0 - 0.3 + j()], [x0 + 0.6 + j(), y1 + 0.2 + j()], -0.7 - r() * 0.6),
  ];
}

export function strokesFor(verdict: Verdict, seed: number): Stroke[] {
  return verdict === "keep" ? [loop(seed)] : cross(seed);
}

/** How far along each stroke is when the whole mark is at progress p (0..1). */
export function strokeProgress(count: number, index: number, p: number) {
  if (count === 1) return p;
  const span = 0.56;
  const start = index * (1 - span);
  return Math.min(1, Math.max(0, (p - start) / span));
}
