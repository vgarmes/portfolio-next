"use client";

import { useId, useMemo, useSyncExternalStore } from "react";
import {
  AVATAR_RADIUS,
  AVATAR_SETTINGS,
  avatarSeed,
  generateFingerprint,
  hashHue,
  type Fingerprint,
} from "@/lib/fingerprint";

/**
 * An avatar drawn from a name or email: the fingerprint for that text,
 * cropped to a circle around its core, in a hue picked by the same hash.
 *
 * The server sends only the coloured circle, since the hue is integer maths
 * and agrees everywhere. The ridges are drawn in the browser, where the
 * floating-point maths can't differ from what hydration expects.
 */

/** Pastel paper and a deeper ink in the avatar's hue, the same in both themes. */
export const avatarColours = (hue: number) => ({
  paper: `oklch(0.93 0.045 ${hue})`,
  ink: `oklch(0.5 0.13 ${hue})`,
});

// Lists show the same people again and again; keep their prints.
const cache = new Map<string, Fingerprint>();
function avatarFor(seed: string) {
  let print = cache.get(seed);
  if (!print) {
    print = generateFingerprint(seed, AVATAR_SETTINGS, "avatar");
    if (cache.size > 300) cache.delete(cache.keys().next().value!);
    cache.set(seed, print);
  }
  return print;
}

const noSubscribe = () => () => {};

export function FingerprintAvatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const seed = avatarSeed(name);
  const { paper, ink } = avatarColours(hashHue(seed));
  const clip = useId();
  const mounted = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );
  const print = useMemo(
    () => (mounted ? avatarFor(seed) : null),
    [mounted, seed],
  );

  return (
    <svg
      viewBox={print?.viewBox ?? "0 0 1 1"}
      width={size}
      height={size}
      role="img"
      aria-label={name}
      className={className}
      style={{ borderRadius: "50%", background: paper, flexShrink: 0 }}
    >
      {print && (
        <>
          <clipPath id={clip}>
            <circle cx={print.focus.x} cy={print.focus.y} r={AVATAR_RADIUS} />
          </clipPath>
          <g
            clipPath={`url(#${clip})`}
            fill="none"
            stroke={ink}
            strokeWidth={AVATAR_SETTINGS.spacing * 0.46}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {print.ridges.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
