import Image from "next/image";
import { cn } from "@/lib/utils";
import type { NowPlayingItem } from "@/lib/now-playing";

/*
 * A fanned stack of cover thumbnails, after the client logos on
 * chloemaillot.fr. Pure CSS, so it renders on the server:
 *
 * - Covers overlap (negative margin) and each sits at a slight tilt (--rot).
 * - Hovering the stack spreads every cover sideways by its own --spread.
 * - Hovering (or focusing/tapping) a cover straightens it, scales it up,
 *   lifts it above its neighbours and reveals its label above.
 *
 * The stack is right-aligned in the Now header, so the last cover stays put
 * and the others fan out to the left.
 */

const LABELS: Record<NowPlayingItem["kind"], string> = {
  reading: "Reading",
  listening: "Listening to",
  playing: "Playing",
};

// Fixed rather than random so server and client render the same tilt.
const ROTATIONS = [-6, 4, -3, 5, -5, 3];
const SPREAD = 6; // px each cover moves apart from its neighbour on hover

const EASE = "duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)]";

interface Props {
  items: NowPlayingItem[];
  className?: string;
}

export const NowPlayingStack: React.FC<Props> = ({ items, className }) => {
  if (items.length === 0) return null;

  return (
    <>
      <ul className="sr-only">
        {items.map((item) => (
          <li key={`${item.kind}-${item.title}`}>
            {LABELS[item.kind]} {item.title}
          </li>
        ))}
      </ul>
      <span
        aria-hidden
        className={cn(
          "group/stack relative z-40 inline-flex items-center",
          className,
        )}
      >
        {items.map((item, i) => (
          <span
            key={`${item.kind}-${item.title}`}
            // Focusable so a tap on touch screens (no hover) still reveals the label.
            tabIndex={-1}
            style={
              {
                "--spread": `${(i - (items.length - 1)) * SPREAD}px`,
                "--rot": `${ROTATIONS[i % ROTATIONS.length]}deg`,
              } as React.CSSProperties
            }
            // The chip never moves or gets positioned, so the label's containing
            // block is the stack and it lines up with the stack's right edge.
            // The card inside does the moving, and only it catches the pointer.
            className={cn(
              "group/chip pointer-events-none -ml-2.5 inline-block shrink-0 outline-none first:ml-0",
              "hover:z-10 focus:z-10",
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute -top-8 right-0 text-xs leading-4 whitespace-nowrap",
                "translate-y-1 opacity-0 transition-[opacity,translate] duration-200 ease-out",
                "group-hover/chip:translate-y-0 group-hover/chip:opacity-100",
                "group-focus/chip:translate-y-0 group-focus/chip:opacity-100",
                "motion-reduce:translate-y-0",
              )}
            >
              <span className="text-muted-foreground">{LABELS[item.kind]}</span>{" "}
              {item.title}
            </span>
            <span
              className={cn(
                "bg-background pointer-events-auto block rounded-[6px] border p-[2px] shadow-sm",
                "[translate:0] [transform:rotate(var(--rot))] transition-[transform,translate,box-shadow] will-change-transform",
                "group-focus-within/stack:[translate:var(--spread)] group-hover/stack:[translate:var(--spread)]",
                "group-hover/chip:[transform:rotate(0deg)_scale(1.55)] group-hover/chip:shadow-md",
                "group-focus/chip:[transform:rotate(0deg)_scale(1.55)] group-focus/chip:shadow-md",
                "motion-reduce:transition-none",
                EASE,
              )}
            >
              <Image
                src={item.cover}
                alt=""
                width={20}
                height={28}
                unoptimized
                draggable={false}
                className="bg-muted block h-7 w-5 rounded-[3px] object-cover"
              />
            </span>
          </span>
        ))}
      </span>
    </>
  );
};
