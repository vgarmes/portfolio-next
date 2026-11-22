"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { play } from "@/lib/sound";

import styles from "./theme-toggle.module.css";

/**
 * Flips between light and dark. There's no "system" option: the first visit
 * follows the OS (defaultTheme="system"), and the first click pins an explicit
 * theme based on what's currently showing.
 *
 * It sounds like a key, as spec-01's buttons do: a thock on the press and a
 * lighter click as it comes back up. From the keyboard there's no press, so
 * the click plays the thock.
 *
 * The control is a real <input type="checkbox" switch>, invisible and laid
 * over the icons. iOS Safari has no navigator.vibrate, but it ticks when a
 * finger toggles a switch, even an invisible one (on iOS 27, a switch
 * toggled from script doesn't tick). Android gets navigator.vibrate.
 */
const noop = () => () => {};

export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();
  // The theme is only known on the client; until then the switch reads "off".
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const dark = mounted && resolvedTheme === "dark";

  return (
    <div className={styles.anchor}>
      <span className={styles.button}>
        <input
          type="checkbox"
          {...{ switch: "" }}
          aria-label="Dark theme"
          className={styles.switch}
          checked={dark}
          onPointerDown={(event) => {
            if (event.button === 0) play("down");
          }}
          onKeyDown={(event) => {
            // A switch toggles on Space only; let Enter work as on a button.
            if (event.key === "Enter") event.currentTarget.click();
          }}
          onClick={(event) => {
            // detail is 0 for a click made from the keyboard
            play(event.detail === 0 ? "down" : "up");
            navigator.vibrate?.(10);
          }}
          onChange={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        />
        <span className={`${styles.icon} ${styles.light}`} aria-hidden="true">
          <svg viewBox="0 0 48 48" width="12" height="12" fill="none">
            <rect
              x="3.5"
              y="3.5"
              width="41"
              height="41"
              rx="20.5"
              stroke="currentColor"
              strokeWidth="5"
            />
            <path d="M24 1a23 23 0 0 0 0 46Z" fill="currentColor" />
          </svg>
        </span>
        <span className={`${styles.icon} ${styles.dark}`} aria-hidden="true">
          <svg viewBox="0 0 48 48" width="12" height="12" fill="none">
            <rect
              x="3.5"
              y="3.5"
              width="41"
              height="41"
              rx="20.5"
              stroke="currentColor"
              strokeWidth="5"
            />
            <path d="M24 1a23 23 0 0 1 0 46Z" fill="currentColor" />
          </svg>
        </span>
      </span>
    </div>
  );
};
