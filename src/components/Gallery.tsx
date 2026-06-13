import { useEffect, useState } from 'react';
import { fetchMarbles, galleryEnabled, type Marble } from '../gallery';

interface GalleryProps {
  onClose: () => void;
}

type State =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; marbles: Marble[] };

export default function Gallery({ onClose }: GalleryProps) {
  const [state, setState] = useState<State>(galleryEnabled ? { kind: 'loading' } : { kind: 'disabled' });

  useEffect(() => {
    if (!galleryEnabled) return;
    let alive = true;
    fetchMarbles()
      .then(marbles => alive && setState({ kind: 'ready', marbles }))
      .catch(e => alive && setState({ kind: 'error', message: e?.message ?? 'Could not load the gallery' }));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="gallery-backdrop" onClick={onClose}>
      <div className="gallery" role="dialog" aria-label="Shared marbles" onClick={e => e.stopPropagation()}>
        <div className="gallery-head">
          <span>Gallery</span>
          <button className="tune-x" aria-label="Close" onClick={onClose}>×</button>
        </div>

        {state.kind === 'disabled' && (
          <p className="gallery-msg">
            The shared gallery needs Firebase. Add your project keys to a <code>.env</code> file
            (see <code>README.md</code>) to publish and browse marbles.
          </p>
        )}
        {state.kind === 'loading' && <p className="gallery-msg">Loading…</p>}
        {state.kind === 'error' && <p className="gallery-msg">{state.message}</p>}
        {state.kind === 'ready' && state.marbles.length === 0 && (
          <p className="gallery-msg">No marbles yet — be the first to share one.</p>
        )}
        {state.kind === 'ready' && state.marbles.length > 0 && (
          <div className="gallery-grid">
            {state.marbles.map(m => (
              <a key={m.id} className="gallery-item" href={m.url} target="_blank" rel="noopener noreferrer" title={m.palette}>
                <img src={m.url} alt={m.palette ? `${m.palette} marble` : 'marble'} loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
