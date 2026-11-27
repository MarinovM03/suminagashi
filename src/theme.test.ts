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
  it('remembers day and night, and forgets on auto', () => {
    const data = fakeStorage();
    saveThemeChoice('night');
    expect(loadThemeChoice()).toBe('night');
    saveThemeChoice('auto');
    expect(data).toEqual({});
    expect(loadThemeChoice()).toBe('auto');
  });

  it('ignores unknown saved values', () => {
    fakeStorage({ theme: 'sepia' });
    expect(loadThemeChoice()).toBe('auto');
  });

  it('falls back to auto when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(() => saveThemeChoice('night')).not.toThrow();
    expect(loadThemeChoice()).toBe('auto');
  });
});
