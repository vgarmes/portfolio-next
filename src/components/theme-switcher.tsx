"use client";

import { useTheme } from "next-themes";
import { useEffect, useId, useState } from "react";

const ThemeSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const id = useId();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <fieldset className="flex h-8 w-fit items-center rounded-full shadow-[0_0_0_1px_var(--border)]">
      <legend className="sr-only">Select a display theme</legend>
      <span className="h-full">
        <label
          htmlFor={`theme-switcher-system-${id}`}
          className="text-muted-foreground has-checked:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-full has-checked:shadow-[0_0_0_1px_var(--border)] [&>svg]:size-4"
        >
          <input
            id={`theme-switcher-system-${id}`}
            type="radio"
            aria-label="system"
            value="system"
            className="sr-only"
            checked={mounted && theme === "system"}
            onChange={() => {
              setTheme("system");
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 5a2 2 0 0 1 2 2v8.526a2 2 0 0 0 .212.897l1.068 2.127a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45l1.068-2.127A2 2 0 0 0 4 15.526V7a2 2 0 0 1 2-2z" />
            <path d="M20.054 15.987H3.946" />
          </svg>
        </label>
      </span>
      <span className="h-full">
        <label
          htmlFor={`theme-switcher-light-${id}`}
          className="text-muted-foreground has-checked:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-full has-checked:shadow-[0_0_0_1px_var(--gray-400),0_1px_2px_0_var(--gray-alpha-100)] [&>svg]:size-4"
        >
          <input
            id={`theme-switcher-light-${id}`}
            type="radio"
            aria-label="light"
            className="sr-only"
            value="light"
            checked={mounted && theme === "light"}
            onChange={() => {
              setTheme("light");
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </label>
      </span>
      <span className="h-full">
        <label
          htmlFor={`theme-switcher-dark-${id}`}
          className="text-muted-foreground has-checked:text-foreground flex size-8 cursor-pointer items-center justify-center rounded-full has-checked:shadow-[0_0_0_1px_var(--gray-400),0_1px_2px_0_var(--gray-alpha-100)] [&>svg]:size-4"
        >
          <input
            id={`theme-switcher-dark-${id}`}
            type="radio"
            aria-label="dark"
            className="sr-only"
            value="dark"
            checked={mounted && theme === "dark"}
            onChange={() => {
              setTheme("dark");
            }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </label>
      </span>
    </fieldset>
  );
};

export default ThemeSwitcher;
