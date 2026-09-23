import { useState } from 'react';
import type { InkMode, Palette, Tool } from '../engine/config';
import { cycleBackground, inkBackground } from '../swatch';
import Icon from './Icon';
import { TOOLS } from './tools';

interface DockCompactProps {
  palette: Palette;
  inkMode: InkMode;
  tool: Tool;
  inksOpen: boolean;
  menuOpen: boolean;
  canUndo: boolean;
  onTool: (tool: Tool) => void;
  onInks: () => void;
  onUndo: () => void;
  onMenu: () => void;
}

export default function DockCompact(p: DockCompactProps) {
  const [label, setLabel] = useState<{ id: number; text: string } | null>(null);
  const ink = p.inkMode === 'cycle' ? null : p.palette.colors[p.inkMode];
  const swatch = ink ? inkBackground(ink.hex) : cycleBackground(p.palette.colors.map(c => c.hex));

  return (
    <div className="dock-compact" role="toolbar" aria-label="Ink controls">
      {label && (
        <div key={label.id} className="dc-label" aria-hidden="true" onAnimationEnd={() => setLabel(null)}>
          {label.text}
        </div>
      )}

      {TOOLS.map(t => (
        <button
          key={t.tool}
          className="dc-btn"
          aria-pressed={p.tool === t.tool}
          aria-label={`${t.label} — ${t.hint}`}
          onClick={() => {
            p.onTool(t.tool);
            setLabel({ id: performance.now(), text: `${t.label} · ${t.tip}` });
          }}
        >
          <Icon name={t.icon} />
        </button>
      ))}

      <span className="dc-sep" aria-hidden="true" />

      <button
        className="dc-btn"
        data-inks-toggle=""
        aria-expanded={p.inksOpen}
        aria-haspopup="dialog"
        aria-label={`Ink: ${ink ? ink.label : 'cycle'}, ${p.palette.label} palette`}
        onClick={p.onInks}
      >
        <span className="dc-swatch" style={{ background: swatch }} />
      </button>

      <span className="dc-sep" aria-hidden="true" />

      <button className="dc-btn" aria-label="Undo" disabled={!p.canUndo} onClick={p.onUndo}>
        <Icon name="undo" />
      </button>
      <button className="dc-btn" aria-label="Menu" aria-haspopup="dialog" aria-expanded={p.menuOpen} onClick={p.onMenu}>
        <Icon name="more" />
      </button>
    </div>
  );
}
