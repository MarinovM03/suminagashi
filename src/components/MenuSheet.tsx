import Icon from './Icon';
import type { ThemeChoice } from '../theme';
import Sheet from './Sheet';

interface MenuSheetProps {
  open: boolean;
  autoFlow: boolean;
  theme: ThemeChoice;
  fullscreen: { supported: boolean; active: boolean; needsHomeScreen: boolean };
  onClose: () => void;
  onToggleAuto: () => void;
  onTheme: (choice: ThemeChoice) => void;
  onTune: () => void;
  onWash: () => void;
  onToggleFullscreen: () => void;
  onAbout: () => void;
}

const THEMES: { choice: ThemeChoice; label: string }[] = [
  { choice: 'auto', label: 'Auto' },
  { choice: 'day', label: 'Day' },
  { choice: 'night', label: 'Night' },
];

export default function MenuSheet(p: MenuSheetProps) {
  return (
    <Sheet open={p.open} onClose={p.onClose} label="Menu" variant="bottom">
      <div className="sheet-head">
        <h2 className="sheet-title">Menu</h2>
        <button className="icon-btn" aria-label="Close menu" onClick={p.onClose}>
          <Icon name="close" />
        </button>
      </div>

      <div className="rows">
        <button className="row" role="switch" aria-checked={p.autoFlow} onClick={p.onToggleAuto}>
          <Icon name="drop" />
          <span className="row-text">
            Auto flow
            <small>Drops and currents while you rest</small>
          </span>
          <span className="switch" aria-hidden="true" />
        </button>
        <div className="row row-theme" role="group" aria-labelledby="theme-label">
          <Icon name="moon" />
          <span className="row-text" id="theme-label">
            Water
            <small>Night is dark, with glowing inks</small>
          </span>
          <span className="seg">
            {THEMES.map(t => (
              <button key={t.choice} aria-pressed={p.theme === t.choice} onClick={() => p.onTheme(t.choice)}>
                {t.label}
              </button>
            ))}
          </span>
        </div>
        <button className="row" onClick={p.onTune}>
          <Icon name="tune" />
          <span className="row-text">Tune the water</span>
          <Icon name="chevron" className="row-chev" />
        </button>
        <button className="row" onClick={p.onWash}>
          <Icon name="wash" />
          <span className="row-text">Wash the ink away</span>
        </button>
        {p.fullscreen.supported && (
          <button className="row" role="switch" aria-checked={p.fullscreen.active} onClick={p.onToggleFullscreen}>
            <Icon name="fullscreen" />
            <span className="row-text">
              Fullscreen
              <small>Hide the browser bars for more room</small>
            </span>
            <span className="switch" aria-hidden="true" />
          </button>
        )}
        {p.fullscreen.needsHomeScreen && (
          <div className="row row-note">
            <Icon name="fullscreen" />
            <span className="row-text">
              Fullscreen
              <small>In Safari, tap Share → Add to Home Screen, then open it from there</small>
            </span>
          </div>
        )}
      </div>

      <div className="rows rows-last">
        <button className="row" onClick={p.onAbout}>
          <Icon name="info" />
          <span className="row-text">About suminagashi</span>
          <Icon name="chevron" className="row-chev" />
        </button>
      </div>
    </Sheet>
  );
}
