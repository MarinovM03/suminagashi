import type { Tool } from '../engine/config';
import type { IconName } from './Icon';

export const TOOLS: { tool: Tool; label: string; hint: string; tip: string; icon: IconName }[] = [
  { tool: 'brush', label: 'Brush', hint: 'Drag to draw ink', tip: 'Drag to draw', icon: 'brush' },
  { tool: 'ring', label: 'Rings', hint: 'Press and hold to drop concentric rings', tip: 'Press and hold', icon: 'rings' },
  { tool: 'comb', label: 'Comb', hint: 'Drag across ink to feather it into waves', tip: 'Drag through the ink', icon: 'comb' },
];
