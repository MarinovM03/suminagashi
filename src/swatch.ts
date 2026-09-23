export function lighten(hex: string, amount = 0.3) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

export const inkBackground = (hex: string) =>
  `radial-gradient(circle at 35% 30%, ${lighten(hex)}, ${hex})`;

export const cycleBackground = (hexes: string[]) =>
  `conic-gradient(${[...hexes, hexes[0]].join(', ')})`;
