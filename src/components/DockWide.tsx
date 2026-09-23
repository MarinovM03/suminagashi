import type { InkMode, Palette, Tool } from '../engine/config';
import { cycleBackground, inkBackground } from '../swatch';
import { TOOLS } from './tools';

interface DockWideProps {
  palette: Palette;
  inkMode: InkMode;
  tool: Tool;
  autoFlow: boolean;
  tuneOpen: boolean;
  recording: boolean;
  canRecord: boolean;
  canUndo: boolean;
  onPalette: () => void;
  onInk: (mode: InkMode) => void;
  onTool: (tool: Tool) => void;
  onAuto: () => void;
  onTune: () => void;
  onWash: () => void;
  onUndo: () => void;
  onSave: () => void;
  onRecord: () => void;
  onAbout: () => void;
}

export default function DockWide(p: DockWideProps) {
  const hexes = p.palette.colors.map(c => c.hex);

  return (
    <div className="dock-wide" role="toolbar" aria-label="Ink controls">
      <div className="tools">
        {TOOLS.map(t => (
          <button key={t.tool} className="tool" aria-pressed={p.tool === t.tool} title={t.hint} onClick={() => p.onTool(t.tool)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="sep" />

      <div className="inks">
        <button
          className="ink"
          style={{ background: cycleBackground(hexes) }}
          aria-pressed={p.inkMode === 'cycle'}
          title="Cycle — each touch uses the next ink"
          aria-label="Cycle"
          onClick={() => p.onInk('cycle')}
        />
        {p.palette.colors.map((c, i) => (
          <button
            key={c.hex + i}
            className="ink"
            style={{ background: inkBackground(c.hex) }}
            aria-pressed={p.inkMode === i}
            title={c.label}
            aria-label={c.label}
            onClick={() => p.onInk(i)}
          />
        ))}
      </div>

      <button className="act" title="Switch color palette" onClick={p.onPalette}>
        {p.palette.label}
      </button>

      <div className="sep" />

      <button className="act" aria-pressed={p.autoFlow} title="Idle ink drops and a gentle current" onClick={p.onAuto}>
        <span className="dot" />Auto flow
      </button>
      <button className="act" aria-expanded={p.tuneOpen} title="Adjust the fluid physics" onClick={p.onTune}>
        Tune
      </button>
      <button className="act" title="Gently wash the ink away (X)" onClick={p.onWash}>
        Wash
      </button>
      <button className="act" title="Undo the last stroke (Ctrl+Z)" disabled={!p.canUndo} onClick={p.onUndo}>
        Undo
      </button>
      <button className="act" title="Download the current marble as a PNG (S)" onClick={p.onSave}>
        Save
      </button>
      {p.canRecord && (
        <button
          className={p.recording ? 'act act-rec' : 'act'}
          title={p.recording ? 'Stop and download the video' : 'Record a video of the flowing ink'}
          onClick={p.onRecord}
        >
          {p.recording ? 'Stop' : 'Record'}
        </button>
      )}

      <div className="sep" />

      <button className="act" title="About suminagashi, shortcuts and credits" onClick={p.onAbout}>
        About
      </button>
    </div>
  );
}
