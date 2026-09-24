import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { inkAbsorption, computeSimSizes, strokeDelta } from './math';

describe('inkAbsorption', () => {
  it('gives near-zero absorbance for white ink', () => {
    const a = inkAbsorption(new THREE.Color('#ffffff'), 1);
    expect(a.x).toBeCloseTo(0, 5);
    expect(a.y).toBeCloseTo(0, 5);
    expect(a.z).toBeCloseTo(0, 5);
  });

  it('gives high, clamped absorbance for black ink', () => {
    const a = inkAbsorption(new THREE.Color('#000000'), 1);
    expect(a.x).toBeCloseTo(-Math.log(0.012), 5);
    expect(a.x).toEqual(a.y);
    expect(a.y).toEqual(a.z);
  });

  it('scales linearly with strength', () => {
    const c = new THREE.Color('#16407a');
    const a = inkAbsorption(c, 1);
    const b = inkAbsorption(c, 2);
    expect(b.x).toBeCloseTo(a.x * 2, 5);
    expect(b.z).toBeCloseTo(a.z * 2, 5);
  });
});

describe('strokeDelta', () => {
  const push = (w: number, h: number, px: number, py: number) => {
    const [x, y] = strokeDelta(px / w, py / h, w / h);
    return Math.hypot(x, y);
  };

  it('pushes equally across and along a portrait phone', () => {
    expect(push(375, 812, 100, 0)).toBeCloseTo(push(375, 812, 0, 100), 10);
  });

  it('pushes equally across and along a landscape screen', () => {
    expect(push(1920, 1080, 100, 0)).toBeCloseTo(push(1920, 1080, 0, 100), 10);
  });

  it('leaves a square viewport unchanged', () => {
    expect(strokeDelta(0.1, -0.2, 1)).toEqual([0.1, -0.2]);
  });
});

describe('computeSimSizes', () => {
  it('fixes the velocity short edge to simRes in landscape', () => {
    const s = computeSimSizes(1920, 1080, 256, 1280);
    expect(s.sh).toBe(256);
    expect(s.sw).toBe(Math.round(256 * (1920 / 1080)));
  });

  it('fixes the velocity short edge to simRes in portrait', () => {
    const s = computeSimSizes(1080, 1920, 256, 1280);
    expect(s.sw).toBe(256);
    expect(s.sh).toBe(Math.round(256 / (1080 / 1920)));
  });

  it('caps the dye field at dyeRes on the long edge', () => {
    const s = computeSimSizes(4000, 2000, 256, 1280);
    expect(s.dw).toBe(1280);
    expect(s.dh).toBe(640);
  });

  it('does not upscale the dye field beyond the viewport', () => {
    const s = computeSimSizes(800, 600, 256, 1280);
    expect(s.dw).toBe(800);
    expect(s.dh).toBe(600);
  });
});
