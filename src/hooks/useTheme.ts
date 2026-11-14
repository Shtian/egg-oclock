import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

// Keep in sync with the inline script in index.html.
const KEY = "egg-oclock:theme";
const BAR: Record<Theme, string> = { light: "#eaf3fb", dark: "#151d2e" };
const BAR_MEDIA: Record<Theme, string> = {
  light: "(prefers-color-scheme: light)",
  dark: "(prefers-color-scheme: dark)",
};

const systemQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
const systemTheme = (): Theme => (systemQuery().matches ? "dark" : "light");

function savedTheme(): Theme | null {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : null;
}

/** Applies an explicit theme, or null to follow the system again. */
function apply(choice: Theme | null) {
  const root = document.documentElement;
  if (choice) root.dataset.theme = choice;
  else delete root.dataset.theme;

  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const own = (Object.keys(BAR_MEDIA) as Theme[]).find((t) => BAR_MEDIA[t] === meta.media);
    meta.content = choice ? BAR[choice] : BAR[own ?? "light"];
  }

  try {
    if (choice) localStorage.setItem(KEY, choice);
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
}

/**
 * Light/dark toggle. Picking the same theme as the system clears the saved
 * choice, so the app goes back to following the system setting.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());

  useEffect(() => {
    const query = systemQuery();
    const onChange = () => {
      if (!savedTheme()) setTheme(systemTheme());
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next === systemTheme() ? null : next);
    setTheme(next);
  };

  return { theme, toggle };
}
