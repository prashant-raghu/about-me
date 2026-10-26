"use client";

import { useLayoutEffect } from "react";

type Theme = "light" | "dark";

const darkQuery = "(prefers-color-scheme: dark)";

function storedTheme(): Theme | null {
  try {
    const theme = localStorage.getItem("theme");
    return theme === "light" || theme === "dark" ? theme : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const classes = document.documentElement.classList;
  classes.toggle("dark", theme === "dark");
  classes.toggle("light", theme === "light");
}

export function ThemeToggle() {
  // The inline script in layout.tsx sets the theme before paint. This keeps it
  // in step with the system when no choice is stored, and re-applies it after
  // React's dev remount clears <html> classes (a no-op in production).
  useLayoutEffect(() => {
    const media = matchMedia(darkQuery);
    const sync = () => applyTheme(storedTheme() ?? (media.matches ? "dark" : "light"));
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  function toggle() {
    const next: Theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage blocked (private mode): the choice lasts for this page only.
    }
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className="grid size-8 flex-none cursor-pointer place-items-center rounded-full border border-line bg-transparent text-muted"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
        className="size-[15px]"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
