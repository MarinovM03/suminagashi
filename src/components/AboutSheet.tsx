import Icon from './Icon';
import Sheet from './Sheet';

const REPO = 'https://github.com/MarinovM03/suminagashi';

interface AboutSheetProps {
  open: boolean;
  variant: 'bottom' | 'center';
  onClose: () => void;
}

const external = { target: '_blank', rel: 'noopener noreferrer' };

export default function AboutSheet({ open, variant, onClose }: AboutSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} label="About suminagashi" variant={variant}>
      {variant === 'bottom' && <div className="sheet-grab" aria-hidden="true" />}
      <div className="sheet-head">
        <span className="sheet-title">About</span>
        <button className="icon-btn" aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>

      <article className="about">
        <p className="about-mark" lang="ja" aria-hidden="true">墨流し</p>
        <h2>Suminagashi</h2>
        <p className="about-lede">“Floating ink” — the Japanese art of marbling paper.</p>
        <p>
          Ink is dropped onto still water, spread into rings and fanned or combed into patterns,
          then lifted onto paper. This page simulates it in real time on your graphics card. The ink
          absorbs light like real pigment, so colors darken where they meet.
        </p>

        <h3>Tools</h3>
        <dl className="about-tools">
          <dt>Brush</dt><dd>Drag to draw ink.</dd>
          <dt>Rings</dt><dd>Press and hold to grow concentric rings.</dd>
          <dt>Comb</dt><dd>Drag through the ink to feather it.</dd>
        </dl>

        <div className="about-keys">
          <h3>Keyboard</h3>
          <ul>
            <li><kbd>Space</kbd> drop ink</li>
            <li><kbd>X</kbd> wash</li>
            <li><kbd>S</kbd> save image</li>
            <li><kbd>Ctrl</kbd> / <kbd>⌘</kbd> <kbd>Z</kbd> undo</li>
            <li><kbd>H</kbd> hide controls</li>
          </ul>
        </div>

        <h3>Privacy</h3>
        <p>No accounts and no cookies. What you make stays on your device unless you save or share it.</p>

        <h3>Credits</h3>
        <p className="about-small">
          Fluid solver after Jos Stam’s <i>Stable Fluids</i> and Pavel Dobryakov’s{' '}
          <a href="https://github.com/PavelDoGreat/WebGL-Fluid-Simulation" {...external}>WebGL Fluid Simulation</a> (MIT).
          Typeface <a href="https://github.com/fontdasu/ShipporiMincho" {...external}>Shippori Mincho</a> (SIL Open Font License).
        </p>
        <p className="about-small">
          Made by Martin Marinov · <a href={REPO} {...external}>Source on GitHub</a> · <a href="/licenses.txt" {...external}>Licences</a>
        </p>
      </article>
    </Sheet>
  );
}
