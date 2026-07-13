'use client';

import { useEffect, useRef, useState } from 'react';

// Counts down from a fixed duration against a wall-clock end time (not a tick
// counter), so the displayed time stays correct even if the tab is backgrounded
// and setInterval gets throttled. Pass null to disable (untimed session).
export function useCountdown(durationSeconds: number | null, onExpire: () => void): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(durationSeconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (durationSeconds === null) return;

    const endAt = Date.now() + durationSeconds * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpireRef.current();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds]);

  return secondsLeft;
}
