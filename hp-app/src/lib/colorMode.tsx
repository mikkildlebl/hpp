'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'hp-pro:theme';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');

  // Must read localStorage post-mount, not during the initial render: SSR has
  // no access to it, so reading it synchronously would make the client's
  // first render diverge from the server-rendered markup (hydration
  // mismatch on the conditionally-rendered glow blobs). Trades a one-frame
  // dark flash for light-mode users for not rendering a blocking <script>
  // tag, which React 19 warns about inside components.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === 'light') setThemeState('light');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
