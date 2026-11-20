"use client";

import clsx from "clsx";
import { useEffect, useId, useRef } from "react";
import styles from "./orbit-sketch.module.css";

/**
 * The hero drawing from orbit.linear.app, rebuilt in SVG.
 *
 * Orbit draws it with a WebGL shader; here every shape is an SVG path with
 * pathLength=1, so the visible stretch of a stroke between the pen's tail and
 * head is just `stroke-dasharray: 0 <tail> <head - tail> 2`.
 * Scene data and timing are Orbit's, in a 960×480 drawing.
 */

// [cx, cy, rx, ry, opacity, rotation°]
type Ellipse = readonly [number, number, number, number, number, number];
// [x1, y1, x2, y2, opacity]
type Segment = readonly [number, number, number, number, number];
type Scene = {
  ellipses: readonly Ellipse[];
  segments: readonly Segment[];
  axis: boolean;
};

const W = 960;
const CENTER = 480;

const SCENES: readonly Scene[] = [
  {
    ellipses: [
      [720, 240, 240, 240, 0.4, 0],
      [360, 240, 120, 240, 0.4, 0],
      [60, 240, 60, 240, 0.4, 0],
      [180, 240, 60, 240, 0.4, 0],
      [600, 240, 120, 240, 0, 0],
      [540, 240, 60, 240, 0, 0],
      [900, 240, 480, 240, 0, 0],
      [60, 240, 480, 240, 0, 0],
    ],
    segments: [
      [119.5, 0, 119.5, 480, 0.2],
      [239.5, 0, 239.5, 480, 0.2],
      [479.5, 0, 479.5, 480, 0.2],
      [0, 480, 960, 0, 0.2],
      [0, 480, 480, 0, 0.2],
      [0, 480, 240, 0, 0.2],
      [0, 480, 120, 0, 0.2],
      [0, 0, 960, 480, 0],
    ],
    axis: false,
  },
  {
    ellipses: [
      [720, 240, 240, 240, 0.4, 0],
      [360, 240, 120, 240, 0.4, 0],
      [240, 240, 240, 240, 0.4, 0],
      [420, 240, 60, 240, 0.4, 0],
      [600, 240, 120, 240, 0.4, 0],
      [540, 240, 60, 240, 0.4, 0],
      [900, 240, 480, 240, 0, 0],
      [60, 240, 480, 240, 0, 0],
    ],
    segments: [
      [119.5, 0, 119.5, 480, 0],
      [239.5, 0, 239.5, 480, 0],
      [479.5, 0, 479.5, 480, 0.4],
      [0, 480, 960, 0, 0],
      [0, 480, 480, 0, 0],
      [0, 480, 240, 0, 0],
      [0, 480, 120, 0, 0],
      [0, 0, 960, 480, 0],
    ],
    axis: true,
  },
  {
    ellipses: [
      [103.684, 52.373, 120, 60, 0.4, 26.5],
      [157.38, 79.145, 180, 90, 0.4, 26.5],
      [211.076, 105.917, 240, 120, 0.4, 26.5],
      [264.772, 132.688, 300, 150, 0.4, 26.5],
      [318.468, 159.46, 360, 180, 0.4, 26.5],
      [372.165, 186.232, 420, 210, 0.4, 26.5],
      [425.861, 213.004, 480, 240, 0.4, 26.5],
      [479.556, 239.778, 540, 270, 0.4, 26.5],
    ],
    segments: [
      [119.5, 0, 119.5, 480, 0],
      [239.5, 0, 239.5, 480, 0],
      [479.5, 0, 479.5, 480, 0],
      [0, 480, 960, 0, 0],
      [0, 480, 480, 0, 0],
      [0, 480, 240, 0, 0],
      [0, 480, 120, 0, 0],
      [0, 0, 960, 480, 0.2],
    ],
    axis: false,
  },
];

// Timing (ms), Orbit's. Each scene holds, then the pen erases left to right and redraws.
const FRAME = 1000 / 24; // stepped, so it feels drawn by hand
const SCENE_MS = 6550;
const HOLD_MS = 2600;
const ERASE_MS = 900;
const DRAW_AT = 1800;
const DRAW_MS = 1250;
const STAGGER_MS = 900;

// The figure number in the corner, one per scene, written in Reenie Beanie.
const NOTES = ["01", "02", "03"];
const NOTE_CELL = 8.81; // every digit sits centred in a fixed-width cell
const NOTE_X = 940; // the pen reaches the corner last, as if it sat at this x

// Handwritten digits: outlines revealed through a mask that follows the pen.
const GLYPHS: Record<
  string,
  { advance: number; outline: string; pen: string }
> = {
  "0": {
    advance: 8.57,
    outline:
      "M7.82 -5.71Q7.82 -4.7 7.57 -3.97Q7.32 -3.24 6.95 -2.72Q6.58 -2.21 6.11 -1.88Q5.64 -1.56 5.21 -1.38Q4.78 -1.2 4.43 -1.13Q4.08 -1.06 3.94 -1.06Q3.38 -1.06 2.88 -1.31Q2.38 -1.56 1.99 -1.99Q1.61 -2.42 1.38 -3.01Q1.15 -3.6 1.15 -4.27Q1.15 -4.85 1.3 -5.41Q1.44 -5.98 1.6 -6.47Q1.75 -6.96 1.9 -7.34Q2.04 -7.73 2.04 -7.97Q2.04 -8.02 2.03 -8.09Q2.02 -8.16 2.02 -8.23Q2.02 -8.38 2.11 -8.45Q2.3 -8.59 2.41 -8.66Q2.52 -8.74 2.66 -8.74Q2.83 -8.74 3.14 -8.65Q3.46 -8.57 3.58 -8.57Q3.7 -8.57 3.85 -8.57Q4.01 -8.57 4.18 -8.59Q4.37 -8.62 4.56 -8.64Q4.87 -8.64 5.42 -8.53Q5.98 -8.42 6.52 -8.11Q7.06 -7.8 7.44 -7.22Q7.82 -6.65 7.82 -5.71ZM4.06 -2.18Q4.7 -2.18 5.21 -2.46Q5.71 -2.74 6.06 -3.22Q6.41 -3.7 6.58 -4.33Q6.74 -4.97 6.74 -5.66Q6.74 -6.19 6.55 -6.58Q6.36 -6.96 6.06 -7.2Q5.76 -7.44 5.38 -7.55Q4.99 -7.66 4.63 -7.66Q4.15 -7.66 3.79 -7.58Q3.43 -7.51 3.02 -7.51Q2.95 -7.3 2.83 -6.94Q2.71 -6.58 2.59 -6.18Q2.47 -5.78 2.39 -5.41Q2.3 -5.04 2.3 -4.75Q2.3 -4.39 2.36 -3.94Q2.42 -3.48 2.62 -3.1Q2.81 -2.71 3.16 -2.45Q3.5 -2.18 4.06 -2.18Z",
    pen: "M1.6 -8.4C2.6 -8.2 3.6 -8.1 4.6 -8.1C5.9 -8.1 7.3 -7.3 7.3 -5.7C7.3 -3.2 5.8 -1.6 4 -1.6C3 -1.6 2.1 -2.3 1.8 -3.5C1.6 -4.6 1.7 -6 2.7 -8.8",
  },
  "1": {
    advance: 6.94,
    outline:
      "M5.47 -0.82Q5.47 -0.58 5.17 -0.43Q4.87 -0.29 4.73 -0.29Q4.63 -0.29 4.45 -0.37Q4.27 -0.46 4.22 -0.58Q3.96 -1.51 3.8 -2.3Q3.65 -3.1 3.54 -3.84Q3.43 -4.58 3.35 -5.35Q3.26 -6.12 3.14 -7.03Q2.95 -6.96 2.64 -6.76Q2.33 -6.55 2.02 -6.35Q1.7 -6.14 1.48 -5.98Q1.25 -5.81 1.2 -5.81Q1.13 -5.81 1.07 -6Q1.01 -6.19 1.01 -6.26Q1.01 -6.31 1.04 -6.42Q1.08 -6.53 1.13 -6.6Q1.18 -6.67 1.52 -6.97Q1.87 -7.27 2.27 -7.64Q2.66 -8.02 2.98 -8.39Q3.29 -8.76 3.29 -8.98Q3.29 -9.17 3.43 -9.22Q3.58 -9.26 3.62 -9.26Q3.82 -9.26 3.94 -9.12Q4.06 -8.98 4.13 -8.76Q4.2 -8.54 4.24 -8.32Q4.27 -8.09 4.27 -7.94Q4.27 -6.7 4.38 -5.84Q4.49 -4.99 4.63 -4.22Q4.73 -3.38 4.87 -2.8Q5.02 -2.21 5.15 -1.81Q5.28 -1.42 5.38 -1.18Q5.47 -0.94 5.47 -0.82Z",
    pen: "M0.6 -5.9L2.4 -7.3L3.7 -9.8C3.8 -6.5 4.2 -3 5.2 0.1",
  },
  "2": {
    advance: 8.81,
    outline:
      "M7.46 -1.63Q7.46 -1.37 7.24 -1.22Q7.01 -1.08 6.86 -1.08Q6.65 -1.08 6.54 -1.15Q6.43 -1.22 6.3 -1.32Q6.17 -1.42 5.96 -1.49Q5.76 -1.56 5.38 -1.56Q4.9 -1.56 4.52 -1.32Q4.15 -1.08 3.83 -0.8Q3.5 -0.53 3.19 -0.29Q2.88 -0.05 2.54 -0.05Q2.14 -0.05 2.02 -0.34Q1.9 -0.62 1.9 -1.08Q1.9 -1.18 2.21 -1.79Q2.52 -2.4 2.94 -3.14Q3.36 -3.89 3.74 -4.57Q4.13 -5.26 4.27 -5.52Q4.42 -5.78 4.68 -6.26Q4.94 -6.74 5.22 -7.24Q5.5 -7.73 5.69 -8.1Q5.88 -8.47 5.88 -8.54Q5.88 -8.71 5.81 -8.76Q5.74 -8.81 5.66 -8.81Q5.5 -8.81 4.93 -8.62Q4.37 -8.42 3.73 -8.21Q3.1 -7.99 2.53 -7.8Q1.97 -7.61 1.82 -7.61Q1.8 -7.61 1.68 -7.73Q1.63 -7.8 1.6 -7.87Q1.56 -7.94 1.56 -8.02Q1.56 -8.11 2.12 -8.42Q2.69 -8.74 3.48 -9.06Q4.27 -9.38 5.1 -9.64Q5.93 -9.89 6.46 -9.89Q6.77 -9.89 7.01 -9.7Q7.25 -9.5 7.25 -9.17Q7.25 -8.81 6.98 -8.18Q6.72 -7.56 6.31 -6.82Q5.9 -6.07 5.44 -5.28Q4.97 -4.49 4.56 -3.83Q4.15 -3.17 3.86 -2.7Q3.58 -2.23 3.55 -2.11Q3.72 -2.21 3.98 -2.29Q4.25 -2.38 4.52 -2.45Q4.8 -2.52 5.05 -2.57Q5.3 -2.62 5.45 -2.62Q5.64 -2.62 5.98 -2.57Q6.31 -2.52 6.65 -2.41Q6.98 -2.3 7.22 -2.11Q7.46 -1.92 7.46 -1.63Z",
    pen: "M1 -7.8C3 -8.6 5.2 -9.4 6.5 -9.4C7 -9.4 6.9 -8.7 6.6 -8.1C5.6 -6 3.8 -3.3 2.5 -0.6C3.5 -0.9 4.3 -2.1 5.4 -2.1C6.4 -2.1 7.3 -1.9 8 -1.4",
  },
  "3": {
    advance: 8.81,
    outline:
      "M7.61 -8.16Q7.61 -7.75 7.19 -7.37Q6.77 -6.98 6.26 -6.66Q5.76 -6.34 5.32 -6.13Q4.87 -5.93 4.8 -5.9Q4.51 -5.78 4.51 -5.64Q4.51 -5.54 4.72 -5.53Q4.92 -5.52 5.42 -5.33Q5.71 -5.23 6.05 -5.08Q6.38 -4.92 6.67 -4.67Q6.96 -4.42 7.15 -4.04Q7.34 -3.67 7.34 -3.14Q7.34 -2.59 6.94 -2.09Q6.53 -1.58 5.94 -1.2Q5.35 -0.82 4.67 -0.59Q3.98 -0.36 3.43 -0.36Q3.1 -0.36 2.75 -0.42Q2.4 -0.48 2.1 -0.6Q1.8 -0.72 1.61 -0.91Q1.42 -1.1 1.42 -1.39Q1.42 -1.54 1.52 -1.76Q1.63 -1.99 1.75 -2.11Q2.04 -1.85 2.41 -1.7Q2.78 -1.56 3.36 -1.56Q3.74 -1.56 4.24 -1.72Q4.73 -1.87 5.16 -2.12Q5.59 -2.38 5.88 -2.7Q6.17 -3.02 6.17 -3.38Q6.17 -3.89 5.66 -4.1Q5.16 -4.32 4.56 -4.48Q3.96 -4.63 3.46 -4.84Q2.95 -5.04 2.95 -5.54Q2.95 -5.88 3.44 -6.22Q3.94 -6.55 4.54 -6.86Q5.14 -7.18 5.63 -7.45Q6.12 -7.73 6.12 -7.97Q6.12 -8.14 5.81 -8.14Q5.42 -8.14 4.97 -8.02Q4.51 -7.9 4.09 -7.75Q3.67 -7.61 3.32 -7.49Q2.98 -7.37 2.81 -7.37Q2.47 -7.37 2.36 -7.49Q2.26 -7.61 2.26 -7.9Q2.26 -8.06 2.5 -8.22Q2.74 -8.38 3.11 -8.52Q3.48 -8.66 3.92 -8.77Q4.37 -8.88 4.78 -8.96Q5.18 -9.05 5.51 -9.1Q5.83 -9.14 5.95 -9.14Q6.12 -9.14 6.4 -9.11Q6.67 -9.07 6.94 -8.96Q7.2 -8.86 7.4 -8.66Q7.61 -8.47 7.61 -8.16Z",
    pen: "M1.7 -7.8C3.4 -8.3 5 -8.7 6 -8.7C7.4 -8.7 6.9 -7.6 5.9 -7C4.9 -6.4 3.4 -5.9 3.6 -5.4C4 -4.9 6.8 -4.7 6.8 -3.3C6.8 -2 4.6 -1 3.4 -1C2.6 -1 1.8 -1.2 1 -2",
  },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number, start: number, length: number) =>
  1 - (1 - clamp01((t - start) / length)) ** 3;
const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a));
  return x * x * (3 - 2 * x);
};
const stagger = (x: number) => (Math.min(W, Math.max(0, x)) / W) * STAGGER_MS;
const same = (a: readonly number[], b: readonly number[], skip = -1) =>
  a.every((v, i) => i === skip || v === b[i]);

type Pen = { opacity: number; tail: number; head: number };

/** Where the pen is for one shape (opacity at index 4) moving between scenes. */
function pen<T extends readonly number[]>(
  from: T,
  to: T,
  x0: number,
  x1: number,
  g: number,
): { shape: T; pen: Pen } {
  const wasOn = from[4] > 0;
  const isOn = to[4] > 0;
  if (same(from, to))
    return { shape: to, pen: { opacity: to[4], tail: 0, head: 1 } };
  const drawAt = DRAW_AT + stagger(x1);
  // Same shape, new weight: fade instead of redrawing.
  if (wasOn && isOn && same(from, to, 4))
    return {
      shape: to,
      pen: {
        opacity: from[4] + (to[4] - from[4]) * ease(g, drawAt, DRAW_MS),
        tail: 0,
        head: 1,
      },
    };
  if (isOn && g >= drawAt)
    return {
      shape: to,
      pen: { opacity: to[4], tail: 0, head: ease(g, drawAt, DRAW_MS) },
    };
  if (wasOn)
    return {
      shape: from,
      pen: { opacity: from[4], tail: ease(g, stagger(x0), ERASE_MS), head: 1 },
    };
  return { shape: from, pen: { opacity: 0, tail: 0, head: 0 } };
}

/**
 * Upright ellipses start on the side facing the centre and go clockwise;
 * tilted ones start on their left and go anticlockwise.
 */
function ellipsePath([cx, cy, rx, ry, , rotation]: Ellipse) {
  const start = rotation || cx > CENTER ? -1 : 1; // which side: +1 right, -1 left
  const sweep = rotation ? 0 : 1;
  const a = `${cx + start * rx} ${cy}`;
  const b = `${cx - start * rx} ${cy}`;
  return `M${a}A${rx} ${ry} 0 1 ${sweep} ${b}A${rx} ${ry} 0 1 ${sweep} ${a}`;
}

const dash = ({ tail, head }: Pen) => `0 ${tail} ${Math.max(0, head - tail)} 2`;

/** Everything needed to paint one moment of the animation. */
function frameAt(elapsed: number) {
  const index = Math.floor(elapsed / SCENE_MS) % SCENES.length;
  const from = SCENES[index];
  const to = SCENES[(index + 1) % SCENES.length];
  const g = (elapsed % SCENE_MS) - HOLD_MS;

  const ellipses = from.ellipses.map((a, i) => {
    const b = to.ellipses[i];
    const { shape, pen: p } = pen(a, b, a[0], b[0], g);
    return {
      d: ellipsePath(shape),
      transform: `rotate(${shape[5]} ${shape[0]} ${shape[1]})`,
      dash: dash(p),
      opacity: p.opacity,
      // Narrow outlines cut a gap in the axis arrow where they cross it.
      knockout: shape[2] < 200 && p.opacity > 0.001,
    };
  });

  const segments = from.segments.map((a, i) => {
    const b = to.segments[i];
    const { shape, pen: p } = pen(
      a,
      b,
      (a[0] + a[2]) / 2,
      (b[0] + b[2]) / 2,
      g,
    );
    return {
      d: `M${shape[0]} ${shape[1]}L${shape[2]} ${shape[3]}`,
      dash: dash(p),
      opacity: p.opacity,
      pen: p,
    };
  });

  // The axis arrow is one stroke from the left tip to the right one.
  const [tail, head] =
    from.axis && to.axis
      ? [0, 1]
      : to.axis
        ? [0, ease(g, DRAW_AT + stagger(CENTER), DRAW_MS)]
        : from.axis
          ? [ease(g, stagger(CENTER), ERASE_MS), 1]
          : [0, 0];
  const axis = {
    dash: dash({ opacity: 1, tail, head }),
    opacity: head > tail ? 1 : 0,
    left: smoothstep(0, 0.02, head) * (1 - smoothstep(0, 0.02, tail)),
    right: smoothstep(0.98, 1, head) * (1 - smoothstep(0.98, 1, tail)),
  };

  // The ⅛ construction rule outside the drawing follows the first segment's pen.
  const first = segments[0].pen;
  const rule = { tail: first.tail, head: first.opacity ? first.head : 0 };

  // The figure number switches mid-change: the old one is erased, then the
  // new one written digit by digit.
  const text = NOTES[g >= DRAW_AT ? (index + 1) % SCENES.length : index];
  const writeAt = DRAW_AT + stagger(NOTE_X);
  const [noteTail, noteHead] =
    g >= writeAt
      ? [0, ease(g, writeAt, DRAW_MS)]
      : [ease(g, stagger(NOTE_X), ERASE_MS), 1];
  const note = [...text].map((digit, i) => {
    const { advance, outline, pen } = GLYPHS[digit];
    return {
      outline,
      pen,
      transform: `translate(${NOTE_CELL * i + (NOTE_CELL - advance) / 2} 18)`,
      dash: dash({
        opacity: 1,
        tail: clamp01(noteTail * text.length - i),
        head: clamp01(noteHead * text.length - i),
      }),
    };
  });

  return { ellipses, segments, axis, rule, note };
}

type Frame = ReturnType<typeof frameAt>;

function set(el: Element | null | undefined, name: string, value: string) {
  if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function paint(root: HTMLElement, f: Frame) {
  const q = (s: string) => [...root.querySelectorAll(s)];
  const ellipses = q("[data-ellipse]");
  const knockouts = q("[data-knockout]");
  f.ellipses.forEach((e, i) => {
    for (const el of [ellipses[i], knockouts[i]]) {
      set(el, "d", e.d);
      set(el, "transform", e.transform);
      set(el, "stroke-dasharray", e.dash);
    }
    set(ellipses[i], "opacity", String(e.opacity));
    set(knockouts[i], "opacity", e.knockout ? "1" : "0");
  });
  const segments = q("[data-segment]");
  f.segments.forEach((s, i) => {
    set(segments[i], "d", s.d);
    set(segments[i], "stroke-dasharray", s.dash);
    set(segments[i], "opacity", String(s.opacity));
  });
  const [shaft, left, right] = q("[data-axis]");
  set(shaft, "stroke-dasharray", f.axis.dash);
  set(shaft, "opacity", String(f.axis.opacity));
  set(left, "opacity", String(f.axis.left));
  set(right, "opacity", String(f.axis.right));
  const glyphs = q("[data-glyph]");
  const outlines = q("[data-glyph-outline]");
  const pens = q("[data-glyph-pen]");
  f.note.forEach((n, i) => {
    set(glyphs[i], "transform", n.transform);
    set(outlines[i], "d", n.outline);
    set(pens[i], "d", n.pen);
    set(pens[i], "stroke-dasharray", n.dash);
  });
  root.style.setProperty("--rule-tail", String(f.rule.tail));
  root.style.setProperty("--rule-head", String(f.rule.head));
}

const INITIAL = frameAt(0);

export function OrbitSketch() {
  const rootRef = useRef<HTMLDivElement>(null);
  const maskId = `orbit-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const root = rootRef.current;
    // Reduced motion keeps the first scene, which is already rendered.
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let visible = false;
    let elapsed = 0;
    let last = -1;
    let lastFrame = 0;

    const tick = (now: number) => {
      if (last >= 0) elapsed += Math.min(now - last, 100); // no jump after a hidden tab
      last = now;
      const frame = Math.floor(elapsed / FRAME);
      if (frame !== lastFrame) {
        lastFrame = frame;
        paint(root, frameAt(frame * FRAME));
      }
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      last = -1;
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(root);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const f = INITIAL;
  const ruleVars = {
    "--rule-tail": f.rule.tail,
    "--rule-head": f.rule.head,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} className={styles.frame} style={ruleVars} aria-hidden>
      <i className={clsx(styles.rule, styles.vertical, styles.quarter)} />
      <i className={clsx(styles.rule, styles.vertical, styles.threeQuarters)} />
      <div className={styles.drawing}>
        <svg
          viewBox="0 0 960 480"
          className={styles.lines}
          fill="none"
          stroke="currentColor"
        >
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="960"
            height="480"
          >
            <rect width="960" height="480" fill="#fff" />
            <line
              x1="478.5"
              y1="0"
              x2="478.5"
              y2="480"
              stroke="#000"
              strokeWidth="6"
            />
            {f.ellipses.map((e, i) => (
              <path
                key={i}
                data-knockout
                d={e.d}
                transform={e.transform}
                pathLength={1}
                strokeDasharray={e.dash}
                opacity={e.knockout ? 1 : 0}
                stroke="#000"
                strokeWidth="6"
              />
            ))}
          </mask>

          {f.ellipses.map((e, i) => (
            <path
              key={i}
              data-ellipse
              d={e.d}
              transform={e.transform}
              pathLength={1}
              strokeDasharray={e.dash}
              opacity={e.opacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {f.segments.map((s, i) => (
            <path
              key={i}
              data-segment
              d={s.d}
              pathLength={1}
              strokeDasharray={s.dash}
              opacity={s.opacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <g mask={`url(#${maskId})`}>
            <path
              data-axis
              d="M120 239.5L840 239.5"
              pathLength={1}
              strokeDasharray={f.axis.dash}
              opacity={f.axis.opacity}
              vectorEffect="non-scaling-stroke"
            />
            {/* Arrowheads: five units long, opening at 30°. */}
            <path
              data-axis
              d="M120 239.5L125 236.6L125 242.4Z"
              fill="currentColor"
              stroke="none"
              opacity={f.axis.left}
            />
            <path
              data-axis
              d="M840 239.5L835 236.6L835 242.4Z"
              fill="currentColor"
              stroke="none"
              opacity={f.axis.right}
            />
          </g>
        </svg>
        <svg
          className={styles.note}
          viewBox={`0 0 ${NOTE_CELL * f.note.length} 24`}
          width={NOTE_CELL * f.note.length}
          height={24}
        >
          {f.note.map((n, i) => (
            <g key={i} data-glyph transform={n.transform}>
              <mask
                id={`${maskId}-note-${i}`}
                maskUnits="userSpaceOnUse"
                x={-2}
                y={-12}
                width={13}
                height={14}
              >
                <path
                  data-glyph-pen
                  className={styles.notePen}
                  d={n.pen}
                  pathLength={1}
                  strokeDasharray={n.dash}
                />
              </mask>
              <path
                data-glyph-outline
                d={n.outline}
                mask={`url(#${maskId}-note-${i})`}
              />
            </g>
          ))}
        </svg>
        <i className={clsx(styles.rule, styles.vertical, styles.eighth)} />
      </div>
      <i className={clsx(styles.rule, styles.horizontal, styles.top)} />
      <i className={clsx(styles.rule, styles.horizontal, styles.axis)} />
      <i className={clsx(styles.rule, styles.horizontal, styles.bottom)} />
    </div>
  );
}
