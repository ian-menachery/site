// Canvas painters for the contact sheet. The same code paints each visible
// frame window and, at higher magnification, whatever sits under the loupe.
import type { Fig, Frame } from "@/lib/frames";
import { strokeProgress, type Stroke } from "./marks";

export const RING = 1.13; // the loupe's acrylic wall, as a fraction of the lens radius

/** The loupe's on-screen box in px for a film unit u. */
export function loupeBox(u: number) {
  return Math.round(Math.round(u * (u < 8 ? 22 : 21)) * RING);
}

export type Palette = {
  film: string;
  hole: string;
  edge: string;
  china: string;
  window: string;
  ink: string;
  ink2: string;
  grease: string;
  display: string; // font-family list for the display face
};

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    film: v("--film"),
    hole: v("--hole"),
    edge: v("--edge"),
    china: v("--china"),
    window: v("--window"),
    ink: v("--window-ink"),
    ink2: v("--window-ink-2"),
    grease: v("--grease"),
    display: v("--font-archivo") || "Arial, sans-serif",
  };
}

type Ctx = CanvasRenderingContext2D;

function font(ctx: Ctx, pal: Palette, weight: number, size: number, condensed = false) {
  ctx.font = `${weight} ${size}px ${pal.display}`;
  if ("fontStretch" in ctx) ctx.fontStretch = condensed ? "condensed" : "normal";
}

function fit(ctx: Ctx, pal: Palette, text: string, weight: number, size: number, maxWidth: number) {
  font(ctx, pal, weight, size);
  const w = ctx.measureText(text).width;
  if (w > maxWidth) font(ctx, pal, weight, (size * maxWidth) / w);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Paints one picture window (36 x 24 film units) with its top-left at 0,0. `u` is px per unit. */
export function paintWindow(ctx: Ctx, frame: Frame, u: number, pal: Palette) {
  const W = 36 * u;
  const H = 24 * u;
  ctx.fillStyle = pal.window;
  roundRect(ctx, 0, 0, W, H, 0.5 * u);
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 0.5 * u);
  ctx.clip();

  ctx.fillStyle = pal.ink2;
  ctx.textBaseline = "alphabetic";
  font(ctx, pal, 600, 1.3 * u, true);
  ctx.fillText(frame.title.toUpperCase(), 1.6 * u, 2.9 * u);

  ctx.fillStyle = pal.ink;
  ctx.strokeStyle = pal.ink;
  paintFig(ctx, frame.fig, u, W, H, pal);
  ctx.restore();
}

function paintFig(ctx: Ctx, fig: Fig, u: number, W: number, H: number, pal: Palette) {
  const left = 1.6 * u;
  switch (fig.kind) {
    case "stat": {
      fit(ctx, pal, fig.big, 800, 8.4 * u, W - 3.2 * u);
      ctx.fillText(fig.big, left, 13.4 * u);
      font(ctx, pal, 500, 1.75 * u);
      fig.lines.forEach((l, i) => ctx.fillText(l, left, (17.6 + i * 2.3) * u));
      break;
    }
    case "list": {
      font(ctx, pal, 800, 3.6 * u);
      ctx.fillText(fig.head, left, 8.6 * u);
      font(ctx, pal, 500, 1.75 * u);
      fig.items.forEach((item, i) => {
        const y = (12.6 + i * 3.2) * u;
        ctx.fillRect(left, y - 0.6 * u, 0.9 * u, 0.22 * u);
        ctx.fillText(item, left + 1.6 * u, y);
      });
      break;
    }
    case "calibration": {
      const x0 = left + 2.2 * u;
      const y0 = 4.4 * u;
      const s = 16.6 * u;
      ctx.lineWidth = Math.max(1, 0.12 * u);
      ctx.strokeStyle = pal.ink2;
      ctx.strokeRect(x0, y0, s, s);
      ctx.setLineDash([0.5 * u, 0.5 * u]);
      ctx.beginPath();
      ctx.moveTo(x0, y0 + s);
      ctx.lineTo(x0 + s, y0);
      ctx.stroke();
      ctx.setLineDash([]);
      font(ctx, pal, 500, 1.05 * u, true);
      ctx.fillStyle = pal.ink2;
      ctx.fillText("PRICE", x0 + s - 3.4 * u, y0 + s + 1.5 * u);
      ctx.save();
      ctx.translate(x0 - 0.7 * u, y0 + 4.2 * u);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("HAPPENED", 0, 0);
      ctx.restore();
      ctx.fillStyle = pal.ink;
      ctx.strokeStyle = pal.ink;
      fig.series.forEach((sr, si) => {
        const pts = sr.points.map(([p, r]) => [x0 + p * s, y0 + (1 - r) * s]);
        ctx.lineWidth = Math.max(1, (si ? 0.14 : 0.22) * u);
        ctx.setLineDash(si ? [0.8 * u, 0.45 * u] : []);
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        ctx.setLineDash([]);
        pts.forEach(([x, y]) => marker(ctx, sr.shape, x, y, 0.55 * u, pal));
        const ly = (8 + si * 6) * u;
        const lx = x0 + s + 2.4 * u;
        marker(ctx, sr.shape, lx + 0.5 * u, ly - 0.6 * u, 0.6 * u, pal);
        font(ctx, pal, 700, 1.9 * u);
        ctx.fillText(sr.label, lx + 1.8 * u, ly);
        font(ctx, pal, 800, 3.1 * u);
        ctx.fillText(sr.brier, lx, ly + 3.4 * u);
      });
      font(ctx, pal, 500, 1.2 * u, true);
      ctx.fillStyle = pal.ink2;
      ctx.fillText("BRIER, LOWER IS BETTER", x0 + s + 2.4 * u, 21 * u);
      break;
    }
    case "ranges": {
      const max = Math.max(...fig.rows.map((r) => r.bull)) * 1.08;
      const x0 = left + 6.2 * u;
      const w = W - x0 - 2.4 * u;
      const xs = (v: number) => x0 + (v / max) * w;
      fig.rows.forEach((row, i) => {
        const y = (9.4 + i * 7.6) * u;
        font(ctx, pal, 800, 2.3 * u);
        ctx.fillStyle = pal.ink;
        ctx.fillText(row.label, left, y + 0.8 * u);
        ctx.fillStyle = pal.ink2;
        ctx.fillRect(x0, y - 0.05 * u, w, Math.max(1, 0.1 * u));
        ctx.fillStyle = pal.ink;
        ctx.fillRect(xs(row.bear), y - 0.7 * u, xs(row.bull) - xs(row.bear), 1.4 * u);
        ctx.fillStyle = pal.window;
        ctx.fillRect(xs(row.base) - 0.15 * u, y - 0.7 * u, 0.3 * u, 1.4 * u);
        ctx.fillStyle = pal.ink;
        font(ctx, pal, 600, 1.35 * u);
        ctx.textAlign = "center";
        ctx.fillText(`$${row.bear}`, xs(row.bear), y + 2.7 * u);
        ctx.fillText(`$${row.base}`, xs(row.base), y - 1.4 * u);
        ctx.fillText(`$${row.bull}`, xs(row.bull), y + 2.7 * u);
        ctx.textAlign = "left";
      });
      font(ctx, pal, 500, 1.2 * u, true);
      ctx.fillStyle = pal.ink2;
      ctx.fillText("BEAR · BASE · BULL, $ PER SHARE", left, 22.2 * u);
      break;
    }
    case "grid": {
      const s = 19.6 * u;
      const c = s / 13;
      const x0 = left;
      const y0 = 3.7 * u;
      ctx.textAlign = "center";
      font(ctx, pal, 600, c * 0.36, true);
      fig.values.forEach((v, i) => {
        const x = x0 + (i % 13) * c;
        const y = y0 + Math.floor(i / 13) * c;
        ctx.globalAlpha = 0.08 + 0.92 * v;
        ctx.fillStyle = pal.ink;
        ctx.fillRect(x + c * 0.04, y + c * 0.04, c * 0.92, c * 0.92);
        ctx.globalAlpha = 1;
        ctx.fillStyle = v > 0.45 ? pal.window : pal.ink;
        ctx.fillText(fig.names[i], x + c / 2, y + c * 0.62);
      });
      ctx.textAlign = "left";
      ctx.fillStyle = pal.ink;
      const tx = x0 + s + 1.8 * u;
      font(ctx, pal, 800, 3.1 * u);
      ctx.fillText(`${fig.depth} bb`, tx, 8.4 * u);
      font(ctx, pal, 500, 1.55 * u);
      ["Small blind:", "jam or fold.", "Darker cells", "jam more often."].forEach((l, i) =>
        ctx.fillText(l, tx, (11.6 + i * 2.1) * u),
      );
      break;
    }
    case "dots": {
      const cols = 19;
      const gap = 1.08 * u;
      const r = 0.36 * u;
      const x0 = left + 0.4 * u;
      const y0 = 5.2 * u;
      ctx.lineWidth = Math.max(1, 0.12 * u);
      for (let i = 0; i < fig.total; i++) {
        const x = x0 + (i % cols) * gap;
        const y = y0 + Math.floor(i / cols) * gap;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        if (i < fig.found) ctx.fill();
        else ctx.stroke();
      }
      const tx = x0 + cols * gap + 1.2 * u;
      font(ctx, pal, 800, 4.4 * u);
      ctx.fillText(String(fig.found), tx, 10.4 * u);
      font(ctx, pal, 600, 1.6 * u);
      ctx.fillText(`of ${fig.total} found`, tx, 13 * u);
      font(ctx, pal, 500, 1.55 * u);
      ["Defects planted by an", "agent that never saw", "the checks. Hollow", "dots: the 3 missed."].forEach((l, i) =>
        ctx.fillText(l, left, (16.4 + i * 1.95) * u),
      );
      break;
    }
    case "tally": {
      const box = 2.5 * u;
      const gap = 0.7 * u;
      const x0 = left;
      const y0 = 5 * u;
      ctx.lineWidth = Math.max(1, 0.16 * u);
      for (let i = 0; i < fig.total; i++) {
        const x = x0 + i * (box + gap);
        ctx.strokeRect(x, y0, box, box);
        if (i < fig.passed) {
          ctx.beginPath();
          ctx.moveTo(x + 0.5 * u, y0 + 1.3 * u);
          ctx.lineTo(x + 1.05 * u, y0 + 1.9 * u);
          ctx.lineTo(x + 2.05 * u, y0 + 0.55 * u);
          ctx.stroke();
        }
      }
      const barX = x0 + fig.bar * (box + gap) - gap / 2;
      ctx.lineWidth = Math.max(1, 0.2 * u);
      ctx.beginPath();
      ctx.moveTo(barX, y0 - 0.8 * u);
      ctx.lineTo(barX, y0 + box + 0.8 * u);
      ctx.stroke();
      font(ctx, pal, 600, 1.3 * u, true);
      ctx.fillText(`BAR: ${fig.bar}`, barX + 0.5 * u, y0 + box + 1.9 * u);
      font(ctx, pal, 800, 6.4 * u);
      ctx.fillText(`${fig.passed} of ${fig.total}`, left, 16.6 * u);
      font(ctx, pal, 500, 1.75 * u);
      ["flops where the model bluffed less", "against a player who never folds"].forEach((l, i) =>
        ctx.fillText(l, left, (19.6 + i * 2.2) * u),
      );
      break;
    }
  }
}

function marker(ctx: Ctx, shape: "dot" | "square", x: number, y: number, r: number, pal: Palette) {
  if (shape === "dot") {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = pal.window;
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.fillStyle = pal.ink;
    ctx.lineWidth = Math.max(1, r * 0.35);
    ctx.strokeRect(x - r, y - r, 2 * r, 2 * r);
  }
}

export type StripModel = {
  frames: Frame[];
  tags: string[]; // edge print per frame
  strokes: Stroke[][];
  progress: number[]; // 0..1 per frame
  leader: number; // frames of blank leader before frame 0
};

/**
 * Paints the strip region [x, x + w] x [y, y + h] (strip px at scale 1) into ctx,
 * already scaled so one strip px = `scale` canvas px.
 */
export function paintRegion(
  ctx: Ctx,
  model: StripModel,
  u: number,
  pal: Palette,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
) {
  ctx.setTransform(scale, 0, 0, scale, -x * scale, -y * scale);
  ctx.fillStyle = pal.hole;
  ctx.fillRect(x, y, w, h);
  const pitch = 38 * u;
  const total = (model.frames.length + 2 * model.leader) * pitch;
  ctx.fillStyle = pal.film;
  ctx.fillRect(Math.max(0, x), y, Math.min(total, x + w) - Math.max(0, x), h);

  // Sprocket holes, 8 per frame, top and bottom.
  const hp = 4.75 * u;
  ctx.fillStyle = pal.hole;
  for (let i = Math.max(0, Math.floor(x / hp) - 1); i * hp < Math.min(total, x + w); i++) {
    const hx = i * hp + 1.385 * u;
    for (const hy of [0.9 * u, 31.3 * u]) {
      roundRect(ctx, hx, hy, 1.98 * u, 2.8 * u, 0.45 * u);
      ctx.fill();
    }
  }

  const first = Math.max(0, Math.floor(x / pitch) - model.leader - 1);
  const last = Math.min(model.frames.length - 1, Math.ceil((x + w) / pitch) - model.leader);
  for (let i = first; i <= last; i++) {
    const fx = (i + model.leader) * pitch;
    const frame = model.frames[i];

    ctx.fillStyle = pal.edge;
    font(ctx, pal, 600, 1.3 * u, true);
    ctx.fillText(model.tags[i].toUpperCase(), fx + 2 * u, 5 * u);
    ctx.fillText(String(i + 1), fx + 2 * u, 31.2 * u);

    ctx.save();
    ctx.translate(fx + u, 5.5 * u);
    paintWindow(ctx, frame, u, pal);
    ctx.restore();

    ctx.save();
    ctx.translate(fx + 35.8 * u, 31.5 * u);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.textAlign = "right";
    ctx.fillStyle = pal.china;
    font(ctx, pal, 800, 2.3 * u, true);
    ctx.fillText(frame.verdict === "keep" ? "KEEP" : "DIDN’T HOLD", 0, 0);
    ctx.restore();

    const p = model.progress[i];
    if (p > 0) {
      ctx.save();
      ctx.translate(fx, 0);
      ctx.scale(u, u);
      ctx.strokeStyle = pal.grease;
      ctx.lineWidth = 0.62;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const strokes = model.strokes[i];
      strokes.forEach((s, k) => {
        const sp = strokeProgress(strokes.length, k, p);
        if (sp <= 0) return;
        ctx.setLineDash([s.length * 1.15 * sp, s.length * 2]);
        ctx.stroke(new Path2D(s.d));
      });
      ctx.restore();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
