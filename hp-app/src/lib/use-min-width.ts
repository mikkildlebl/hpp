'use client';

import { useEffect, useState } from 'react';

// Replaces RN's useWindowDimensions()-driven breakpoint checks with a plain
// matchMedia listener. Starts false so server-rendered and pre-mount client
// markup match (mobile layout), then syncs to the real viewport after mount.
export function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [px]);

  return matches;
}
