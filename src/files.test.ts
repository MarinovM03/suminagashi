import { describe, it, expect } from 'vitest';
import { stampedName } from './files';

describe('stampedName', () => {
  it('stamps the local date and time, zero-padded', () => {
    expect(stampedName('png', new Date(2026, 8, 3, 7, 5, 9))).toBe('suminagashi-2026-09-03-070509.png');
  });

  it('keeps the requested extension', () => {
    expect(stampedName('mp4', new Date(2026, 11, 31, 23, 59, 58))).toBe('suminagashi-2026-12-31-235958.mp4');
  });
});
