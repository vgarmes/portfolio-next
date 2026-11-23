"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import styles from "./wave-mark.module.css";

/**
 * A small sketch of water, drawn like the Unknown Pleasures cover: parallel
 * lines across a surface seen from a low angle, lifted and lowered by
 * ripples travelling out from the middle. Nearer lines hide the ones behind
 * them. The lines run from the top of the frame to the bottom, a little
 * closer together towards the top for perspective, and settle towards both
 * edges, so the first and last barely move.
 *
 * Clicking the water drops something in: a single shockwave ring races out
 * and fades (after linear.app/next's logo), and the ripples' origin moves
 * there, starting with a kick that settles into the usual motion. The old
 * origin stops, its last rings drifting outward and fading behind calm
 * water. Hovering presses a soft dent into the surface.
 */

export interface WaveSettings {
  /** Crests per unit of distance (1 is half the frame's width). */
  density: number;
  /** How fast the crests travel outward, in radians of phase per second. */
  speed: number;
  /** Extra height a click adds at first (0 = none, 1 = twice as tall). */
  kick: number;
  /** Extra speed a click adds at first, as a multiple of `speed`. */
  kickSpeed: number;
  /** Seconds for the kick to settle to about a third of its strength. */
  settle: number;
  /** Seconds a replaced origin takes to fade out. */
  linger: number;
  /** Height of a click's shockwave ring (0 = none). */
  shock: number;
  /** How fast the shockwave travels, in units per second. */
  shockSpeed: number;
  /** Seconds until the shockwave has faded out. */
  shockLife: number;
  /** Half-width of the shockwave ring, in units. */
  shockWidth: number;
  /** Depth of the dent under the cursor (0 = none). */
  hover: number;
  /** Radius of the dent, in units. */
  hoverRadius: number;
}

export const DEFAULT_WAVE_SETTINGS: WaveSettings = {
  density: 13,
  speed: 1.6,
  kick: 0.8,
  kickSpeed: 2,
  settle: 1.5,
  linger: 2.5,
  shock: 2.5,
  shockSpeed: 2.5,
  shockLife: 0.7,
  shockWidth: 0.25,
  hover: 0.8,
  hoverRadius: 0.5,
};

const LINES = 11;
// How quickly a ripple weakens with distance, and the distance where it has
// gone flat (1 is the frame's sides).
const FADE = 1.6;
const EDGE = 1.2;
// Ripples on water spread a little faster than their crests travel.
const SPREAD = 1.5;
// Width of the soft edge where the ripples begin or end.
const BAND = 0.15;
// At most this many origins and shockwaves at once, if someone clicks rapidly.
const MAX_SOURCES = 5;
const MAX_SHOCKS = 5;
// How quickly the dent follows the cursor and comes and goes (per second).
const HOVER_FOLLOW = 20;
const HOVER_FADE = 8;

const INK = 0.5;
const FPS = 30;
// Where the still frame for reduced motion is taken, and where the motion
// starts, in seconds.
const START = 6;

/** Where ripples come from: x across (0–1), z from far to near (0–1). */
interface Source {
  x: number;
  z: number;
  /** When it started and stopped sending out ripples, in seconds. */
  start: number;
  stop: number;
  /** The water's phase at those moments, to measure how far rings spread. */
  startPhase: number;
  stopPhase: number;
}

// The middle of the water, where the ripples start until the first click.
const REST: Source = {
  x: 0.5,
  z: 0.55,
  start: -Infinity,
  stop: Infinity,
  startPhase: 0,
  stopPhase: 0,
};

/** A ring that travels out from a click and fades. */
interface Shock {
  x: number;
  z: number;
  start: number;
}

/** The cursor's dent: eased position and how present it is (0–1). */
interface Dent {
  x: number;
  z: number;
  strength: number;
}

/** Distance on the water, with depth foreshortened like the ripples. */
const distance = (x1: number, z1: number, x2: number, z2: number) =>
  Math.hypot((x1 - x2) * 2, (z1 - z2) * 1.7);

const ramp = (v: number) => {
  const c = Math.min(1, Math.max(0, v));
  return c * c * (3 - 2 * c);
};

interface Moment {
  /** Seconds. */
  t: number;
  /** Phase of the steady motion: speed integrated over time. */
  phase: number;
  settings: WaveSettings;
}

/** How high the water stands at (x, z) because of one source. */
function lift(source: Source, x: number, z: number, now: Moment) {
  const { t, phase, settings: s } = now;
  const r = distance(x, z, source.x, source.z);

  // The kick fades exponentially after the click. Its extra speed is
  // integrated too, so the crests slow down without jumping back.
  const started = source.start > -Infinity;
  const kick = started ? Math.exp(-(t - source.start) / s.settle) : 0;
  const extraPhase = started
    ? s.kickSpeed * s.speed * s.settle * (1 - kick)
    : 0;

  // Crests and troughs travel outward and die away with distance.
  let height =
    (1 + s.kick * kick) *
    Math.cos(r * s.density - phase - extraPhase) *
    Math.exp(-r * FADE) *
    (1 - Math.min(1, r / EDGE));
  // Rings only reach as far as they have had time to spread, so the kick
  // shows as a strong ring racing out...
  if (started) {
    const reach =
      (SPREAD * (phase - source.startPhase + extraPhase)) / s.density;
    height *= ramp((reach - r) / BAND);
  }
  // ...and once the source stops, calm water follows them out as they fade.
  if (source.stop < Infinity) {
    const calm = (SPREAD * (phase - source.stopPhase)) / s.density;
    height *=
      ramp((r - calm) / BAND) * Math.max(0, 1 - (t - source.stop) / s.linger);
  }
  return height;
}

/**
 * A single smooth bump on a ring that grows at a steady speed and fades
 * linearly, with no oscillation behind it.
 */
function shockLift(shock: Shock, x: number, z: number, now: Moment) {
  const s = now.settings;
  const age = now.t - shock.start;
  const fade = 1 - age / s.shockLife;
  if (fade <= 0) return 0;
  const u =
    Math.abs(distance(x, z, shock.x, shock.z) - s.shockSpeed * age) /
    s.shockWidth;
  if (u >= 1) return 0;
  return s.shock * fade * 0.5 * (1 + Math.cos(Math.PI * u));
}

/** The cursor presses the surface down, deepest right under it. */
function dentLift(dent: Dent, x: number, z: number, now: Moment) {
  const s = now.settings;
  if (dent.strength < 0.001 || !s.hover) return 0;
  const d = distance(x, z, dent.x, dent.z) / s.hoverRadius;
  return d < 1 ? -s.hover * dent.strength * (1 - d) ** 3 : 0;
}

interface Water {
  sources: Source[];
  shocks: Shock[];
  dent: Dent;
}

function draw(canvas: HTMLCanvasElement, water: Water, now: Moment) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
  if (canvas.height !== Math.round(h * dpr))
    canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = getComputedStyle(canvas).color;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Far (top) to near (bottom), so each line can cover the ones behind it.
  for (let i = 0; i < LINES; i++) {
    const z = (i + 0.5) / LINES; // 0 far, 1 near
    const base = h * z ** 1.15;
    // Nearer swells look taller; lines settle towards the top and bottom.
    const amp = h * (0.05 + 0.1 * z) * Math.sin(Math.PI * z) ** 0.8;
    const points: [number, number][] = [];
    for (let x = 0; x <= w; x += 1) {
      const gx = x / w;
      let height = dentLift(water.dent, gx, z, now);
      for (const source of water.sources) height += lift(source, gx, z, now);
      for (const shock of water.shocks) height += shockLift(shock, gx, z, now);
      points.push([x, base - amp * height]);
    }

    // Hide whatever is behind this line...
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // ...then draw it.
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = INK;
    ctx.beginPath();
    points.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function WaveMark({
  className,
  settings,
}: {
  className?: string;
  /** Overrides for tuning; changes apply live. */
  settings?: Partial<WaveSettings>;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<WaveSettings>(DEFAULT_WAVE_SETTINGS);

  useEffect(() => {
    settingsRef.current = { ...DEFAULT_WAVE_SETTINGS, ...settings };
  }, [settings]);

  useEffect(() => {
    const frame = frameRef.current;
    const canvas = canvasRef.current;
    if (!frame || !canvas) return;

    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let sources: Source[] = [REST];
    let shocks: Shock[] = [];
    const dent: Dent = { x: 0.5, z: 0.5, strength: 0 };
    // Where the cursor is, and whether it is over the water.
    const pointer = { x: 0.5, z: 0.5, over: false };
    let t = START;
    let phase = START * settingsRef.current.speed;
    const redraw = () => {
      const s = settingsRef.current;
      // Forget origins and shockwaves that have faded out, so they cost nothing.
      if (sources.length > 1)
        sources = sources.filter((source) => t - source.stop < s.linger);
      if (shocks.length)
        shocks = shocks.filter((shock) => t - shock.start < s.shockLife);
      draw(canvas, { sources, shocks, dent }, { t, phase, settings: s });
    };

    // The water under the pointer. Lines sit at h·z^1.15, so the height is
    // turned back into depth the same way.
    const locate = (event: PointerEvent) => {
      const box = frame.getBoundingClientRect();
      const x = Math.min(
        1,
        Math.max(0, (event.clientX - box.left) / box.width),
      );
      const y = Math.min(
        1,
        Math.max(0, (event.clientY - box.top) / box.height),
      );
      return { x, z: y ** (1 / 1.15) };
    };

    // A click drops something in: a shockwave, and the origin moves there.
    const click = (event: PointerEvent) => {
      const { x, z } = locate(event);
      if (reducedMotion) {
        // No kick, spreading or fading: the still water centres on the click.
        sources = [{ ...REST, x, z }];
        redraw();
        return;
      }
      sources = [
        ...sources
          .map((s) =>
            s.stop < Infinity ? s : { ...s, stop: t, stopPhase: phase },
          )
          .slice(-(MAX_SOURCES - 1)),
        { x, z, start: t, stop: Infinity, startPhase: phase, stopPhase: 0 },
      ];
      shocks = [...shocks.slice(-(MAX_SHOCKS - 1)), { x, z, start: t }];
    };
    frame.addEventListener("pointerdown", click);

    // Hovering (mouse only; a touch has no hover) dents the surface.
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reducedMotion) return;
      Object.assign(pointer, locate(event), { over: true });
      // Start the dent where the cursor came in, not where it last left.
      if (dent.strength < 0.001) Object.assign(dent, locate(event));
    };
    const leave = () => {
      pointer.over = false;
    };
    frame.addEventListener("pointermove", move);
    frame.addEventListener("pointerleave", leave);
    const removeListeners = () => {
      frame.removeEventListener("pointerdown", click);
      frame.removeEventListener("pointermove", move);
      frame.removeEventListener("pointerleave", leave);
    };

    // Reduced motion: one still frame, redrawn only if the size, theme or
    // origin changes.
    if (reducedMotion) {
      redraw();
      const ro = new ResizeObserver(redraw);
      ro.observe(canvas);
      const mo = new MutationObserver(redraw);
      mo.observe(document.documentElement, { attributeFilter: ["class"] });
      return () => {
        removeListeners();
        ro.disconnect();
        mo.disconnect();
      };
    }

    let raf = 0;
    let visible = false;
    let last = -1;
    let lastFrame = -1;

    const tick = (now: number) => {
      // No jump after a hidden tab.
      const dt = last >= 0 ? Math.min(now - last, 100) / 1000 : 0;
      last = now;
      t += dt;
      phase += settingsRef.current.speed * dt;

      // The dent glides after the cursor and eases in and out.
      const follow = 1 - Math.exp(-HOVER_FOLLOW * dt);
      dent.x += (pointer.x - dent.x) * follow;
      dent.z += (pointer.z - dent.z) * follow;
      dent.strength +=
        ((pointer.over ? 1 : 0) - dent.strength) *
        (1 - Math.exp(-HOVER_FADE * dt));

      // While a shockwave or the dent is moving, draw every frame so they
      // stay smooth; otherwise the water's 30 fps is enough.
      const lively = shocks.length > 0 || dent.strength > 0.001;
      const frameNo = Math.floor(t * FPS);
      if (lively || frameNo !== lastFrame) {
        lastFrame = frameNo;
        redraw();
      }
      raf = requestAnimationFrame(tick);
    };

    // Draw once straight away so it never shows empty, then run while visible.
    redraw();
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      last = -1;
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => {
      removeListeners();
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={frameRef} className={clsx(styles.frame, className)} aria-hidden>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
