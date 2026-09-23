import { describe, it, expect, afterEach, vi } from 'vitest';
import { canShareFiles } from './share';

afterEach(() => vi.unstubAllGlobals());

describe('canShareFiles', () => {
  it('is false where the Web Share API is missing', () => {
    vi.stubGlobal('navigator', {});
    expect(canShareFiles('image/png')).toBe(false);
  });

  it('asks the browser with a probe file carrying the right extension', () => {
    const canShare = vi.fn((data: ShareData) => data.files?.[0]?.name === 'probe.mp4');
    vi.stubGlobal('navigator', { canShare });
    expect(canShareFiles('video/mp4')).toBe(true);
    expect(canShare.mock.calls[0][0].files?.[0].type).toBe('video/mp4');
  });

  it('treats a throwing canShare as unsupported', () => {
    vi.stubGlobal('navigator', { canShare: () => { throw new TypeError('nope'); } });
    expect(canShareFiles('image/png')).toBe(false);
  });
});
