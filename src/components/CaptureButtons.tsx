import { formatClock } from '../format';
import Icon from './Icon';

interface CaptureButtonsProps {
  canRecord: boolean;
  recording: boolean;
  seconds: number;
  onPhoto: () => void;
  onRecord: () => void;
}

export default function CaptureButtons({ canRecord, recording, seconds, onPhoto, onRecord }: CaptureButtonsProps) {
  const time = formatClock(seconds);
  return (
    <div className="capture">
      {!recording && (
        <button className="cap-btn" aria-label="Take a picture" onClick={onPhoto}>
          <Icon name="camera" />
        </button>
      )}
      {canRecord && (recording ? (
        <button className="cap-rec" aria-label={`Recording, ${time}. Stop recording`} onClick={onRecord}>
          <span className="rec-dot" aria-hidden="true" />
          <span className="rec-time" aria-hidden="true">{time}</span>
          <Icon name="stop" />
        </button>
      ) : (
        <button className="cap-btn cap-btn-rec" aria-label="Record a video" onClick={onRecord}>
          <Icon name="record" />
        </button>
      ))}
    </div>
  );
}
