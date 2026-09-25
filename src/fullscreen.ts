import { useCallback, useSyncExternalStore } from 'react';

type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
};
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
type StandaloneNavigator = Navigator & { standalone?: boolean };

const doc = () => document as WebkitDocument;

export function fullscreenNeedsHomeScreen() {
  const openedFromHomeScreen = (navigator as StandaloneNavigator).standalone === true
    || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  return /iPhone|iPod/.test(navigator.userAgent) && !openedFromHomeScreen;
}
const fullscreenElement = () => doc().fullscreenElement ?? doc().webkitFullscreenElement ?? null;

function subscribe(notify: () => void) {
  document.addEventListener('fullscreenchange', notify);
  document.addEventListener('webkitfullscreenchange', notify);
  return () => {
    document.removeEventListener('fullscreenchange', notify);
    document.removeEventListener('webkitfullscreenchange', notify);
  };
}

export function useFullscreen() {
  const active = useSyncExternalStore(subscribe, () => fullscreenElement() !== null);
  const supported = Boolean(doc().fullscreenEnabled || doc().webkitFullscreenEnabled);

  const toggle = useCallback(() => {
    const el = document.documentElement as WebkitElement;
    const request = fullscreenElement()
      ? doc().exitFullscreen?.() ?? doc().webkitExitFullscreen?.()
      : el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.();
    request?.catch(() => {});
  }, []);

  return { supported, active, needsHomeScreen: !supported && fullscreenNeedsHomeScreen(), toggle };
}
