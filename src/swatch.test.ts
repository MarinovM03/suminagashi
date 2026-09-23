import { describe, it, expect } from 'vitest';
import { lighten, cycleBackground } from './swatch';

describe('lighten', () => {
  it('mixes each channel toward white', () => {
    expect(lighten('#000000', 0.5)).toBe('rgb(128, 128, 128)');
    expect(lighten('#ffffff')).toBe('rgb(255, 255, 255)');
    expect(lighten('#c8372d', 0)).toBe('rgb(200, 55, 45)');
  });
});

describe('cycleBackground', () => {
  it('closes the conic loop on the first ink', () => {
    expect(cycleBackground(['#111111', '#222222'])).toBe('conic-gradient(#111111, #222222, #111111)');
  });
});
