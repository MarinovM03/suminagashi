import { useEffect, useState } from 'react';
import { fetchMarbles, fetchMarble, fetchFullImage, deleteMarble, galleryEnabled, type Marble, type MarblePage } from '../gallery';

interface GalleryProps {
  onClose: () => void;
  /** Marble id from a ?m= share link — opens its lightbox immediately. */
  initialId?: string;
  /** Surface a transient message in the app's toast. */
  notify?: (message: string) => void;
}

type State =
  | { kind: 'disabled' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; marbles: Marble[]; uid: string; cursor: MarblePage['cursor'] };

export default function Gallery({ onClose, initialId, notify }: GalleryProps) {
  const [state, setState] = useState<State>(galleryEnabled ? { kind: 'loading' } : { kind: 'disabled' });
  const [selected, setSelected] = useState<Marble | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Full-size images arrive lazily (they live in a subdocument); cache them
  // per marble id so re-opening the lightbox is instant.
  const [fulls, setFulls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!galleryEnabled) return;
    fetchMarbles()
      .then(({ uid, marbles, cursor }) => setState({ kind: 'ready', marbles, uid, cursor }))
      .catch(e => setState({ kind: 'error', message: e?.message ?? 'Could not load the gallery' }));
  }, []);

  // A shared link points at one marble, which may not be in the first page —
  // fetch it directly and open its lightbox.
  useEffect(() => {
    if (!galleryEnabled || !initialId) return;
    fetchMarble(initialId)
      .then(m => { if (m) setSelected(m); })
      .catch(() => {});
  }, [initialId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selected) setSelected(null);
      else onClose();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose, selected]);

  // The grid holds thumbnails; opening the lightbox fetches the real image.
  useEffect(() => {
    if (!selected || selected.full || fulls[selected.id]) return;
    let stale = false;
    fetchFullImage(selected.id)
      .then(img => { if (img && !stale) setFulls(f => ({ ...f, [selected.id]: img })); })
      .catch(() => {}); // lightbox keeps showing the thumbnail
    return () => { stale = true; };
  }, [selected, fulls]);

  const loadMore = async () => {
    if (state.kind !== 'ready' || !state.cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchMarbles(12, state.cursor);
      setState(s => (s.kind === 'ready'
        ? { ...s, marbles: [...s.marbles, ...page.marbles], cursor: page.cursor }
        : s));
    } catch {
      setDeleteError('Could not load more marbles');
    } finally {
      setLoadingMore(false);
    }
  };

  // A failed delete must not tear down the loaded grid — it surfaces as a
  // transient alert inside the dialog instead.
  const remove = async (m: Marble) => {
    if (!window.confirm('Delete this marble? This cannot be undone.')) return;
    try {
      await deleteMarble(m.id);
      setState(s => (s.kind === 'ready' ? { ...s, marbles: s.marbles.filter(x => x.id !== m.id) } : s));
      setSelected(sel => (sel?.id === m.id ? null : sel));
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete the marble');
    }
  };

  useEffect(() => {
    if (!deleteError) return;
    const t = setTimeout(() => setDeleteError(null), 4000);
    return () => clearTimeout(t);
  }, [deleteError]);

  const lightboxSrc = selected ? (selected.full ?? fulls[selected.id] ?? selected.thumb) : '';

  return (
    <>
      <div className="gallery-backdrop" onClick={onClose}>
        <div className="gallery" role="dialog" aria-modal="true" aria-label="Shared marbles" onClick={e => e.stopPropagation()}>
          <div className="gallery-head">
            <span>Gallery</span>
            <button className="tune-x" aria-label="Close" onClick={onClose}>×</button>
          </div>

          {deleteError && <p className="gallery-alert" role="alert">{deleteError}</p>}

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
            <div className="gallery-scroll">
              <div className="gallery-grid">
                {state.marbles.map(m => (
                  <div key={m.id} className="gallery-item">
                    <button className="gallery-open" title={m.palette} onClick={() => setSelected(m)}>
                      <img src={m.thumb} alt={m.palette ? `${m.palette} marble` : 'marble'} loading="lazy" />
                    </button>
                    {m.owner && m.owner === state.uid && (
                      <button className="gallery-del" aria-label="Delete your marble" title="Delete" onClick={() => remove(m)}>×</button>
                    )}
                  </div>
                ))}
              </div>
              {state.cursor && (
                <button className="gallery-more" disabled={loadingMore} onClick={loadMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="lightbox-x" aria-label="Close" onClick={() => setSelected(null)}>×</button>
          <button
            className="lightbox-copy"
            onClick={async e => {
              e.stopPropagation();
              const url = `${location.origin}${location.pathname}?m=${selected.id}`;
              try {
                await navigator.clipboard.writeText(url);
                notify?.('Link copied — share your marble');
              } catch {
                notify?.('Could not copy — the link is in the address bar');
                history.replaceState(null, '', `?m=${selected.id}`);
              }
            }}
          >
            Copy link
          </button>
          <img src={lightboxSrc} alt={selected.palette ? `${selected.palette} marble` : 'marble'} />
          {selected.palette && <span className="lightbox-cap">{selected.palette}</span>}
        </div>
      )}
    </>
  );
}
