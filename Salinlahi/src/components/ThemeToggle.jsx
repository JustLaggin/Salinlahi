import { useEffect, useState } from "react";

const STORAGE_KEY = "salinlahi-theme";

function getInitialTheme() {
  if (typeof document === "undefined") return "dark";
  const fromDom = document.documentElement.getAttribute("data-theme");
  if (fromDom === "light" || fromDom === "dark") return fromDom;
  return "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <span className="theme-toggle__label">Light</span>
      ) : (
        <span className="theme-toggle__label">Dark</span>
      )}
    </button>
  );
}
