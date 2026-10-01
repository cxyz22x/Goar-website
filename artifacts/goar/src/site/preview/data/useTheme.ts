import { useCallback, useEffect, useRef, useState } from 'react';
import { THEME_KEY } from './content';

export type Theme = 'light' | 'dark' | null;

function readStored(): Theme {
  try {
    const s = localStorage.getItem(THEME_KEY);
    return s === 'light' || s === 'dark' ? s : null;
  } catch { return null; }
}

/* Source behaviour: stored choice sets data-theme; toggle flips it, honouring the OS preference when none is set. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStored);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggle = useCallback(() => {
    setTheme((cur) => {
      let next: 'light' | 'dark' = cur === 'light' ? 'dark' : 'light';
      if (!cur) next = window.matchMedia('(prefers-color-scheme: light)').matches ? 'dark' : 'light';
      try { localStorage.setItem(THEME_KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  }, []);
  /* Keep the page background behind the route in step with the theme (source styled body). */
  useEffect(() => {
    const el = rootRef.current;
    const prev = document.body.style.background;
    document.documentElement.classList.add('gp-route');
    if (el) document.body.style.background = getComputedStyle(el).backgroundColor;
    return () => { document.body.style.background = prev; document.documentElement.classList.remove('gp-route'); };
  }, [theme]);
  return { theme, toggle, rootRef };
}
