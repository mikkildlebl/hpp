'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'hp-pro:extra-time';

type ExtraTimeContextValue = {
  extraTime: boolean;
  setExtraTime: (extraTime: boolean) => void;
};

const ExtraTimeContext = createContext<ExtraTimeContextValue | null>(null);

export function ExtraTimeProvider({ children }: { children: ReactNode }) {
  const [extraTime, setExtraTimeState] = useState(false);

  // Same post-mount read as ThemeProvider - avoids an SSR/client hydration
  // mismatch since localStorage isn't available during the server render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === '1') setExtraTimeState(true);
  }, []);

  const setExtraTime = (next: boolean) => {
    setExtraTimeState(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  };

  return <ExtraTimeContext.Provider value={{ extraTime, setExtraTime }}>{children}</ExtraTimeContext.Provider>;
}

export function useExtraTime(): ExtraTimeContextValue {
  const ctx = useContext(ExtraTimeContext);
  if (!ctx) {
    throw new Error('useExtraTime must be used within an ExtraTimeProvider');
  }
  return ctx;
}
