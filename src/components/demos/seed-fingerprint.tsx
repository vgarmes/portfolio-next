"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_FINGERPRINT_SETTINGS,
  generateFingerprint,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  type FingerprintSettings,
  type Pattern,
  avatarSeed,
  hashHue,
} from "@/lib/fingerprint";
import { avatarColours, FingerprintAvatar } from "../fingerprint-avatar";
import { Demo } from "../demo";
import styles from "./seed-fingerprint.module.css";

/**
 * Type anything and get its fingerprint. The same text always draws the
 * same print; one changed letter draws a different one. Sliders tune the
 * drawing so we can find the balance before writing the post.
 */

type NumberKey = Exclude<keyof FingerprintSettings, "pattern">;

const CONTROLS: {
  key: NumberKey;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "spacing", label: "Ridge spacing", min: 3, max: 7, step: 0.1 },
  { key: "turbulence", label: "Turbulence", min: 0, max: 1, step: 0.05 },
  { key: "forks", label: "Forks", min: 0, max: 1, step: 0.05 },
  { key: "breaks", label: "Breaks", min: 0, max: 1, step: 0.05 },
];

const PATTERN_OPTIONS: (Pattern | "auto")[] = ["auto", "arch", "loop", "whorl"];

/** The whole drawing takes about this long, however many ridges there are. */
const DRAW_MS = 1800;

const noSubscribe = () => () => {};

export function SeedFingerprintDemo() {
  const [text, setText] = useState("hello world");
  const [settings, setSettings] = useState(DEFAULT_FINGERPRINT_SETTINGS);
  const deferredText = useDeferredValue(text);
  const deferredSettings = useDeferredValue(settings);

  // Floating-point maths can differ in the last digit between the server
  // and the browser, so the print is only drawn in the browser.
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  const print = useMemo(
    () =>
      mounted ? generateFingerprint(deferredText, deferredSettings) : null,
    [mounted, deferredText, deferredSettings],
  );

  // The print shows at once, always. Clicking it has the pen draw it, and
  // further clicks wait until that drawing has finished.
  const ridgesRef = useRef<SVGGElement>(null);
  const animationsRef = useRef<Animation[]>([]);
  const [drawing, setDrawing] = useState(false);

  const stopDrawing = () => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
  };

  const draw = () => {
    const group = ridgesRef.current;
    // The ref, not state, so two quick clicks can't both start a drawing.
    if (animationsRef.current.length > 0 || !group) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const paths = Array.from(group.querySelectorAll("path"));
    const each = DRAW_MS * 0.35;
    const animations = paths.map((path, i) =>
      // Starts just past 1 so the dash clears the line's start entirely, and
      // stays transparent until its turn in case Safari still caps it.
      path.animate(
        [
          { strokeDashoffset: "1.02", opacity: 0, offset: 0 },
          { opacity: 1, offset: 0.02 },
          { strokeDashoffset: "0", opacity: 1, offset: 1 },
        ],
        {
          duration: each,
          delay: (i / Math.max(1, paths.length - 1)) * (DRAW_MS - each),
          easing: "cubic-bezier(0.33, 0, 0.2, 1)",
          fill: "backwards",
        },
      ),
    );
    animationsRef.current = animations;
    setDrawing(true);
    // Finishing or being cancelled both end the drawing.
    Promise.allSettled(animations.map((a) => a.finished)).then(() => {
      if (animationsRef.current === animations) animationsRef.current = [];
      // A newer drawing may have started since this one was cancelled.
      if (animationsRef.current.length === 0) setDrawing(false);
    });
  };

  // A new print (typing, sliders) replaces a drawing in progress at once.
  useEffect(() => stopDrawing, [print]);

  const [showMarks, setShowMarks] = useState(false);
  const changed =
    settings.pattern !== DEFAULT_FINGERPRINT_SETTINGS.pattern ||
    CONTROLS.some(
      ({ key }) => settings[key] !== DEFAULT_FINGERPRINT_SETTINGS[key],
    );
  const mark = settings.spacing * 0.5;

  return (
    <Demo>
      <div className="flex w-full max-w-md flex-col gap-6">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Seed</span>
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="bg-background rounded border px-3 py-2 text-base"
          />
        </label>

        <button
          type="button"
          onClick={draw}
          aria-disabled={drawing}
          aria-label={
            print
              ? `A ${print.pattern} fingerprint drawn from “${text}”. Draw it with the pen.`
              : "Fingerprint"
          }
          data-drawing={drawing || undefined}
          className={styles.button}
        >
          <svg
            viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
            className={styles.print}
            aria-hidden
          >
            <g ref={ridgesRef} className={styles.ridges}>
              {print?.ridges.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  pathLength={1}
                  className={styles.ridge}
                  strokeWidth={settings.spacing * 0.38}
                />
              ))}
            </g>
            {print && showMarks && (
              <g className={styles.marks} strokeWidth={0.6}>
                {print.minutiae.map((m, i) =>
                  m.type === "ending" ? (
                    <circle key={i} cx={m.x} cy={m.y} r={mark} />
                  ) : (
                    <rect
                      key={i}
                      x={m.x - mark * 0.8}
                      y={m.y - mark * 0.8}
                      width={mark * 1.6}
                      height={mark * 1.6}
                      transform={`rotate(45 ${m.x} ${m.y})`}
                    />
                  ),
                )}
                {print.singular.map((s, i) =>
                  s.type === "core" ? (
                    <circle key={`s${i}`} cx={s.x} cy={s.y} r={mark * 2.2} />
                  ) : (
                    <path
                      key={`s${i}`}
                      d={`M${s.x} ${s.y - mark * 2.2}l${mark * 1.9} ${mark * 3.3}h${-mark * 3.8}z`}
                    />
                  ),
                )}
              </g>
            )}
          </svg>
        </button>

        {print && (
          <div className="grid gap-1 text-xs">
            <code className="text-muted-foreground tracking-wide break-all">
              <span className={styles.visible}>{print.hash.slice(0, 3)}</span>
              {print.hash.slice(3)}
            </code>
            <p className="text-muted-foreground">
              {print.pattern}, tilted {print.tilt}°, {print.ridges.length}{" "}
              ridges, {print.minutiae.length} minutiae
            </p>
          </div>
        )}

        <div className="grid gap-2 text-sm">
          <label className="grid grid-cols-[9rem_1fr] items-center gap-3">
            <span className="text-muted-foreground">Pattern</span>
            <select
              value={settings.pattern}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  pattern: event.target.value as Pattern | "auto",
                }))
              }
              className="bg-background rounded border px-2 py-1"
            >
              {PATTERN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "auto" ? "From the hash" : option}
                </option>
              ))}
            </select>
          </label>
          {CONTROLS.map(({ key, label, min, max, step }) => (
            <label
              key={key}
              className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3"
            >
              <span className="text-muted-foreground">{label}</span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={settings[key]}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                className="accent-current"
              />
              <output className="text-right tabular-nums">
                {settings[key].toFixed(2)}
              </output>
            </label>
          ))}
          <label className="grid grid-cols-[9rem_1fr] items-center gap-3">
            <span className="text-muted-foreground">Show minutiae</span>
            <input
              type="checkbox"
              checked={showMarks}
              onChange={(event) => setShowMarks(event.target.checked)}
              className="justify-self-start accent-current"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Click or tap the print to watch the pen draw it.
          </span>
          <button
            type="button"
            disabled={!changed}
            onClick={() => setSettings(DEFAULT_FINGERPRINT_SETTINGS)}
            className="shrink-0 cursor-pointer rounded border px-2 py-1 disabled:cursor-default disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>
    </Demo>
  );
}

const SAMPLE_NAMES = [
  "Ada Lovelace",
  "Grace Hopper",
  "Alan Turing",
  "Katherine Johnson",
  "Linus Torvalds",
  "Margaret Hamilton",
  "Tim Berners-Lee",
  "Radia Perlman",
];

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/** The usual avatar: initials on a colour picked from the name. */
function InitialsAvatar({ name, size }: { name: string; size: number }) {
  const { paper, ink } = avatarColours(hashHue(avatarSeed(name)));
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-medium"
      style={{
        width: size,
        height: size,
        background: paper,
        color: ink,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Fingerprint avatars at real sizes, next to the usual initials-on-a-colour
 * avatar in the same hue, to see whether the print earns its place.
 */
export function FingerprintAvatarsDemo() {
  const [name, setName] = useState("Your Name");
  const names = [name, ...SAMPLE_NAMES];

  return (
    <Demo>
      <div className="flex w-full max-w-md flex-col gap-6">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Name or email</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="bg-background rounded border px-3 py-2 text-base"
          />
        </label>

        <div className="grid grid-cols-[2.5rem_1.5rem_2.5rem_6rem_1fr] items-center gap-x-4 gap-y-3 text-sm">
          <span className="text-muted-foreground col-span-4 text-xs">
            Initials, then the print at 24, 40 and 96px
          </span>
          <span />
          {names.map((n, i) => (
            <div key={i} className="contents">
              <InitialsAvatar name={n} size={40} />
              <FingerprintAvatar name={n} size={24} />
              <FingerprintAvatar name={n} size={40} />
              <FingerprintAvatar name={n} size={96} />
              <span className="truncate">{n || "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </Demo>
  );
}
