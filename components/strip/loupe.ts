// The loupe: a WebGL lens over the film strip. What sits under it is painted
// at magnification by the same 2D painter as the strip, then refracted here.
import { RING, loupeBox, paintRegion, readPalette, type StripModel } from "./paint";

type Options = {
  host: HTMLElement; // positioned, does not scroll sideways
  viewport: HTMLElement; // the strip's clipping box inside host
  model: StripModel;
  getU: () => number;
  getOffset: () => number; // strip x within the host, px
  getReadX: () => number;
  labelAt: (frame: number) => string;
  count: number;
  leader: number;
};

const MAG = 2.1;

const VERT = `
attribute vec2 p;
varying vec2 v;
void main() { v = p; gl_Position = vec4(p, 0.0, 1.0); }`;

// v runs -1..1 across the canvas; the lens radius is 1/RING of that.
const FRAG = `
precision mediump float;
varying vec2 v;
uniform sampler2D tex;
uniform float px;
const float RING = ${RING.toFixed(3)};
vec3 at(vec2 q) { return texture2D(tex, q * 0.5 + 0.5).rgb; }
void main() {
  vec2 q = v * vec2(1.0, -1.0) * RING;
  float r = length(q);
  float aa = px * RING * 1.5;
  float inside = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, r);
  float wall = 1.0 - smoothstep(RING - aa, RING + aa, r);
  if (wall <= 0.0) { gl_FragColor = vec4(0.0); return; }

  // Barrel: slightly more magnification at the centre.
  float g = 0.9 + 0.1 * r * r;
  float ca = 0.008 * r * r;
  vec3 lens = vec3(at(q * g * (1.0 + ca) / RING).r, at(q * g / RING).g, at(q * g * (1.0 - ca) / RING).b);
  lens *= 1.0 - 0.1 * smoothstep(0.55, 1.0, r);
  float spec = exp(-pow(length((q - vec2(-0.42, -0.5)) * vec2(1.0, 1.7)) / 0.32, 2.0));
  lens += 0.16 * spec;
  lens += 0.12 * smoothstep(0.88, 1.0, r);

  // The wall compresses what is beyond the lens edge and darkens it.
  float t = (r - 1.0) / (RING - 1.0);
  // The wall carries the lens edge's colour outward, so nothing is resampled there.
  vec3 side = at(normalize(q + 1e-5) / RING) * 0.55 + vec3(0.06);
  side += 0.22 * (1.0 - smoothstep(0.0, 0.25, t)) + 0.12 * smoothstep(0.75, 1.0, t);

  vec3 col = mix(side, lens, inside);
  gl_FragColor = vec4(col * wall, wall);
}`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

export function mountLoupe(o: Options) {
  const canvas = document.createElement("canvas");
  canvas.className = "loupe";
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;

  const prog = gl.createProgram()!;
  try {
    gl.attachShader(prog, shader(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
  } catch {
    return null;
  }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const pxLoc = gl.getUniformLocation(prog, "px");

  const paper = document.createElement("canvas");
  const pctx = paper.getContext("2d")!;
  let pal = readPalette();

  canvas.tabIndex = 0;
  canvas.setAttribute("role", "slider");
  canvas.setAttribute("aria-label", "Loupe. Drag it, or use the arrow keys, to magnify a frame.");
  canvas.setAttribute("aria-valuemin", "1");
  canvas.setAttribute("aria-valuemax", String(o.count));
  o.host.appendChild(canvas);

  let x: number | null = null; // lens centre within the host; null = follow the reading position
  let size = 0;
  let raf = 0;

  // At rest the lens sits just right of the frame being read, previewing the next one,
  // so the current frame's claim always reads whole.
  const rest = () => o.getReadX() + 19 * o.getU() + loupeBox(o.getU()) / 2;

  function frameUnder(cx: number) {
    const pitch = 38 * o.getU();
    return Math.round((cx - o.getOffset()) / pitch - o.leader - 0.5);
  }

  function draw() {
    raf = 0;
    const u = o.getU();
    const box = loupeBox(u);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (box !== size) {
      size = box;
      canvas.width = canvas.height = Math.round(box * dpr);
      canvas.style.width = canvas.style.height = `${box}px`;
      paper.width = paper.height = Math.round(box * dpr);
    }
    const w = o.viewport.clientWidth;
    const cx = Math.min(w - box / 2, Math.max(box / 2, x ?? rest()));
    const cy = 17.5 * u;
    canvas.style.left = `${o.viewport.offsetLeft + cx - box / 2}px`;
    canvas.style.top = `${o.viewport.offsetTop + cy - box / 2}px`;

    // Strip region under the lens, painted at magnification.
    const span = box / MAG;
    const sx = cx - o.getOffset() - span / 2;
    const sy = cy - span / 2;
    paintRegion(pctx, o.model, u, pal, sx, sy, span, span, (MAG * box * dpr) / box);

    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, paper);
    gl!.uniform1f(pxLoc, 2 / canvas.width);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

    const i = Math.min(o.count - 1, Math.max(0, frameUnder(cx)));
    canvas.setAttribute("aria-valuenow", String(i + 1));
    canvas.setAttribute("aria-valuetext", `Frame ${i + 1}: ${o.labelAt(i)}`);
  }

  const redraw = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  let drag: { id: number; dx: number } | null = null;
  const onDown = (e: PointerEvent) => {
    const left = parseFloat(canvas.style.left) - o.viewport.offsetLeft + size / 2;
    drag = { id: e.pointerId, dx: e.clientX - left };
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    x = e.clientX - drag.dx;
    redraw();
  };
  const onUp = (e: PointerEvent) => {
    if (drag && e.pointerId === drag.id) drag = null;
  };
  const onKey = (e: KeyboardEvent) => {
    const pitch = 38 * o.getU();
    const cur = x ?? rest();
    const step = e.shiftKey ? pitch : pitch / 4;
    let next: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = cur - step;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = cur + step;
    if (e.key === "Home") next = size / 2;
    if (e.key === "End") next = o.viewport.clientWidth - size / 2;
    if (next === null) return;
    e.preventDefault();
    x = next;
    redraw();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("keydown", onKey);
  const themeWatch = new MutationObserver(() => {
    pal = readPalette();
    redraw();
  });
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  draw();

  return {
    redraw,
    destroy() {
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
      canvas.remove();
    },
  };
}
