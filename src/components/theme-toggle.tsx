"use client";

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
 */
export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className={styles.anchor}>
      <button
        type="button"
        aria-label="Toggle theme"
        className={styles.button}
        onPointerDown={(event) => {
          if (event.button === 0) play("down");
        }}
        onClick={(event) => {
          // detail is 0 for a click made with Enter or Space
          play(event.detail === 0 ? "down" : "up");
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        }}
      >
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
      </button>
    </div>
  );
};
