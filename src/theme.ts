import { useEffect, useState } from 'react';
import { PAPER, WATER } from './engine/config';
import { useMediaQuery } from './useMediaQuery';

export type ThemeChoice = 'auto' | 'day' | 'night';
export const THEME_CHOICES: ThemeChoice[] = ['auto', 'day', 'night'];

const KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function loadThemeChoice(): ThemeChoice {
  try {
    const saved = localStorage.getItem(KEY);
    return THEME_CHOICES.find(c => c === saved) ?? 'auto';
  } catch {
    return 'auto';
  }
}

export function saveThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === 'auto') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // Private windows can refuse storage; the choice still holds for this visit.
  }
}

export function isNight(choice: ThemeChoice, systemDark: boolean) {
  return choice === 'night' || (choice === 'auto' && systemDark);
}

export function useTheme() {
  const systemDark = useMediaQuery(DARK_QUERY);
  const [choice, setChoice] = useState(loadThemeChoice);
  const night = isNight(choice, systemDark);

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day';
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', night ? WATER : PAPER));
  }, [night]);

  const choose = (next: ThemeChoice) => {
    setChoice(next);
    saveThemeChoice(next);
  };

  const toggle = () => choose(!night === systemDark ? 'auto' : night ? 'day' : 'night');

  return { choice, night, choose, toggle };
}
