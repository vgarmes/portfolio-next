"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { NowPlayingItem } from "@/lib/now-playing";
import styles from "./now-playing.module.css";

const LABELS: Record<NowPlayingItem["kind"], string> = {
  reading: "Reading",
  listening: "Listening to",
  playing: "Playing",
};

const stateClass = (
  i: number,
  current: number,
  previous: number | null,
  enter: string,
  exit: string,
) =>
  i === current
    ? previous !== null && enter
    : i === previous
      ? exit
      : styles.hidden;

interface Props {
  items: NowPlayingItem[];
  interval?: number;
  className?: string;
}

export const NowPlayingTicker: React.FC<Props> = ({
  items,
  interval = 10000,
  className,
}) => {
  // previous is null until the first rotation, so nothing animates on load
  const [{ current, previous }, setState] = useState<{
    current: number;
    previous: number | null;
  }>({ current: 0, previous: null });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || items.length < 2) return;

    const id = setInterval(() => {
      setState(({ current }) => ({
        current: (current + 1) % items.length,
        previous: current,
      }));
    }, interval);

    return () => clearInterval(id);
  }, [isPaused, items.length, interval]);

  if (items.length === 0) return null;

  return (
    <div
      className={cn("min-w-0 flex-1", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <ul className="sr-only">
        {items.map((item) => (
          <li key={`${item.kind}-${item.title}`}>
            {LABELS[item.kind]} {item.title}
          </li>
        ))}
      </ul>
      <div aria-hidden className="flex h-8 items-center gap-2">
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          {items.map((item, i) => (
            <div
              key={`${item.kind}-${item.title}`}
              className={cn(
                styles.item,
                "absolute inset-0 flex items-center justify-end gap-2",
                stateClass(i, current, previous, styles.enter, styles.exit),
              )}
            >
              <span className="text-muted-foreground shrink-0">
                {LABELS[item.kind]}
              </span>
              <span className="truncate">{item.title}</span>
            </div>
          ))}
        </div>
        <div className="relative size-7 shrink-0">
          {items.map((item, i) => (
            <Image
              key={`${item.kind}-${item.title}`}
              src={item.cover}
              alt=""
              width={28}
              height={28}
              unoptimized
              className={cn(
                styles.item,
                "bg-muted absolute inset-0 size-7 rounded-md border-2 object-cover",
                stateClass(
                  i,
                  current,
                  previous,
                  styles.coverEnter,
                  styles.coverExit,
                ),
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
