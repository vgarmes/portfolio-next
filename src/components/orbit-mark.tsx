"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import styles from "./orbit-mark.module.css";

/**
 * A small square cousin of the Paper & Pencil sketch (demos/orbit-sketch):
 * half of its 2:1 frame, drawn with the same pen, a little slower. It cycles
 * through a circle folding sideways, a set of nested circles and two
 * overlapping circles, erasing and redrawing between them.
 *
 * Every shape is an SVG path with pathLength=1, so the visible stretch of a
 * stroke between the pen's tail and head is `stroke-dasharray: 0 <tail> <head - tail> 2`.
 */

// [cx, cy, rx, ry, opacity, rotation°]
type Ellipse = readonly [number, number, number, number, number, number];
// [x1, y1, x2, y2, opacity]
type Segment = readonly [number, number, number, number, number];
type Scene = {
  ellipses: readonly Ellipse[];
  segments: readonly Segment[];
};

const SIZE = 480;
const CENTER = 240;

// Shapes a scene doesn't use sit in their slot with no size and no ink.
const NONE: Ellipse = [240, 240, 0, 0, 0, 0];
const NO_LINE: Segment = [0, 0, 0, 0, 0];

// The horizontal axis is a permanent rule in the CSS, so no scene draws it.

const DRAWINGS: readonly Scene[] = [
  // Fold: the circle turns sideways around its vertical axis.
  {
    ellipses: [
      [240, 240, 230, 230, 0.55, 0],
      [240, 240, 115, 230, 0.55, 0],
      [240, 240, 57.5, 230, 0.55, 0],
    ],
    segments: [
      [0, 480, 480, 0, 0.3],
      [239.5, 0, 239.5, 480, 0.3],
    ],
  },
  // Nested: circles shrinking towards the left, all touching there.
  {
    ellipses: [
      [240, 240, 230, 230, 0.55, 0],
      [182.5, 240, 172.5, 172.5, 0.55, 0],
      [125, 240, 115, 115, 0.55, 0],
      [67.5, 240, 57.5, 57.5, 0.55, 0],
    ],
    segments: [NO_LINE, NO_LINE],
  },
  // Vesica: two equal circles, each through the other's centre (on the
  // axis), with the line through their crossings.
  {
    ellipses: [
      [163.5, 240, 153, 153, 0.55, 0],
      [316.5, 240, 153, 153, 0.55, 0],
    ],
    segments: [NO_LINE, [239.5, 0, 239.5, 480, 0.3]],
  },
];

// Every scene gets the same slots, so shapes can carry over between them.
const SLOTS = Math.max(...DRAWINGS.map((scene) => scene.ellipses.length));
const SCENES: readonly Scene[] = DRAWINGS.map((scene) => ({
  ...scene,
  ellipses: Array.from({ length: SLOTS }, (_, i) => scene.ellipses[i] ?? NONE),
}));

// Timing (ms). The pen follows Orbit's rules, but on a 64px drawing a line
// eased out the way Orbit's are would pop in, so here every stroke is traced
// at an even pace with a soft start and end, and given more time.
const FRAME = 1000 / 24; // stepped, so it feels drawn by hand
const HOLD_MS = 3500;
const ERASE_MS = 1500;
const ERASE_STAGGER_MS = 1200;
const DRAW_AT = ERASE_STAGGER_MS + ERASE_MS; // everything is erased by now
const DRAW_MS = 2400;
const DRAW_STAGGER_MS = 1800;
const SCENE_MS = HOLD_MS + DRAW_AT + DRAW_STAGGER_MS + DRAW_MS;

// On arrival the square starts empty and the pen draws the first scene, after
// a short pause so it doesn't start before the page has settled.
const INTRO_DELAY_MS = 400;
const INTRO_MS = INTRO_DELAY_MS + DRAW_STAGGER_MS + DRAW_MS;
const BLANK: Scene = {
  ellipses: SCENES[0].ellipses.map(() => NONE),
  segments: SCENES[0].segments.map(() => NO_LINE),
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Sine ease-in-out: the pen sets down gently and lifts off gently. */
const ease = (t: number, start: number, length: number) =>
  (1 - Math.cos(Math.PI * clamp01((t - start) / length))) / 2;
const same = (a: readonly number[], b: readonly number[], skip = -1) =>
  a.every((v, i) => i === skip || v === b[i]);

type Pen = { opacity: number; tail: number; head: number };

/**
 * Where the pen is for one shape (opacity at index 4) moving between scenes.
 * `eraseAt` and `drawAt` are its turn, in ms, among the shapes being erased
 * and drawn.
 */
function pen<T extends readonly number[]>(
  from: T,
  to: T,
  eraseAt: number,
  drawAt: number,
  g: number,
): { shape: T; pen: Pen } {
  const wasOn = from[4] > 0;
  const isOn = to[4] > 0;
  if (same(from, to))
    return { shape: to, pen: { opacity: to[4], tail: 0, head: 1 } };
  if (isOn && g >= DRAW_AT + drawAt)
    return {
      shape: to,
      pen: {
        opacity: to[4],
        tail: 0,
        head: ease(g, DRAW_AT + drawAt, DRAW_MS),
      },
    };
  if (wasOn)
    return {
      shape: from,
      pen: { opacity: from[4], tail: ease(g, eraseAt, ERASE_MS), head: 1 },
    };
  return { shape: from, pen: { opacity: 0, tail: 0, head: 0 } };
}

/**
 * The pen takes the shapes one at a time, left to right (then in slot order,
 * so shapes sharing a centre still go one after another), spread over
 * `spread`. Returns each shape's turn, in ms.
 */
function turns(
  shapes: readonly { x: number; moving: boolean }[],
  spread: number,
): readonly number[] {
  const order = shapes
    .map((shape, i) => ({ ...shape, i }))
    .filter((shape) => shape.moving)
    .sort((a, b) => a.x - b.x || a.i - b.i);
  const step = order.length > 1 ? spread / (order.length - 1) : 0;
  const at = shapes.map(() => 0);
  order.forEach((shape, rank) => (at[shape.i] = rank * step));
  return at;
}

/**
 * Upright ellipses start on the side facing the centre and go clockwise;
 * tilted ones start on their left and go anticlockwise.
 */
function ellipsePath([cx, cy, rx, ry, , rotation]: Ellipse) {
  const start = rotation || cx > CENTER ? -1 : 1;
  const sweep = rotation ? 0 : 1;
  const a = `${cx + start * rx} ${cy}`;
  const b = `${cx - start * rx} ${cy}`;
  return `M${a}A${rx} ${ry} 0 1 ${sweep} ${b}A${rx} ${ry} 0 1 ${sweep} ${a}`;
}

const dash = ({ tail, head }: Pen) => `0 ${tail} ${Math.max(0, head - tail)} 2`;

/**
 * Everything needed to paint one moment of the animation: the intro, then
 * each scene holding and changing into the next.
 */
function frameAt(elapsed: number) {
  if (elapsed < INTRO_MS)
    return transition(BLANK, SCENES[0], DRAW_AT + elapsed - INTRO_DELAY_MS);
  const t = elapsed - INTRO_MS;
  const index = Math.floor(t / SCENE_MS) % SCENES.length;
  return transition(
    SCENES[index],
    SCENES[(index + 1) % SCENES.length],
    (t % SCENE_MS) - HOLD_MS,
  );
}

/** One moment of the change from one scene to the next, `g` ms into it. */
function transition(from: Scene, to: Scene, g: number) {
  // Ellipses and segments share one pen, so they take turns together.
  const pairs = [
    ...from.ellipses.map((a, i) => [a, to.ellipses[i]] as const),
    ...from.segments.map((a, i) => [a, to.segments[i]] as const),
  ];
  const x = (shape: readonly number[], i: number) =>
    i < from.ellipses.length ? shape[0] : (shape[0] + shape[2]) / 2;
  const erase = turns(
    pairs.map(([a, b], i) => ({ x: x(a, i), moving: a[4] > 0 && !same(a, b) })),
    ERASE_STAGGER_MS,
  );
  const draw = turns(
    pairs.map(([a, b], i) => ({ x: x(b, i), moving: b[4] > 0 && !same(a, b) })),
    DRAW_STAGGER_MS,
  );

  const ellipses = from.ellipses.map((a, i) => {
    const { shape, pen: p } = pen(a, to.ellipses[i], erase[i], draw[i], g);
    return {
      d: ellipsePath(shape),
      transform: `rotate(${shape[5]} ${shape[0]} ${shape[1]})`,
      dash: dash(p),
      opacity: p.opacity,
    };
  });

  const offset = from.ellipses.length;
  const segments = from.segments.map((a, i) => {
    const { shape, pen: p } = pen(
      a,
      to.segments[i],
      erase[offset + i],
      draw[offset + i],
      g,
    );
    return {
      d: `M${shape[0]} ${shape[1]}L${shape[2]} ${shape[3]}`,
      dash: dash(p),
      opacity: p.opacity,
    };
  });

  return { ellipses, segments };
}

type Frame = ReturnType<typeof transition>;

function set(el: Element | null | undefined, name: string, value: string) {
  if (el && el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function paint(root: Element, f: Frame) {
  const q = (s: string) => [...root.querySelectorAll(s)];
  const ellipses = q("[data-ellipse]");
  f.ellipses.forEach((e, i) => {
    set(ellipses[i], "d", e.d);
    set(ellipses[i], "transform", e.transform);
    set(ellipses[i], "stroke-dasharray", e.dash);
    set(ellipses[i], "opacity", String(e.opacity));
  });
  const segments = q("[data-segment]");
  f.segments.forEach((s, i) => {
    set(segments[i], "d", s.d);
    set(segments[i], "stroke-dasharray", s.dash);
    set(segments[i], "opacity", String(s.opacity));
  });
}

const INITIAL = frameAt(0);

export function OrbitMark({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Reduced motion skips the intro and shows the first scene, drawn.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      paint(root, frameAt(INTRO_MS));
      return;
    }

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

  return (
    <div ref={rootRef} className={clsx(styles.frame, className)} aria-hidden>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.lines}
        fill="none"
        stroke="currentColor"
      >
        <g>
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
        </g>
      </svg>
      <i className={clsx(styles.rule, styles.horizontal, styles.top)} />
      <i className={clsx(styles.rule, styles.horizontal, styles.axis)} />
      <i className={clsx(styles.rule, styles.horizontal, styles.bottom)} />
      <i className={clsx(styles.rule, styles.vertical, styles.left)} />
      <i className={clsx(styles.rule, styles.vertical, styles.right)} />
    </div>
  );
}
