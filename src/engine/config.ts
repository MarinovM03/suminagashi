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
  force: 5200,
};

export const PARAM_META: { key: keyof TuneParams; label: string; desc: string; min: number; max: number; step: number }[] = [
  { key: 'flow', label: 'Ink flow', desc: 'How much pigment the brush releases as you draw.', min: 0.02, max: 0.4, step: 0.01 },
  { key: 'curl', label: 'Swirl', desc: 'Strength of the eddies and curls in the water.', min: 0, max: 40, step: 1 },
  { key: 'fade', label: 'Fade', desc: 'How quickly the ink dissolves and disappears.', min: 0, max: 0.5, step: 0.01 },
  { key: 'force', label: 'Force', desc: 'How strongly your strokes push the water.', min: 1500, max: 11000, step: 100 },
];

export interface Palette {
  id: string;
  label: string;
  colors: { label: string; hex: string }[];
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
  },
];

export type InkMode = 'cycle' | number;
export type Tool = 'brush' | 'ring' | 'comb';

export const PAPER = '#efeae0';
