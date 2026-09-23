import { useEffect, useRef } from 'react';
import { PALETTES, type InkMode } from '../engine/config';
import { cycleBackground, inkBackground } from '../swatch';

interface InkTrayProps {
  paletteIdx: number;
  inkMode: InkMode;
  onPalette: (index: number) => void;
  onInk: (mode: InkMode) => void;
  onClose: () => void;
}

export default function InkTray({ paletteIdx, inkMode, onPalette, onInk, onClose }: InkTrayProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  const palette = PALETTES[paletteIdx];
  const refocusToggle = () => document.querySelector<HTMLElement>('[data-inks-toggle]')?.focus();

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('.swatch-btn[aria-pressed="true"]')?.focus({ preventScroll: true });

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (ref.current?.contains(target) || target.closest?.('[data-inks-toggle]')) return;
      closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      refocusToggle();
      closeRef.current();
    };
    addEventListener('pointerdown', onPointerDown, true);
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('pointerdown', onPointerDown, true);
      removeEventListener('keydown', onKey);
    };
  }, []);

  const pick = (mode: InkMode) => {
    onInk(mode);
    refocusToggle();
    onClose();
  };

  return (
    <div className="ink-tray" ref={ref} role="dialog" aria-label="Palette and ink">
      <div className="pal-tabs" role="group" aria-label="Palette">
        {PALETTES.map((p, i) => (
          <button key={p.id} className="pal-tab" aria-pressed={i === paletteIdx} onClick={() => onPalette(i)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="inks-row" role="group" aria-label="Ink">
        <button className="swatch-btn" aria-pressed={inkMode === 'cycle'} aria-label="Cycle — each touch uses the next ink" onClick={() => pick('cycle')}>
          <span className="sw" style={{ background: cycleBackground(palette.colors.map(c => c.hex)) }} />
        </button>
        {palette.colors.map((c, i) => (
          <button key={c.hex + i} className="swatch-btn" aria-pressed={inkMode === i} aria-label={c.label} onClick={() => pick(i)}>
            <span className="sw" style={{ background: inkBackground(c.hex) }} />
          </button>
        ))}
      </div>
    </div>
  );
}
