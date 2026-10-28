"use client";

import cx from "clsx";
import { useState } from "react";
import { busyFrames as pongFrames } from "./demos/flip-dot-matrix";
import {
  FlipDotGrid,
  type Frame,
  type FrameDot,
  type Frames,
} from "./flip-dot-matrix";

const GRID_SIZE: [number, number] = [5, 5];

const toFrame = (rows: string[]): Frame =>
  rows.flatMap((row, y) =>
    [...row].flatMap((char, x): FrameDot[] => (char === "#" ? [[x, y]] : [])),
  );

// prettier-ignore
const HEART = toFrame([
  ".#.#.",
  "#####",
  "#####",
  ".###.",
  "..#..",
]);

const unlitFrames: Frames = [];
const litFrames: Frames = [HEART];

// The heart lights up row by row, from the bottom
const likeFrames: Frames = Array.from({ length: GRID_SIZE[1] }, (_, i) =>
  HEART.filter(([, y]) => y >= GRID_SIZE[1] - 1 - i),
);

const heartDots = new Set(HEART.map(([x, y]) => `${x},${y}`));

const foregroundMix = (percent: number) =>
  `color-mix(in oklab, var(--foreground) ${percent}%, transparent)`;

// Unlit heart dots are a subtle gray, brighter than the rest of the grid
const unlitStyle = (x: number, y: number) => {
  const isHeart = heartDots.has(`${x},${y}`);
  return {
    "--dot-off": foregroundMix(isHeart ? 35 : 10),
    "--dot-hover": foregroundMix(isHeart ? 55 : 10),
  } as React.CSSProperties;
};

interface Props {
  likes: number;
  liked?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const HeartButton: React.FC<Props> = ({
  likes = 0,
  liked = false,
  isLoading = false,
  disabled = false,
  onClick,
}) => {
  const [animateLike, setAnimateLike] = useState(false);

  const handleClick = () => {
    setAnimateLike(true);
    onClick();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={
          isLoading ? "Loading likes" : liked ? "Liked" : "Like this post"
        }
        aria-pressed={liked}
        aria-busy={isLoading}
        disabled={disabled || isLoading || liked}
        onClick={handleClick}
        className={cx(
          "group rounded-lg p-1.5 transition-transform duration-200 ease-out enabled:active:scale-90",
          { "cursor-default": liked },
        )}
      >
        {isLoading ? (
          <FlipDotGrid
            gridSize={GRID_SIZE}
            frames={pongFrames}
            duration={150}
            cellClassName="size-1"
            cellActiveClassName="bg-foreground"
            cellInactiveClassName="bg-foreground/10"
          />
        ) : (
          <FlipDotGrid
            gridSize={GRID_SIZE}
            frames={
              liked ? (animateLike ? likeFrames : litFrames) : unlitFrames
            }
            duration={90}
            loop={false}
            cellClassName="size-1"
            cellStyle={unlitStyle}
            cellActiveClassName="bg-foreground"
            cellInactiveClassName="bg-(--dot-off) group-enabled:group-hover:bg-(--dot-hover)"
          />
        )}
      </button>

      <span
        aria-live="polite"
        className={cx(
          "font-mono text-sm whitespace-nowrap tabular-nums transition-opacity",
          liked ? "text-foreground" : "text-muted-foreground",
          { "opacity-0": isLoading },
        )}
      >
        {likes} {likes === 1 ? "like" : "likes"}
      </span>
    </div>
  );
};
