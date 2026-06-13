import type { InkMode, Palette, Tool } from '../engine/config';

const TOOL_BUTTONS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'brush', label: 'Brush', title: 'Drag to draw ink' },
  { tool: 'ring', label: 'Rings', title: 'Press and hold to drop concentric rings' },
  { tool: 'comb', label: 'Comb', title: 'Drag across ink to feather it into waves' },
];

function lighten(hex: string, amount = 0.3) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v: number) => Math.round(v + (255 - v) * amount);
  return `rgb(${mix((n >> 16) & 255)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

interface DockProps {
  palette: Palette;
  inkMode: InkMode;
  tool: Tool;
  autoFlow: boolean;
  tuneOpen: boolean;
  sharing: boolean;
  onPalette: () => void;
  onInk: (mode: InkMode) => void;
  onTool: (tool: Tool) => void;
  onAuto: () => void;
  onTune: () => void;
  onWash: () => void;
  onSave: () => void;
  onShare: () => void;
  onGallery: () => void;
}

export default function Dock({ palette, inkMode, tool, autoFlow, tuneOpen, sharing, onPalette, onInk, onTool, onAuto, onTune, onWash, onSave, onShare, onGallery }: DockProps) {
  const hexes = palette.colors.map(c => c.hex);
  const cycleBg = `conic-gradient(${[...hexes, hexes[0]].join(', ')})`;

  return (
    <div className="dock" role="toolbar" aria-label="Ink controls">
      <div className="tools">
        {TOOL_BUTTONS.map(t => (
          <button
            key={t.tool}
            className="tool"
            aria-pressed={tool === t.tool}
            title={t.title}
            onClick={() => onTool(t.tool)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sep" />

      <div className="inks">
        <button
          className="ink"
          style={{ background: cycleBg }}
          aria-pressed={inkMode === 'cycle'}
          title="Cycle — each touch uses the next ink"
          aria-label="Cycle"
          onClick={() => onInk('cycle')}
        />
        {palette.colors.map((c, i) => (
          <button
            key={c.hex + i}
            className="ink"
            style={{ background: `radial-gradient(circle at 35% 30%, ${lighten(c.hex)}, ${c.hex})` }}
            aria-pressed={inkMode === i}
            title={c.label}
            aria-label={c.label}
            onClick={() => onInk(i)}
          />
        ))}
      </div>

      <button className="act" title="Switch color palette" onClick={onPalette}>
        {palette.label}
      </button>

      <div className="sep" />

      <button className="act" aria-pressed={autoFlow} title="Toggle idle auto-drops and the ambient current" onClick={onAuto}>
        <span className="dot" />Auto flow
      </button>
      <button className="act" aria-expanded={tuneOpen} title="Adjust the fluid physics" onClick={onTune}>
        Tune
      </button>
      <button className="act" title="Gently wash the ink away" onClick={onWash}>
        Wash
      </button>
      <button className="act" title="Download the current marble as a PNG" onClick={onSave}>
        Save
      </button>
      <button className="act" disabled={sharing} title="Publish the current marble to the shared gallery" onClick={onShare}>
        {sharing ? 'Sharing…' : 'Share'}
      </button>
      <button className="act" title="Browse marbles people have shared" onClick={onGallery}>
        Gallery
      </button>
    </div>
  );
}
