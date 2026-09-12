import { useEffect, useState } from 'react';

/** Reagiert auf Media Queries – z. B. für kurze Handy-Displays. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', handler);
    return () => list.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** true auf niedrigen Displays (kleine Handys, Querformat). */
export function useShortScreen(): boolean {
  return useMediaQuery('(max-height: 740px)');
}
