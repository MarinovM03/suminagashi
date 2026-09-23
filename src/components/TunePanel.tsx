import type { CSSProperties } from 'react';
import { PARAM_META, type TuneParams } from '../engine/config';
import Icon from './Icon';

interface TunePanelProps {
  params: TuneParams;
  compact: boolean;
  onChange: (key: keyof TuneParams, value: number) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function TunePanel({ params, compact, onChange, onReset, onClose }: TunePanelProps) {
  return (
    <section className={compact ? 'tune tune-compact' : 'tune tune-wide'} aria-label="Tune the water">
      <div className="tune-head">
        <h2>Tune the water</h2>
        <button className="icon-btn icon-btn-sm" aria-label="Close tuning" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>

      {PARAM_META.map(m => {
        const id = `tune-${m.key}`;
        const fill = ((params[m.key] - m.min) / (m.max - m.min)) * 100;
        return (
          <div key={m.key} className="tune-row">
            <label htmlFor={id} className="tune-name">{m.label}</label>
            <output htmlFor={id} className="tune-val">{formatValue(m.key, params[m.key])}</output>
            <p id={`${id}-desc`} className="tune-desc">{m.desc}</p>
            <input
              id={id}
              type="range"
              min={m.min}
              max={m.max}
              step={m.step}
              value={params[m.key]}
              aria-describedby={`${id}-desc`}
              style={{ '--fill': `${fill}%` } as CSSProperties}
              onChange={e => onChange(m.key, parseFloat(e.target.value))}
            />
          </div>
        );
      })}

      <button className="pill-btn" onClick={onReset}>Reset to defaults</button>
    </section>
  );
}

function formatValue(key: keyof TuneParams, value: number) {
  if (key === 'force') return Math.round(value).toString();
  if (key === 'curl') return value.toFixed(0);
  return value.toFixed(2);
}
