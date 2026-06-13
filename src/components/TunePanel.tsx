import { PARAM_META, type TuneParams } from '../engine/config';

interface TunePanelProps {
  params: TuneParams;
  onChange: (key: keyof TuneParams, value: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function TunePanel({ params, onChange, onReset, onClose }: TunePanelProps) {
  return (
    <div className="tune" role="dialog" aria-label="Physics controls">
      <div className="tune-head">
        <span>Tune</span>
        <button className="tune-x" aria-label="Close" onClick={onClose}>×</button>
      </div>

      {PARAM_META.map(m => (
        <label key={m.key} className="tune-row">
          <span className="tune-label" tabIndex={0}>
            {m.label}
            <span className="tune-tip" role="tooltip">{m.desc}</span>
          </span>
          <input
            type="range"
            min={m.min}
            max={m.max}
            step={m.step}
            value={params[m.key]}
            onChange={e => onChange(m.key, parseFloat(e.target.value))}
          />
          <span className="tune-val">{formatValue(m.key, params[m.key])}</span>
        </label>
      ))}

      <button className="tune-reset" onClick={onReset}>Reset</button>
    </div>
  );
}

function formatValue(key: keyof TuneParams, value: number) {
  if (key === 'force') return Math.round(value).toString();
  if (key === 'curl') return value.toFixed(0);
  return value.toFixed(2);
}
