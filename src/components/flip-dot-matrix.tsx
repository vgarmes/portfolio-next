// Inspired by MotionGrid https://animate-ui.com/docs/components/motion-grid
// and this post by Adrien Griveau: https://x.com/Griveau/status/1932832554354163804

import {
  ComponentPropsWithoutRef,
  useEffect,
  useEffectEvent,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "@/lib/utils";

type FrameDot = [number, number];
type Frame = FrameDot[];
type Frames = Frame[];

type FlipDotGridProps = {
  gridSize: [number, number];
  // Keep the array stable between renders, a new one restarts the animation
  frames: Frames;
  duration?: number;
  animate?: boolean;
  loop?: boolean;
  // Called once the last frame of an animation without loop has been shown
  onFinish?: () => void;
  // Fade dots between frames instead of switching instantly
  fade?: boolean;
  cellClassName?: string;
  cellProps?: ComponentPropsWithoutRef<"div">;
  cellActiveClassName?: string;
  cellInactiveClassName?: string;
} & ComponentPropsWithoutRef<"div">;

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

const subscribeToReducedMotion = (callback: () => void) => {
  const mediaQuery = window.matchMedia(reducedMotionQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

const FlipDotGrid = ({
  gridSize,
  frames,
  duration = 200,
  animate = true,
  loop = true,
  onFinish,
  fade = true,
  cellClassName,
  cellProps,
  cellActiveClassName,
  cellInactiveClassName,
  className,
  ...props
}: FlipDotGridProps) => {
  const [index, setIndex] = useState(0);
  const [prevFrames, setPrevFrames] = useState(frames);
  const reducedMotion = usePrefersReducedMotion();

  // Start new animations from the first frame
  if (frames !== prevFrames) {
    setPrevFrames(frames);
    setIndex(0);
  }

  const lastIndex = frames.length - 1;
  const finished = !loop && index >= lastIndex;
  const running = animate && !reducedMotion && frames.length > 1 && !finished;

  useEffect(() => {
    if (!running) return;
    const intervalId = setInterval(
      () => setIndex((i) => (loop ? (i + 1) % frames.length : i + 1)),
      duration,
    );
    return () => clearInterval(intervalId);
  }, [running, loop, frames.length, duration]);

  // With reduced motion the last frame shows straight away, so it's done too
  const done = !loop && frames.length > 0 && (finished || reducedMotion);
  const finish = useEffectEvent(() => onFinish?.());
  useEffect(() => {
    if (!done) return;
    // Give the last frame the same time on screen as the others
    const timeoutId = setTimeout(finish, reducedMotion ? 0 : duration);
    return () => clearTimeout(timeoutId);
  }, [done, reducedMotion, duration]);

  // With reduced motion, loops rest on their first frame and one-off
  // animations jump to their last
  const currentIndex = reducedMotion
    ? loop
      ? 0
      : lastIndex
    : Math.min(index, lastIndex);

  const [cols, rows] = gridSize;

  const active = new Set<number>(
    frames[currentIndex]?.map(([x, y]) => y * cols + x) ?? [],
  );

  return (
    <div
      className={cn("grid w-fit gap-0.5", className)}
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: "1fr",
      }}
      {...props}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className={cn(
            "aspect-square size-3 rounded-full",
            fade && "transition-[background-color,transform] ease-out",
            active.has(i)
              ? cn("bg-foreground scale-110", cellActiveClassName)
              : cn("bg-muted scale-100", cellInactiveClassName),
            cellClassName,
          )}
          {...cellProps}
          style={{
            ...(fade && { transitionDuration: `${duration * 1.5}ms` }),
            ...cellProps?.style,
          }}
        />
      ))}
    </div>
  );
};

export {
  FlipDotGrid,
  type FlipDotGridProps,
  type FrameDot,
  type Frame,
  type Frames,
};
