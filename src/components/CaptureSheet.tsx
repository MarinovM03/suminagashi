import { useEffect, useState } from 'react';
import { canShareFiles } from '../share';
import Icon from './Icon';
import Sheet from './Sheet';

export interface Capture {
  blob: Blob;
  kind: 'image' | 'video';
  ext: string;
}

interface CaptureSheetProps {
  capture: Capture | null;
  onShare: () => void;
  onSave: () => void;
  onDiscard: () => void;
}

interface Preview {
  url: string;
  kind: Capture['kind'];
  canShare: boolean;
}

const KEEP_DURING_EXIT_MS = 300;

export default function CaptureSheet({ capture, onShare, onSave, onDiscard }: CaptureSheetProps) {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (capture) {
      setPreview({ url: URL.createObjectURL(capture.blob), kind: capture.kind, canShare: canShareFiles(capture.blob.type) });
      return;
    }
    const timer = setTimeout(() => setPreview(null), KEEP_DURING_EXIT_MS);
    return () => clearTimeout(timer);
  }, [capture]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  const noun = preview?.kind === 'video' ? 'video' : 'image';

  return (
    <Sheet open={capture !== null} onClose={onDiscard} label={`Your ${noun}`} variant="bottom" dismissible={noun === 'image'}>
      <div className="sheet-head">
        <h2 className="sheet-title">Your {noun}</h2>
        <button className="icon-btn" aria-label={`Discard ${noun}`} onClick={onDiscard}>
          <Icon name="close" />
        </button>
      </div>
      {preview && (preview.kind === 'video'
        ? <video className="capture-preview" src={preview.url} autoPlay muted loop playsInline />
        : <img className="capture-preview" src={preview.url} alt="Your marble" />)}
      <div className="sheet-actions">
        {preview?.canShare && (
          <button className="btn btn-primary" onClick={onShare}>
            <Icon name="share" />Share {noun}
          </button>
        )}
        <button className={preview?.canShare ? 'btn' : 'btn btn-primary'} onClick={onSave}>
          <Icon name="save" />Save to device
        </button>
      </div>
    </Sheet>
  );
}
