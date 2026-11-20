"use client";

import { useTheme } from "next-themes";

import styles from "./theme-toggle.module.css";

/**
 * Flips between light and dark. There's no "system" option: the first visit
 * follows the OS (defaultTheme="system"), and the first click pins an explicit
 * theme based on what's currently showing.
 */
export const ThemeToggle: React.FC = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className={styles.anchor}>
      <button
        type="button"
        aria-label="Toggle theme"
        className={styles.button}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
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
