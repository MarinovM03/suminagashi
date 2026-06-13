import type { InkMode, Tool } from '../engine/config';

const INK_BUTTONS: { mode: InkMode; cls: string; label: string; title: string }[] = [
  { mode: 'cycle', cls: 'ink-cycle', label: '巡', title: 'Cycle — each touch uses the next ink' },
  { mode: 'sumi', cls: 'ink-sumi', label: '墨', title: 'Sumi — ink black' },
  { mode: 'ai', cls: 'ink-ai', label: '藍', title: 'Ai — indigo' },
  { mode: 'shu', cls: 'ink-shu', label: '朱', title: 'Shu — vermilion' },
  { mode: 'matsuba', cls: 'ink-matsuba', label: '松葉', title: 'Matsuba — pine green' },
];

const TOOL_BUTTONS: { tool: Tool; label: string; title: string }[] = [
  { tool: 'brush', label: '筆', title: 'Brush — drag to draw ink' },
  { tool: 'ring', label: '輪', title: 'Rings — press and hold to drop concentric rings' },
  { tool: 'comb', label: '櫛', title: 'Comb — drag across ink to feather it into waves' },
];

interface DockProps {
  inkMode: InkMode;
  tool: Tool;
  autoFlow: boolean;
  onInk: (mode: InkMode) => void;
  onTool: (tool: Tool) => void;
  onAuto: () => void;
  onWash: () => void;
}

export default function Dock({ inkMode, tool, autoFlow, onInk, onTool, onAuto, onWash }: DockProps) {
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
        {INK_BUTTONS.map(b => (
          <button
            key={b.mode}
            className={`ink ${b.cls}`}
            aria-pressed={inkMode === b.mode}
            title={b.title}
            onClick={() => onInk(b.mode)}
          >
            <span className="lbl">{b.label}</span>
          </button>
        ))}
      </div>

      <div className="sep" />

      <button className="act" aria-pressed={autoFlow} title="Toggle idle auto-drops and the ambient current" onClick={onAuto}>
        <span className="dot" />Auto flow
      </button>
      <button className="act" title="Gently wash the ink away" onClick={onWash}>
        Wash
      </button>
    </div>
  );
}
