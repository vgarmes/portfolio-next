/**
 * A fingerprint drawn from a string, like a pen plotter would: one pen, no
 * fills, ridges that never cross.
 *
 * 1. The text is hashed (cyrb128, 128 bits). Every input, one letter or a
 *    paragraph, becomes the same 32 hex characters, and changing one letter
 *    changes the whole hash.
 * 2. The first bytes of the hash pick the features you see at a glance:
 *    pattern (arch, loop, whorl), which side a loop opens to, and the tilt.
 *    The rest seed a random generator (sfc32) for every finer choice.
 * 3. The ridge direction at every point comes from the zero-pole model
 *    (Sherlock & Monro): cores and deltas, the singular points of a real
 *    print, each bend the field by half a turn around them.
 * 4. Ridges are traced along that field as evenly spaced streamlines (Jobard
 *    & Lefer): a line stops before it crowds one already drawn, and new
 *    lines start from the gaps beside existing ones.
 * 5. Where a ridge stops in open paper it is a ridge ending; sometimes it is
 *    joined to its neighbour instead, which makes a fork. These are the
 *    minutiae real prints are matched by.
 *
 * The "avatar" frame draws the same print as a clean circle around its core,
 * with fewer, thicker ridges and a hue from the hash, so it still reads at
 * 24px. Avatars use the fixed AVATAR_SETTINGS so a name's avatar never
 * changes while the sliders are tuned.
 */

export type Pattern = "arch" | "loop" | "whorl";

export interface FingerprintSettings {
  /** Distance between neighbouring ridges, in viewBox units (200 wide). */
  spacing: number;
  /** How much the ridge direction wanders (0 = smooth). */
  turbulence: number;
  /** Chance that a ridge ending is joined to its neighbour as a fork. */
  forks: number;
  /** How often a ridge breaks off on its own (0 = never). */
  breaks: number;
  /** Force a pattern instead of the one the hash picks. */
  pattern: Pattern | "auto";
}

export const DEFAULT_FINGERPRINT_SETTINGS: FingerprintSettings = {
  spacing: 4,
  turbulence: 0.3,
  forks: 0.5,
  breaks: 0.35,
  pattern: "auto",
};

export interface Point {
  x: number;
  y: number;
}

export interface Minutia extends Point {
  type: "ending" | "fork";
}

export interface SingularPoint extends Point {
  type: "core" | "delta";
}

export type Frame = "print" | "avatar";

/**
 * Version 1 of the avatar look. Never change these values: every avatar
 * would change with them. Add a new version instead.
 */
export const AVATAR_SETTINGS: FingerprintSettings = {
  spacing: 10,
  turbulence: 0.3,
  forks: 0.5,
  breaks: 0.2,
  pattern: "auto",
};

/** Radius of the avatar's circle, in viewBox units. */
export const AVATAR_RADIUS = 58;

export interface Fingerprint {
  /** The hash as 32 hex characters. */
  hash: string;
  /** Hue for colouring, 0–359, from hex characters 4–5 of the hash. */
  hue: number;
  /** viewBox for the frame: the whole print, or the avatar's square. */
  viewBox: string;
  /** Centre of the avatar's circle (the pattern's core). */
  focus: Point;
  pattern: Pattern;
  /** Tilt of the whole print, in degrees. */
  tilt: number;
  /** One SVG path per ridge, in the order a plotter would draw them. */
  ridges: string[];
  minutiae: Minutia[];
  singular: SingularPoint[];
}

export const VIEW_WIDTH = 200;
export const VIEW_HEIGHT = 250;

const CX = VIEW_WIDTH / 2;
const CY = VIEW_HEIGHT / 2;
/** Half-width and half-height of the fingertip oval. */
const RX = 80;
const RY = 108;

/* ------------------------------------------------------------------------ */
/* Hash and random numbers                                                   */
/* ------------------------------------------------------------------------ */

/** cyrb128: a fast, well-mixed 128-bit hash of a string (not cryptographic). */
export function cyrb128(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** sfc32: a small seeded generator returning numbers in [0, 1). */
function sfc32(a: number, b: number, c: number, d: number) {
  return () => {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Smooth 2D value noise in [-1, 1], seeded. */
function makeNoise(seed: number) {
  const lattice = (ix: number, iy: number) => {
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (((h ^ (h >>> 16)) >>> 0) / 4294967296) * 2 - 1;
  };
  const fade = (t: number) => t * t * (3 - 2 * t);
  const octave = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = fade(x - ix);
    const fy = fade(y - iy);
    const a = lattice(ix, iy);
    const b = lattice(ix + 1, iy);
    const c = lattice(ix, iy + 1);
    const d = lattice(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  return (x: number, y: number) =>
    octave(x, y) * 0.7 + octave(x * 2.3 + 17.1, y * 2.3 - 5.3) * 0.3;
}

/* ------------------------------------------------------------------------ */
/* Generation                                                                */
/* ------------------------------------------------------------------------ */

const PATTERNS: Pattern[] = ["arch", "loop", "loop", "whorl"];

/** Keeps the text as typed, apart from surrounding spaces and Unicode form. */
export function normalizeSeed(text: string) {
  return text.trim().normalize("NFC");
}

/** Names and emails ignore case, so "Ana" and "ana " share an avatar. */
export function avatarSeed(text: string) {
  return normalizeSeed(text).toLowerCase();
}

/** The hue alone, with integer maths only, so server and browser agree. */
export function hashHue(seed: string) {
  return hueOf(cyrb128(seed)[0]);
}

const hueOf = (word: number) =>
  Math.round((((word >>> 12) & 0x1ff) / 512) * 360);

export function generateFingerprint(
  text: string,
  settings: FingerprintSettings = DEFAULT_FINGERPRINT_SETTINGS,
  frame: Frame = "print",
): Fingerprint {
  const avatar = frame === "avatar";
  const words = cyrb128(avatar ? avatarSeed(text) : normalizeSeed(text));
  const hash = words.map((w) => w.toString(16).padStart(8, "0")).join("");

  // Coarse, visible features come from the top 11 bits, so the first three
  // hex characters of the hash: 2 bits of pattern, 1 of side, 8 of tilt.
  const pattern =
    settings.pattern === "auto" ? PATTERNS[words[0] >>> 30] : settings.pattern;
  const side = (words[0] >>> 29) & 1 ? 1 : -1;
  const tiltDeg = ((((words[0] >>> 21) & 0xff) / 255) * 2 - 1) * 14;
  const tilt = (tiltDeg * Math.PI) / 180;
  // The next 9 bits (the rest of hex characters 4–5) pick the hue.
  const hue = hueOf(words[0]);

  // Everything finer comes from the generator.
  const rng = sfc32(words[0], words[1], words[2], words[3]);
  for (let i = 0; i < 12; i++) rng();
  const between = (min: number, max: number) => min + rng() * (max - min);
  const noise = makeNoise(words[1] ^ words[3]);
  const edgeNoise = makeNoise(words[2]);

  /* Singular points, in local coordinates (centre at 0,0, y down). -------- */

  const cores: Point[] = [];
  const deltas: Point[] = [];
  if (pattern === "loop") {
    const core = { x: between(-10, 10) - side * 8, y: between(-30, -8) };
    cores.push(core);
    deltas.push({
      x: core.x + side * between(38, 58),
      y: core.y + between(38, 56),
    });
  } else if (pattern === "whorl") {
    const top = { x: between(-8, 8), y: between(-28, -14) };
    const spiral = between(-7, 7);
    cores.push(top, { x: top.x + spiral, y: top.y + between(7, 16) });
    deltas.push(
      { x: between(-62, -44), y: between(24, 48) },
      { x: between(44, 62), y: between(24, 48) },
    );
  }
  // Arches have no singular points; their hump is drawn by a separate term.
  const archHeight = pattern === "arch" ? between(0.7, 1.6) : 0;
  const archWidth = between(26, 44);
  const archCentre = between(-12, 12);
  const archLevel = between(-15, 15);

  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const toLocal = (x: number, y: number): Point => {
    const dx = x - CX;
    const dy = y - CY;
    return { x: dx * cosT + dy * sinT, y: -dx * sinT + dy * cosT };
  };
  const toWorld = (p: Point): Point => ({
    x: CX + p.x * cosT - p.y * sinT,
    y: CY + p.x * sinT + p.y * cosT,
  });

  /** Ridge orientation at a point, in radians (meaningful modulo π). */
  const orientation = (x: number, y: number) => {
    const p = toLocal(x, y);
    // Zero-pole model: cores add half their angle, deltas subtract it.
    let theta = 0;
    for (const c of cores) theta += 0.5 * Math.atan2(p.y - c.y, p.x - c.x);
    for (const d of deltas) theta -= 0.5 * Math.atan2(p.y - d.y, p.x - d.x);

    // The top of a fingertip: ridges bow to follow the rounded edge.
    const above = Math.min(Math.max((-p.y - 5) / RY, 0), 1);
    let slope = ((p.x * RY) / (RX * RX)) * above * 1.6;

    // An arch's hump in the middle, flattening towards the crease.
    if (archHeight > 0) {
      const u = (p.x - archCentre) / archWidth;
      const level = Math.exp(-(((p.y - archLevel) / 70) ** 2));
      slope += 2 * archHeight * u * Math.exp(-u * u) * level;
    }
    theta += Math.atan(slope);

    theta += settings.turbulence * 0.55 * noise(p.x / 38, p.y / 38);
    return theta + tilt;
  };

  // The avatar centres on the core (between the cores of a whorl), a little
  // below it so the recurving ridges fill the circle.
  const focusLocal =
    cores.length > 0
      ? {
          x: cores.reduce((sum, c) => sum + c.x, 0) / cores.length,
          y: cores.reduce((sum, c) => sum + c.y, 0) / cores.length + 8,
        }
      : { x: archCentre, y: archLevel };
  const focus = toWorld(focusLocal);
  // Ridges run a spacing past the circle, which then clips them cleanly.
  const avatarReach = AVATAR_RADIUS + settings.spacing;

  /** How far inside the frame a point is: below 1 is inside. */
  const outline = (x: number, y: number) => {
    if (avatar) return Math.hypot(x - focus.x, y - focus.y) / avatarReach;
    const p = toLocal(x, y);
    // A fingertip narrows a little towards the crease.
    const rx = RX * (p.y > 0 ? 1 - 0.1 * (p.y / RY) : 1);
    const r = Math.hypot(p.x / rx, p.y / RY);
    const angle = Math.atan2(p.y, p.x);
    const wobble =
      0.035 * edgeNoise(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2);
    return r / (1 + wobble);
  };

  /* Streamlines ------------------------------------------------------------ */

  const sep = settings.spacing;
  const test = sep * 0.55; // tracing stops this close to another ridge
  const step = Math.max(0.6, sep * 0.2);
  const maxTurn = 0.45;
  const breakChance = settings.breaks * 0.0025;

  // Spatial grid of every traced point, for fast "is anything near" checks.
  // It reaches MARGIN past the view, where an avatar's circle can go.
  const MARGIN = 80;
  const cell = sep;
  const cols = Math.ceil((VIEW_WIDTH + 2 * MARGIN) / cell) + 1;
  const rows = Math.ceil((VIEW_HEIGHT + 2 * MARGIN) / cell) + 1;
  const grid: { x: number; y: number; line: number; s: number }[][] =
    Array.from({ length: cols * rows }, () => []);
  const column = (x: number) => Math.floor((x + MARGIN) / cell);
  const row = (y: number) => Math.floor((y + MARGIN) / cell);
  const cellOf = (x: number, y: number) =>
    Math.min(cols - 1, Math.max(0, column(x))) +
    Math.min(rows - 1, Math.max(0, row(y))) * cols;

  /** Is any point within `radius`, ignoring this line's own nearby stretch? */
  const crowded = (x: number, y: number, radius: number, line = -1, s = 0) => {
    const cx = column(x);
    const cy = row(y);
    const reach = Math.ceil(radius / cell);
    for (let j = cy - reach; j <= cy + reach; j++) {
      if (j < 0 || j >= rows) continue;
      for (let i = cx - reach; i <= cx + reach; i++) {
        if (i < 0 || i >= cols) continue;
        for (const q of grid[i + j * cols]) {
          if (q.line === line && Math.abs(q.s - s) < sep * 3) continue;
          if ((q.x - x) ** 2 + (q.y - y) ** 2 < radius * radius) return true;
        }
      }
    }
    return false;
  };

  const nearestOther = (x: number, y: number, radius: number, line: number) => {
    let best: Point | null = null;
    let bestDist = radius * radius;
    const cx = column(x);
    const cy = row(y);
    const reach = Math.ceil(radius / cell);
    for (let j = cy - reach; j <= cy + reach; j++) {
      if (j < 0 || j >= rows) continue;
      for (let i = cx - reach; i <= cx + reach; i++) {
        if (i < 0 || i >= cols) continue;
        for (const q of grid[i + j * cols]) {
          if (q.line === line) continue;
          const d = (q.x - x) ** 2 + (q.y - y) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = q;
          }
        }
      }
    }
    return best;
  };

  type Stop = "edge" | "crowded" | "turn" | "break" | "length";
  interface Ridge {
    points: Point[];
    stops: [Stop, Stop];
  }

  const unitAt = (x: number, y: number, like: Point) => {
    const t = orientation(x, y);
    let vx = Math.cos(t);
    let vy = Math.sin(t);
    // Orientation has no sign; keep heading the way we were going.
    if (vx * like.x + vy * like.y < 0) {
      vx = -vx;
      vy = -vy;
    }
    return { x: vx, y: vy };
  };

  const trace = (
    start: Point,
    heading: Point,
    line: number,
    direction: 1 | -1,
    inset: number,
  ): { points: Point[]; stop: Stop } => {
    const points: Point[] = [];
    let p = start;
    let v = heading;
    let s = 0;
    for (let n = 0; n < 1600; n++) {
      // Midpoint (RK2) step along the field.
      const v1 = unitAt(p.x, p.y, v);
      const mid = { x: p.x + (v1.x * step) / 2, y: p.y + (v1.y * step) / 2 };
      const v2 = unitAt(mid.x, mid.y, v1);
      const next = { x: p.x + v2.x * step, y: p.y + v2.y * step };
      s += step * direction;

      if (outline(next.x, next.y) > 1 - inset) return { points, stop: "edge" };
      if (n > 0 && Math.acos(Math.min(1, v.x * v2.x + v.y * v2.y)) > maxTurn)
        return { points, stop: "turn" };
      if (crowded(next.x, next.y, test, line, s))
        return { points, stop: "crowded" };
      if (n > sep * 2 && rng() < breakChance) return { points, stop: "break" };

      points.push(next);
      grid[cellOf(next.x, next.y)].push({ ...next, line, s });
      p = next;
      v = v2;
    }
    return { points, stop: "length" };
  };

  const ridges: Ridge[] = [];
  const queue: Point[] = [];

  const tryRidge = (seed: Point) => {
    if (outline(seed.x, seed.y) > 0.97) return;
    if (crowded(seed.x, seed.y, sep)) return;
    const line = ridges.length;
    const t = orientation(seed.x, seed.y);
    const heading = { x: Math.cos(t), y: Math.sin(t) };
    // Each ridge reaches the edge at its own depth, so the edge looks inked.
    const inset = avatar ? 0 : rng() * 0.07;
    grid[cellOf(seed.x, seed.y)].push({ ...seed, line, s: 0 });
    const ahead = trace(seed, heading, line, 1, inset);
    const behind = trace(
      seed,
      { x: -heading.x, y: -heading.y },
      line,
      -1,
      inset,
    );
    const points = [...behind.points.reverse(), seed, ...ahead.points];
    ridges.push({ points, stops: [behind.stop, ahead.stop] });

    // Queue new seeds one spacing away on both sides.
    for (let i = 0; i < points.length; i += 3) {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = -(b.y - a.y) / len;
      const ny = (b.x - a.x) / len;
      queue.push(
        { x: points[i].x + nx * sep, y: points[i].y + ny * sep },
        { x: points[i].x - nx * sep, y: points[i].y - ny * sep },
      );
    }
  };

  let head = 0;
  const drain = () => {
    while (head < queue.length) tryRidge(queue[head++]);
  };

  // Start near the centre of the pattern, and spread out from there.
  const first = avatar
    ? focus
    : toWorld(cores[0] ?? { x: archCentre, y: archLevel });
  tryRidge({ x: first.x + between(-3, 3), y: first.y + sep * 1.5 });
  drain();

  // Fill whatever the spreading missed (around cores and deltas).
  const fill: Point[] = [];
  const area = avatar
    ? {
        x0: focus.x - avatarReach,
        y0: focus.y - avatarReach,
        x1: focus.x + avatarReach,
        y1: focus.y + avatarReach,
      }
    : { x0: 0, y0: 0, x1: VIEW_WIDTH, y1: VIEW_HEIGHT };
  for (let y = area.y0 + sep / 2; y < area.y1; y += sep / 2)
    for (let x = area.x0 + sep / 2; x < area.x1; x += sep / 2)
      fill.push({ x, y });
  for (let i = fill.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [fill[i], fill[j]] = [fill[j], fill[i]];
  }
  for (const seed of fill) {
    tryRidge(seed);
    drain();
  }

  /* Minutiae ---------------------------------------------------------------- */

  const minutiae: Minutia[] = [];
  const kept: Ridge[] = [];
  ridges.forEach((ridge, line) => {
    if (ridge.points.length * step <= sep * 0.8) return;
    kept.push(ridge);
    ([0, 1] as const).forEach((end) => {
      const stop = ridge.stops[end];
      if (stop !== "crowded" && stop !== "break") return;
      const tip =
        end === 0 ? ridge.points[0] : ridge.points[ridge.points.length - 1];
      // Too close to a core or delta: that is the pattern's centre, not a minutia.
      const nearSingular = [...cores, ...deltas].some((c) => {
        const w = toWorld(c);
        return Math.hypot(w.x - tip.x, w.y - tip.y) < sep * 2.5;
      });
      if (nearSingular || outline(tip.x, tip.y) > 0.9) return;
      const found = nearestOther(tip.x, tip.y, sep * 1.3, line);
      const fork = found !== null && rng() < settings.forks;
      const mark = fork ? { x: found.x, y: found.y } : tip;
      if (fork) {
        if (end === 0) ridge.points.unshift(mark);
        else ridge.points.push(mark);
      }
      // Two ridges often stop at the same pinch; mark it once.
      const marked = minutiae.some(
        (m) => Math.hypot(m.x - mark.x, m.y - mark.y) < sep * 1.2,
      );
      if (!marked) minutiae.push({ ...mark, type: fork ? "fork" : "ending" });
    });
  });

  const toPath = (points: Point[]) => {
    let d = "";
    // Every other point is plenty for a smooth line.
    for (let i = 0; i < points.length; i += 2) {
      const p = points[i];
      d += `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    if ((points.length - 1) % 2 !== 0)
      d += `L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
  };

  const viewBox = avatar
    ? [
        focus.x - AVATAR_RADIUS,
        focus.y - AVATAR_RADIUS,
        AVATAR_RADIUS * 2,
        AVATAR_RADIUS * 2,
      ]
        .map((n) => n.toFixed(1))
        .join(" ")
    : `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;

  return {
    hash,
    hue,
    viewBox,
    focus,
    pattern,
    tilt: Math.round(tiltDeg),
    ridges: kept.map((r) => toPath(r.points)),
    minutiae,
    singular: [
      ...cores.map((c) => ({ ...toWorld(c), type: "core" as const })),
      ...deltas.map((d) => ({ ...toWorld(d), type: "delta" as const })),
    ],
  };
}
