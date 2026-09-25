import Icon from './Icon';
import Sheet from './Sheet';

interface MenuSheetProps {
  open: boolean;
  autoFlow: boolean;
  fullscreen: { supported: boolean; active: boolean; needsHomeScreen: boolean };
  onClose: () => void;
  onToggleAuto: () => void;
  onTune: () => void;
  onWash: () => void;
  onToggleFullscreen: () => void;
  onAbout: () => void;
}

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
