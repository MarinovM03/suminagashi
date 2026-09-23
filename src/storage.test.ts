import { describe, it, expect, afterEach, vi } from 'vitest';
import { firstTime } from './storage';

afterEach(() => vi.unstubAllGlobals());

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v); },
  };
}

describe('firstTime', () => {
  it('is true once per key, then false', () => {
    vi.stubGlobal('localStorage', memoryStorage());
    expect(firstTime('tip')).toBe(true);
    expect(firstTime('tip')).toBe(false);
    expect(firstTime('other')).toBe(true);
  });

  it('is false when storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('SecurityError'); } });
    expect(firstTime('tip')).toBe(false);
  });
});
