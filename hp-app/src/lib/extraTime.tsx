'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { useAuth } from './auth';
import { supabase } from './supabase';

const STORAGE_KEY = 'hp-pro:extra-time';

type ExtraTimeContextValue = {
  extraTime: boolean;
  setExtraTime: (extraTime: boolean) => void;
};

const ExtraTimeContext = createContext<ExtraTimeContextValue | null>(null);

export function ExtraTimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [extraTime, setExtraTimeState] = useState(false);

  // Local-first, same post-mount read as ThemeProvider - avoids an SSR/client
  // hydration mismatch and gives guests an instant, device-local setting.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(STORAGE_KEY) === '1') setExtraTimeState(true);
  }, []);

  // Signed-in users additionally get the setting synced from Supabase, so it
  // follows them across devices instead of staying stuck per-browser.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase
      .from('user_settings')
      .select('extra_time')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load extra time setting', error);
          return;
        }
        if (cancelled || !data) return;
        setExtraTimeState(data.extra_time);
        localStorage.setItem(STORAGE_KEY, data.extra_time ? '1' : '0');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setExtraTime = (next: boolean) => {
    setExtraTimeState(next);
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    if (user) {
      supabase
        .from('user_settings')
        .upsert({ user_id: user.id, extra_time: next, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error('Failed to save extra time setting', error);
        });
    }
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
