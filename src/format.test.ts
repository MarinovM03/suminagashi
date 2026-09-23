import { describe, it, expect } from 'vitest';
import { formatClock } from './format';

describe('formatClock', () => {
  it('shows minutes and zero-padded seconds', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(30)).toBe('0:30');
    expect(formatClock(75)).toBe('1:15');
  });
});
