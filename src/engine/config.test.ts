import { describe, it, expect } from 'vitest';
import { PALETTES, PAPER, WATER, DEFAULT_PARAMS, PARAM_META, inksFor } from './config';

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
      for (const c of [...p.colors, ...p.night]) {
        expect(c.hex).toMatch(HEX);
        expect(c.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every palette a night ink for each day ink', () => {
    for (const p of PALETTES) expect(p.night.length).toBe(p.colors.length);
  });

  it('picks the inks for the theme', () => {
    expect(inksFor(PALETTES[0], false)).toBe(PALETTES[0].colors);
    expect(inksFor(PALETTES[0], true)).toBe(PALETTES[0].night);
  });

  it('uses valid paper and water colors', () => {
    expect(PAPER).toMatch(HEX);
    expect(WATER).toMatch(HEX);
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
