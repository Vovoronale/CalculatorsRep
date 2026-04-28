"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

type ThemeToggleProps = {
  className?: string;
  variant?: "labeled" | "icon";
};

export function ThemeToggle({ className = "", variant = "labeled" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(readTheme());
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // localStorage may be unavailable in private mode; ignore
    }
    setTheme(next);
  };

  const isDark = theme === "dark";
  const actionLabel = isDark ? "Перейти на світлу тему" : "Перейти на темну тему";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={actionLabel}
      aria-pressed={isDark}
      title={actionLabel}
      data-variant={variant}
      suppressHydrationWarning
    >
      <span className="theme-toggle__icon" aria-hidden>
        {mounted && isDark ? <Sun size={16} /> : <Moon size={16} />}
      </span>
      {variant === "labeled" ? (
        <span className="theme-toggle__label">{isDark ? "Світла тема" : "Темна тема"}</span>
      ) : null}
    </button>
  );
}
