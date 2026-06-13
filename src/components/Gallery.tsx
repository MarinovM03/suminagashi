import { useEffect, useState } from 'react';
import { fetchMarbles, galleryEnabled, type Marble } from '../gallery';

interface GalleryProps {
  preview: string | null;
  onPublish: () => Promise<boolean>;
  onClose: () => void;
}

type State =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; marbles: Marble[] };

export default function Gallery({ preview, onPublish, onClose }: GalleryProps) {
  const [state, setState] = useState<State>(galleryEnabled ? { kind: 'loading' } : { kind: 'disabled' });
  const [publishing, setPublishing] = useState(false);

  const load = () => {
    fetchMarbles()
      .then(marbles => setState({ kind: 'ready', marbles }))
      .catch(e => setState({ kind: 'error', message: e?.message ?? 'Could not load the gallery' }));
  };

  useEffect(() => {
    if (galleryEnabled) load();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const publish = async () => {
    setPublishing(true);
    const ok = await onPublish();
    setPublishing(false);
    if (ok) { setState({ kind: 'loading' }); load(); }
  };

  return (
    <div className="gallery-backdrop" onClick={onClose}>
      <div className="gallery" role="dialog" aria-label="Shared marbles" onClick={e => e.stopPropagation()}>
        <div className="gallery-head">
          <span>Gallery</span>
          <button className="tune-x" aria-label="Close" onClick={onClose}>×</button>
        </div>

        {galleryEnabled && (
          <div className="gallery-publish">
            {preview && <img className="gallery-publish-thumb" src={preview} alt="Your current marble" />}
            <div className="gallery-publish-text">
              <strong>Add your marble</strong>
              <span>Share the piece on your canvas with everyone.</span>
            </div>
            <button className="gallery-publish-btn" disabled={publishing || !preview} onClick={publish}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        )}

        {state.kind === 'disabled' && (
          <p className="gallery-msg">
            The shared gallery needs Firebase. Add your project keys to a <code>.env</code> file
            (see <code>README.md</code>) to publish and browse marbles.
          </p>
        )}
        {state.kind === 'loading' && <p className="gallery-msg">Loading…</p>}
        {state.kind === 'error' && <p className="gallery-msg">{state.message}</p>}
        {state.kind === 'ready' && state.marbles.length === 0 && (
          <p className="gallery-msg">No marbles yet — publish yours to start the wall.</p>
        )}
        {state.kind === 'ready' && state.marbles.length > 0 && (
          <div className="gallery-grid">
            {state.marbles.map(m => (
              <div key={m.id} className="gallery-item" title={m.palette}>
                <img src={m.url} alt={m.palette ? `${m.palette} marble` : 'marble'} loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
