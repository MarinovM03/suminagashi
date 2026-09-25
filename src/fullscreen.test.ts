import { describe, it, expect, afterEach, vi } from 'vitest';
import { fullscreenNeedsHomeScreen } from './fullscreen';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

function browse(userAgent: string, { standalone = false, installedDisplay = false } = {}) {
  vi.stubGlobal('navigator', { userAgent, standalone });
  vi.stubGlobal('matchMedia', () => ({ matches: installedDisplay }));
}

afterEach(() => vi.unstubAllGlobals());

describe('fullscreenNeedsHomeScreen', () => {
  it('points iPhone Safari to the Home Screen', () => {
    browse(IPHONE);
    expect(fullscreenNeedsHomeScreen()).toBe(true);
  });

  it('stays quiet once the site is opened from the Home Screen', () => {
    browse(IPHONE, { standalone: true });
    expect(fullscreenNeedsHomeScreen()).toBe(false);
    browse(IPHONE, { installedDisplay: true });
    expect(fullscreenNeedsHomeScreen()).toBe(false);
  });

  it('is not needed on iPad or Android, which have real fullscreen', () => {
    browse(IPAD);
    expect(fullscreenNeedsHomeScreen()).toBe(false);
    browse(ANDROID);
    expect(fullscreenNeedsHomeScreen()).toBe(false);
  });
});
