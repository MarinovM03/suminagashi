import { describe, it, expect } from 'vitest';
import { PALETTES, PAPER, DEFAULT_PARAMS, PARAM_META } from './config';

const HEX = /^#[0-9a-fA-F]{6}$/;

describe('palettes', () => {
  it('has at least one palette', () => {
    expect(PALETTES.length).toBeGreaterThan(0);
  });

  it('every palette has a unique id and a label', () => {
    const ids = PALETTES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PALETTES) expect(p.label.length).toBeGreaterThan(0);
  });

  it('every ink is a valid 6-digit hex with a label', () => {
    for (const p of PALETTES) {
      expect(p.colors.length).toBeGreaterThan(0);
      for (const c of p.colors) {
        expect(c.hex).toMatch(HEX);
        expect(c.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('uses a valid paper color', () => {
    expect(PAPER).toMatch(HEX);
  });
});

describe('tune params', () => {
  it('exposes meta for every default param within its own range', () => {
    const keys = Object.keys(DEFAULT_PARAMS);
    expect(PARAM_META.map(m => m.key).sort()).toEqual(keys.sort());
    for (const m of PARAM_META) {
      const value = DEFAULT_PARAMS[m.key];
      expect(value).toBeGreaterThanOrEqual(m.min);
      expect(value).toBeLessThanOrEqual(m.max);
    }
  });
});
