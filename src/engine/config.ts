export const simConfig = {
  SIM_RES: 256,
  DYE_RES: 1280,
  PRESSURE_ITER: 28,
  VEL_DISSIPATION: 0.16,
  SPLAT_RADIUS: 0.0026,
};

export interface TuneParams {
  flow: number;
  curl: number;
  fade: number;
  force: number;
}

export const DEFAULT_PARAMS: TuneParams = {
  flow: 0.14,
  curl: 14,
  fade: 0.07,
  force: 4800,
};

export const PARAM_META: { key: keyof TuneParams; label: string; desc: string; min: number; max: number; step: number }[] = [
  { key: 'flow', label: 'Ink flow', desc: 'How much pigment the brush releases as you draw.', min: 0.02, max: 0.4, step: 0.01 },
  { key: 'curl', label: 'Swirl', desc: 'Strength of the eddies and curls in the water.', min: 0, max: 40, step: 1 },
  { key: 'fade', label: 'Fade', desc: 'How quickly the ink dissolves and disappears.', min: 0, max: 0.5, step: 0.01 },
  { key: 'force', label: 'Force', desc: 'How strongly your strokes push the water.', min: 1500, max: 11000, step: 100 },
];

export interface Ink {
  label: string;
  hex: string;
}

export interface Palette {
  id: string;
  label: string;
  colors: Ink[];
  night: Ink[];
}

export const PALETTES: Palette[] = [
  {
    id: 'traditional',
    label: 'Traditional',
    colors: [
      { label: 'Sumi — ink black', hex: '#1a1a1f' },
      { label: 'Ai — indigo', hex: '#16407a' },
      { label: 'Shu — vermilion', hex: '#c8372d' },
      { label: 'Matsuba — pine green', hex: '#2e6e52' },
    ],
    night: [
      { label: 'Gofun — shell white', hex: '#ece6d8' },
      { label: 'Ai — pale indigo', hex: '#7c9be0' },
      { label: 'Shu — vermilion', hex: '#e0503c' },
      { label: 'Kin — gold', hex: '#d6a23c' },
    ],
  },
  {
    id: 'ebru',
    label: 'Ebru',
    colors: [
      { label: 'Lapis', hex: '#14213d' },
      { label: 'Turquoise', hex: '#2a9d8f' },
      { label: 'Oxide red', hex: '#9b2226' },
      { label: 'Ochre', hex: '#bc6c25' },
    ],
    night: [
      { label: 'Pearl', hex: '#e9eef0' },
      { label: 'Turquoise', hex: '#3cc8b4' },
      { label: 'Coral', hex: '#ef7a62' },
      { label: 'Ochre', hex: '#e0a23c' },
    ],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    colors: [
      { label: 'Violet', hex: '#7209b7' },
      { label: 'Crimson', hex: '#d00000' },
      { label: 'Burnt orange', hex: '#e85d04' },
      { label: 'Amber', hex: '#ffba08' },
    ],
    night: [
      { label: 'Violet', hex: '#b65cf0' },
      { label: 'Crimson', hex: '#ff4d4d' },
      { label: 'Burnt orange', hex: '#ff8a3d' },
      { label: 'Amber', hex: '#ffc93c' },
    ],
  },
  {
    id: 'neon',
    label: 'Neon',
    colors: [
      { label: 'Hot pink', hex: '#f72585' },
      { label: 'Cyan', hex: '#00b4d8' },
      { label: 'Lime', hex: '#70e000' },
      { label: 'Electric purple', hex: '#7209b7' },
    ],
    night: [
      { label: 'Hot pink', hex: '#f72585' },
      { label: 'Cyan', hex: '#00b4d8' },
      { label: 'Lime', hex: '#70e000' },
      { label: 'Electric purple', hex: '#9b4dff' },
    ],
  },
];

export function inksFor(palette: Palette, night: boolean): Ink[] {
  return night ? palette.night : palette.colors;
}

export type InkMode = 'cycle' | number;
export type Tool = 'brush' | 'ring' | 'comb';

export const PAPER = '#efeae0';
export const WATER = '#0a0b0f';
