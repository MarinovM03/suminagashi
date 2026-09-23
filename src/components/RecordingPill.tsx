import { formatClock } from '../format';
import Icon from './Icon';

export default function RecordingPill({ seconds, onStop }: { seconds: number; onStop: () => void }) {
  const time = formatClock(seconds);
  return (
    <button className="rec-pill" aria-label={`Recording, ${time}. Stop recording`} onClick={onStop}>
      <span className="rec-dot" aria-hidden="true" />
      <span className="rec-time" aria-hidden="true">{time}</span>
      <span className="rec-stop" aria-hidden="true">
        <Icon name="stop" />Stop
      </span>
    </button>
  );
}
