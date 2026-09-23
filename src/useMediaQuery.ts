import { useCallback, useSyncExternalStore } from 'react';

export const COMPACT_QUERY = '(max-width: 1179px), (pointer: coarse)';

export function useMediaQuery(query: string) {
  const subscribe = useCallback((notify: () => void) => {
    const mql = matchMedia(query);
    mql.addEventListener('change', notify);
    return () => mql.removeEventListener('change', notify);
  }, [query]);
  return useSyncExternalStore(subscribe, () => matchMedia(query).matches);
}
