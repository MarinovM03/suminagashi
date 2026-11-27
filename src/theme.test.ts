import { describe, it, expect, afterEach, vi } from 'vitest';
import { isNight, loadThemeChoice, saveThemeChoice } from './theme';

function fakeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => { data[k] = v; },
    removeItem: (k: string) => { delete data[k]; },
  });
  return data;
}

afterEach(() => vi.unstubAllGlobals());

describe('isNight', () => {
  it('follows the system on auto', () => {
    expect(isNight('auto', true)).toBe(true);
    expect(isNight('auto', false)).toBe(false);
  });

  it('lets a chosen theme override the system', () => {
    expect(isNight('day', true)).toBe(false);
    expect(isNight('night', false)).toBe(true);
  });
});

describe('theme choice storage', () => {
  it('starts in day until night or auto is chosen', () => {
    const data = fakeStorage();
    expect(loadThemeChoice()).toBe('day');
    saveThemeChoice('night');
    expect(loadThemeChoice()).toBe('night');
    saveThemeChoice('auto');
    expect(loadThemeChoice()).toBe('auto');
    saveThemeChoice('day');
    expect(data).toEqual({});
    expect(loadThemeChoice()).toBe('day');
  });

  it('ignores unknown saved values', () => {
    fakeStorage({ theme: 'sepia' });
    expect(loadThemeChoice()).toBe('day');
  });

  it('falls back to day when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(() => saveThemeChoice('night')).not.toThrow();
    expect(loadThemeChoice()).toBe('day');
  });
});
