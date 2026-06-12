export const simConfig = {
  SIM_RES: 256,
  DYE_RES: 1280,
  PRESSURE_ITER: 28,
  VEL_DISSIPATION: 0.16,
  DYE_DISSIPATION: 0.07,
  CURL: 14,
  SPLAT_RADIUS: 0.0026,
  SPLAT_FORCE: 5200,
};

export const INKS = {
  sumi: '#1a1a1f',
  ai: '#16407a',
  shu: '#c8372d',
  matsuba: '#2e6e52',
} as const;

export type InkName = keyof typeof INKS;
export type InkMode = InkName | 'cycle';
export type Tool = 'brush' | 'ring' | 'comb';

export const INK_KEYS = Object.keys(INKS) as InkName[];
export const PAPER = '#efeae0';
