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
 * It's a pure function of time, so it runs indefinitely without a seam.
 */

const LINES = 11;
// How quickly a ripple weakens with distance, and the distance where it has
// gone flat (1 is the frame's sides).
const FADE = 1.6;
const EDGE = 1.2;
// Ripple shape: crests per unit of distance and speed outward.
const WAVENUMBER = 13;
const SPEED = 1.6;

const INK = 0.5;
const FPS = 30;
// Where the still frame for reduced motion is taken, and where the motion
// starts, in seconds.
const START = 6;

function draw(canvas: HTMLCanvasElement, t: number) {
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
      const gx = (x / w - 0.5) * 2;
      const gz = (z - 0.55) * 1.7;
      const r = Math.hypot(gx, gz);
      // Crests and troughs travel outward from the middle and die away with
      // distance; the surface rises and falls.
      const lift =
        Math.cos(r * WAVENUMBER - t * SPEED) *
        Math.exp(-r * FADE) *
        (1 - Math.min(1, r / EDGE));
      points.push([x, base - amp * lift]);
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

export function WaveMark({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reduced motion: one still frame, redrawn only if the size or theme changes.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const still = () => draw(canvas, START);
      still();
      const ro = new ResizeObserver(still);
      ro.observe(canvas);
      const mo = new MutationObserver(still);
      mo.observe(document.documentElement, { attributeFilter: ["class"] });
      return () => {
        ro.disconnect();
        mo.disconnect();
      };
    }

    let raf = 0;
    let visible = false;
    let elapsed = START * 1000;
    let last = -1;
    let lastFrame = -1;

    const tick = (now: number) => {
      if (last >= 0) elapsed += Math.min(now - last, 100); // no jump after a hidden tab
      last = now;
      const frame = Math.floor(elapsed / (1000 / FPS));
      if (frame !== lastFrame) {
        lastFrame = frame;
        draw(canvas, elapsed / 1000);
      }
      raf = requestAnimationFrame(tick);
    };

    // Draw once straight away so it never shows empty, then run while visible.
    draw(canvas, elapsed / 1000);
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting === visible) return;
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      last = -1;
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={clsx(styles.frame, className)} aria-hidden>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
