import { useEffect, useRef } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
}

export default function Toast({ message }: { message: ToastMessage | null }) {
  const ref = useRef<HTMLDivElement>(null);

  // re-showing lifts the popover above any open sheet in the top layer
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== 'function') return;
    if (el.matches(':popover-open')) el.hidePopover();
    if (message) el.showPopover();
  }, [message]);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{message?.text ?? ''}</div>
      <div ref={ref} className="toast" popover="manual" aria-hidden="true">
        {message && <span key={message.id} className="toast-text">{message.text}</span>}
      </div>
    </>
  );
}
