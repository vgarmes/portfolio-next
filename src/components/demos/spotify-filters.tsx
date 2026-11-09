"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Subfilter = { id: string; label: string };
type Category = { id: string; label: string; subfilters: Subfilter[] };

const CATEGORIES: Category[] = [
  {
    id: "playlists",
    label: "Playlists",
    subfilters: [
      { id: "by-you", label: "By you" },
      { id: "by-spotify", label: "By Spotify" },
      { id: "downloaded", label: "Downloaded" },
    ],
  },
  {
    id: "podcasts",
    label: "Podcasts",
    subfilters: [
      { id: "unplayed", label: "Unplayed" },
      { id: "downloaded", label: "Downloaded" },
      { id: "in-progress", label: "In progress" },
    ],
  },
  {
    id: "albums",
    label: "Albums",
    subfilters: [{ id: "downloaded", label: "Downloaded" }],
  },
  { id: "artists", label: "Artists", subfilters: [] },
];

type Selection = { category: string | null; subfilter: string | null };

const CHIP_HEIGHT = 32; // px; chips are fully rounded, so radius = height / 2
const CHIP_RADIUS = CHIP_HEIGHT / 2;
const GAP = 8; // px between chips
const ENTER_OFFSET = 12; // px subfilters slide in from
// px a stacked subfilter tucks under its category. Must stay within
// [0, CHIP_RADIUS] so the filler strip (2 × radius wide) covers the seam.
const ATTACH_OVERLAP = CHIP_RADIUS / 2;
const CLOSE_KEY = "close";
const catKey = (cat: string) => `cat:${cat}`;
const subKey = (cat: string, sub: string) => `sub:${cat}:${sub}`;

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHOWN_TRANSITION = `transform 500ms ${EASE}, opacity 200ms ease 100ms, background-color 150ms, color 150ms`;
const HIDDEN_TRANSITION = `transform 500ms ${EASE}, opacity 120ms ease, background-color 150ms, color 150ms`;

type Placement = { x: number; visible: boolean; attached: boolean };

/**
 * Lays keys out left to right and returns each key's x offset. An `attached`
 * key skips the gap and tucks under the chip before it.
 */
function row(keys: string[], widths: Map<string, number>, attached?: string) {
  const positions = new Map<string, number>();
  let x = 0;
  keys.forEach((key, i) => {
    if (i > 0) x += key === attached ? -ATTACH_OVERLAP : GAP;
    positions.set(key, x);
    x += widths.get(key) ?? 0;
  });
  return { positions, width: x };
}

function visibleKeys({ category, subfilter }: Selection): string[] {
  if (category === null) return CATEGORIES.map((c) => catKey(c.id));
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const subs =
    subfilter === null
      ? cat.subfilters.map((s) => subKey(cat.id, s.id))
      : [subKey(cat.id, subfilter)];
  return [CLOSE_KEY, catKey(cat.id), ...subs];
}

/**
 * Every chip is always rendered. Visible chips are packed in a row; hidden
 * chips stay parked where they would sit when shown, so they fade out in
 * place and fade back in at the right spot.
 */
function computeLayout(selection: Selection, widths: Map<string, number>) {
  const top = row(
    CATEGORIES.map((c) => catKey(c.id)),
    widths,
  );
  const expanded = new Map(
    CATEGORIES.map((c) => [
      c.id,
      row(visibleKeys({ category: c.id, subfilter: null }), widths),
    ]),
  );
  const attached =
    selection.category !== null && selection.subfilter !== null
      ? subKey(selection.category, selection.subfilter)
      : undefined;
  const current = row(visibleKeys(selection), widths, attached);

  const placements = new Map<string, Placement>();
  placements.set(CLOSE_KEY, {
    x: 0,
    visible: current.positions.has(CLOSE_KEY),
    attached: false,
  });

  for (const cat of CATEGORIES) {
    const key = catKey(cat.id);
    const x = current.positions.get(key);
    placements.set(
      key,
      x !== undefined
        ? { x, visible: true, attached: false }
        : { x: top.positions.get(key)!, visible: false, attached: false },
    );

    for (const sub of cat.subfilters) {
      const key = subKey(cat.id, sub.id);
      const x = current.positions.get(key);
      placements.set(
        key,
        x !== undefined
          ? { x, visible: true, attached: key === attached }
          : {
              x: expanded.get(cat.id)!.positions.get(key)! + ENTER_OFFSET,
              visible: false,
              attached: false,
            },
      );
    }
  }

  const width = Math.max(
    top.width,
    ...[...expanded.values()].map((r) => r.width),
  );
  return { placements, width };
}

const SpotifyFilters: React.FC = () => {
  const [selection, setSelection] = useState<Selection>({
    category: null,
    subfilter: null,
  });
  const [widths, setWidths] = useState<Map<string, number> | null>(null);
  const [ready, setReady] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);

  // Measure every chip, and re-measure if any of them resizes (e.g. web font swap).
  // Chips are found by their `data-chip` key, so no per-chip refs are needed.
  useLayoutEffect(() => {
    const chips = [
      ...groupRef.current!.querySelectorAll<HTMLElement>("[data-chip]"),
    ];
    const measure = () =>
      setWidths(new Map(chips.map((el) => [el.dataset.chip!, el.offsetWidth])));
    measure();
    const observer = new ResizeObserver(measure);
    chips.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Turn transitions on only after the first positioned paint, so chips don't fly in from x=0.
  useEffect(() => {
    if (widths === null || ready) return;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [widths, ready]);

  const layout = widths ? computeLayout(selection, widths) : null;

  const chipStyle = (
    key: string,
    { extraTransform = "", raised = false } = {},
  ): React.CSSProperties => {
    const p = layout?.placements.get(key) ?? { x: 0, visible: false };
    return {
      transform: `translateX(${p.x}px)${extraTransform}`,
      opacity: p.visible ? 1 : 0,
      // The active category sits above its stacked subfilter so it covers the seam.
      zIndex: p.visible ? (raised ? 2 : 1) : 0,
      transition: ready
        ? p.visible
          ? SHOWN_TRANSITION
          : HIDDEN_TRANSITION
        : "none",
    };
  };

  const isVisible = (key: string) =>
    layout?.placements.get(key)?.visible ?? false;
  const isAttached = (key: string) =>
    layout?.placements.get(key)?.attached ?? false;

  // While a subfilter is stacked, the category and subfilter colours move
  // toward each other (mixing toward the opposite theme colour), so it works
  // in both light and dark mode.
  const chipClass =
    "absolute top-0 left-0 flex h-(--chip-h) cursor-pointer items-center whitespace-nowrap rounded-full px-4 text-sm select-none motion-reduce:transition-none! " +
    "bg-muted text-foreground not-aria-pressed:hover:brightness-95 dark:not-aria-pressed:hover:brightness-125 aria-pressed:bg-foreground aria-pressed:text-background data-stacked:aria-pressed:bg-[color-mix(in_oklch,var(--foreground),var(--background)_12%)] " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  // When stacked, a strip behind the subfilter's left edge fills the rounded
  // corners under the category, so both read as one continuous pill.
  const attachClass =
    " before:absolute before:inset-y-0 before:left-[calc(var(--chip-r)*-1)] before:-z-10 before:w-[calc(var(--chip-r)*2)] before:bg-inherit before:opacity-0 before:transition-opacity before:duration-200 data-attached:before:opacity-100 data-attached:aria-pressed:bg-[color-mix(in_oklch,var(--muted-foreground),var(--foreground)_30%)]";

  return (
    <div className="max-w-full overflow-x-auto py-1">
      <div
        role="group"
        aria-label="Filter your library"
        ref={groupRef}
        className="relative h-(--chip-h)"
        style={{
          ["--chip-h" as string]: `${CHIP_HEIGHT}px`,
          ["--chip-r" as string]: `${CHIP_RADIUS}px`,
          width: layout?.width,
          visibility: layout ? "visible" : "hidden",
        }}
      >
        <button
          data-chip={CLOSE_KEY}
          aria-label="Clear filters"
          aria-hidden={!isVisible(CLOSE_KEY)}
          inert={!isVisible(CLOSE_KEY)}
          className="focus-visible:outline-ring bg-muted text-foreground absolute top-0 left-0 flex size-(--chip-h) cursor-pointer items-center justify-center rounded-full hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none! dark:hover:brightness-125"
          style={chipStyle(CLOSE_KEY, {
            extraTransform: isVisible(CLOSE_KEY) ? " scale(1)" : " scale(0.6)",
          })}
          onClick={() => setSelection({ category: null, subfilter: null })}
        >
          <svg viewBox="0 0 21 21" className="size-full" aria-hidden>
            <g
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m7.5 7.5 6 6" />
              <path d="m13.5 7.5-6 6" />
            </g>
          </svg>
        </button>

        {CATEGORIES.map((cat) => {
          const key = catKey(cat.id);
          const active = selection.category === cat.id;
          return (
            <button
              key={key}
              data-chip={key}
              aria-pressed={active}
              aria-hidden={!isVisible(key)}
              inert={!isVisible(key)}
              data-stacked={
                (active && selection.subfilter !== null) || undefined
              }
              className={chipClass}
              style={chipStyle(key, { raised: active })}
              onClick={() =>
                setSelection(
                  active
                    ? { category: null, subfilter: null }
                    : { category: cat.id, subfilter: null },
                )
              }
            >
              {cat.label}
            </button>
          );
        })}

        {CATEGORIES.flatMap((cat) =>
          cat.subfilters.map((sub) => {
            const key = subKey(cat.id, sub.id);
            const active =
              selection.category === cat.id && selection.subfilter === sub.id;
            return (
              <button
                key={key}
                data-chip={key}
                aria-pressed={active}
                aria-hidden={!isVisible(key)}
                inert={!isVisible(key)}
                data-attached={isAttached(key) || undefined}
                className={chipClass + attachClass}
                style={chipStyle(key)}
                onClick={() =>
                  setSelection({
                    category: cat.id,
                    subfilter: active ? null : sub.id,
                  })
                }
              >
                {sub.label}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
};

export default SpotifyFilters;
