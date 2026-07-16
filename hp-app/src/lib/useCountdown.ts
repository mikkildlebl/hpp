'use client';

import { useEffect, useRef, useState } from 'react';

export type Countdown = {
  secondsLeft: number | null;
  paused: boolean;
  togglePause: () => void;
};

// Counts down from a fixed duration against a wall-clock end time (not a tick
// counter), so the displayed time stays correct even if the tab is backgrounded
// and setInterval gets throttled. Pass null to disable (untimed session).
// Pausing freezes the countdown by remembering the remaining time and, on
// resume, re-deriving a fresh end time from it - the wall-clock approach
// still needs a concrete end time to count down against while running.
export function useCountdown(durationSeconds: number | null, onExpire: () => void): Countdown {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(durationSeconds);
  const [paused, setPaused] = useState(false);
  const onExpireRef = useRef(onExpire);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (durationSeconds === null) return;
    endAtRef.current = Date.now() + durationSeconds * 1000;
  }, [durationSeconds]);

  useEffect(() => {
    if (durationSeconds === null || paused) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAtRef.current! - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds, paused]);

  const togglePause = () => {
    if (durationSeconds === null) return;
    setPaused((wasPaused) => {
      if (wasPaused) endAtRef.current = Date.now() + (secondsLeft ?? 0) * 1000;
      return !wasPaused;
    });
  };

  return { secondsLeft, paused, togglePause };
}
