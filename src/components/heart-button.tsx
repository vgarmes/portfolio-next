"use client";

import cx from "clsx";
import { useRef, useState } from "react";
import { FlipDotGrid, type Frames } from "./flip-dot-matrix";
import { animations, GRID_SIZE, HEART, OFF } from "./like-animations";

const LOOPS_PER_LIKE = 3;

// Each animation repeated, built once so the frames stay the same array
const likeAnimations = animations.map((animation) => ({
  ...animation,
  frames: Array.from(
    { length: animation.loops ?? LOOPS_PER_LIKE },
    () => animation.frames,
  ).flat(),
}));

const offFrames: Frames = [OFF];
const heartFrames: Frames = [HEART];

// Random animation, never the same one twice in a row
const pickAnimation = (previous: number | null) => {
  if (previous === null) {
    return Math.floor(Math.random() * animations.length);
  }
  const next = Math.floor(Math.random() * (animations.length - 1));
  return next >= previous ? next + 1 : next;
};

interface Props {
  likes: number;
  isLoading?: boolean;
  disabled?: boolean;
  // Shows the heart once the visitor can't like any more
  maxedOut?: boolean;
  onClick: () => void;
}

export const HeartButton: React.FC<Props> = ({
  likes = 0,
  isLoading = false,
  disabled = false,
  maxedOut = false,
  onClick,
}) => {
  const [current, setCurrent] = useState<number | null>(null);
  const previous = useRef<number | null>(null);
  const playing = current !== null;
  const animation = playing ? likeAnimations[current] : null;

  const handleClick = () => {
    if (playing) return;
    const next = pickAnimation(previous.current);
    previous.current = next;
    setCurrent(next);
    onClick();
  };

  const frames = animation
    ? animation.frames
    : maxedOut
      ? heartFrames
      : offFrames;

  return (
    <button
      type="button"
      aria-label={`Like this post, ${likes} ${likes === 1 ? "like" : "likes"}`}
      aria-busy={isLoading}
      // Not disabled while playing, that would drop keyboard focus
      aria-disabled={playing}
      disabled={disabled || isLoading || maxedOut}
      onClick={handleClick}
      className="flex items-center gap-2 rounded-lg border py-1.5 pr-2.5 pl-2 transition-transform duration-200 ease-out enabled:not-aria-disabled:active:scale-95 disabled:cursor-default aria-disabled:cursor-default"
    >
      <FlipDotGrid
        gridSize={GRID_SIZE}
        frames={frames}
        duration={animation?.duration ?? 90}
        loop={false}
        onFinish={playing ? () => setCurrent(null) : undefined}
        cellClassName="size-1"
        cellActiveClassName="bg-foreground"
        cellInactiveClassName="bg-foreground/10"
      />
      <span
        aria-hidden
        className={cx(
          // Same width as the dot matrix: 5 dots of 4px and 4 gaps of 2px
          "min-w-7 text-center text-sm tabular-nums transition-opacity",
          playing || maxedOut ? "text-foreground" : "text-muted-foreground",
          { "opacity-0": isLoading },
        )}
      >
        {likes}
      </span>
    </button>
  );
};
