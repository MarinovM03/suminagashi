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
