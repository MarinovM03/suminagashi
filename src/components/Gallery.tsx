import { useEffect, useState } from 'react';
import { fetchMarbles, deleteMarble, galleryEnabled, type Marble } from '../gallery';

interface GalleryProps {
  onClose: () => void;
}

type State =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; marbles: Marble[]; uid: string };

export default function Gallery({ onClose }: GalleryProps) {
  const [state, setState] = useState<State>(galleryEnabled ? { kind: 'loading' } : { kind: 'disabled' });
  const [selected, setSelected] = useState<Marble | null>(null);

  useEffect(() => {
    if (!galleryEnabled) return;
    fetchMarbles()
      .then(({ uid, marbles }) => setState({ kind: 'ready', marbles, uid }))
      .catch(e => setState({ kind: 'error', message: e?.message ?? 'Could not load the gallery' }));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else onClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose, selected]);

  const remove = async (m: Marble) => {
    if (!window.confirm('Delete this marble? This cannot be undone.')) return;
    try {
      await deleteMarble(m.id);
      setState(s => (s.kind === 'ready' ? { ...s, marbles: s.marbles.filter(x => x.id !== m.id) } : s));
      setSelected(sel => (sel?.id === m.id ? null : sel));
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Could not delete the marble' });
    }
  };

  return (
    <>
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
            <p className="gallery-msg">No marbles yet — publish yours to start the wall.</p>
          )}
          {state.kind === 'ready' && state.marbles.length > 0 && (
            <div className="gallery-grid">
              {state.marbles.map(m => (
                <div key={m.id} className="gallery-item">
                  <button className="gallery-open" title={m.palette} onClick={() => setSelected(m)}>
                    <img src={m.url} alt={m.palette ? `${m.palette} marble` : 'marble'} loading="lazy" />
                  </button>
                  {m.owner && m.owner === state.uid && (
                    <button className="gallery-del" aria-label="Delete your marble" title="Delete" onClick={() => remove(m)}>×</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="lightbox-x" aria-label="Close" onClick={() => setSelected(null)}>×</button>
          <img src={selected.url} alt={selected.palette ? `${selected.palette} marble` : 'marble'} />
          {selected.palette && <span className="lightbox-cap">{selected.palette}</span>}
        </div>
      )}
    </>
  );
}
