import { useEffect, useState } from 'react';

interface PublishDialogProps {
  clip: string[] | null; // null while the clip is still recording
  onPublish: (image: string) => Promise<boolean>;
  onClose: () => void;
}

export default function PublishDialog({ clip, onPublish, onClose }: PublishDialogProps) {
  const [index, setIndex] = useState(0);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (clip && clip.length) setIndex(clip.length - 1);
  }, [clip]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !publishing) onClose(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose, publishing]);

  if (!clip) {
    return (
      <div className="rec-badge" role="status">
        <span className="rec-dot" />Recording the flow…
      </div>
    );
  }

  const publish = async () => {
    setPublishing(true);
    const ok = await onPublish(clip[index]);
    setPublishing(false);
    if (ok) onClose();
  };

  return (
    <div className="publish-backdrop" onClick={() => !publishing && onClose()}>
      <div className="publish" role="dialog" aria-label="Publish to gallery" onClick={e => e.stopPropagation()}>
        <div className="gallery-head">
          <span>Pick your moment</span>
          <button className="tune-x" aria-label="Close" disabled={publishing} onClick={onClose}>×</button>
        </div>

        <div className="publish-stage">
          <img src={clip[index]} alt="Frame to publish" />
        </div>

        <input
          className="publish-scrub"
          type="range"
          min={0}
          max={clip.length - 1}
          value={index}
          onChange={e => setIndex(parseInt(e.target.value))}
          aria-label="Scrub to the frame you want to publish"
        />

        <div className="publish-actions">
          <span className="publish-count">{index + 1} / {clip.length}</span>
          <div className="publish-buttons">
            <button className="publish-cancel" disabled={publishing} onClick={onClose}>Cancel</button>
            <button className="publish-go" disabled={publishing} onClick={publish}>
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
