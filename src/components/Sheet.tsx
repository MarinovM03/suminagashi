import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  variant: 'bottom' | 'center';
  dismissible?: boolean;
  children: ReactNode;
}

const EXIT_MS = 220;
const SWIPE_CLOSE_PX = 90;

interface Swipe {
  id: number;
  startY: number;
  startT: number;
  dy: number;
}

// Stays mounted so closing can animate; parents only toggle `open`.
export default function Sheet({ open, onClose, label, variant, dismissible = true, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const latest = useRef({ open, onClose, dismissible });
  useEffect(() => { latest.current = { open, onClose, dismissible }; });
  const swipe = useRef<Swipe | null>(null);
  const swiped = useRef(false);
  const swipeable = variant === 'bottom' && dismissible;

  useEffect(() => {
    const dialog = ref.current!;
    if (open) {
      dialog.classList.remove('closing');
      dialog.style.transform = '';
      dialog.style.removeProperty('--swipe-y');
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    dialog.classList.add('closing');
    const timer = setTimeout(() => {
      dialog.classList.remove('closing');
      dialog.close();
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = ref.current!;
    // Escape and the Android back gesture close through React, keeping state in sync and animating.
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (latest.current.dismissible) latest.current.onClose();
    };
    // A repeated back gesture can still force the dialog shut.
    const onForcedClose = () => {
      if (latest.current.open) latest.current.onClose();
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onForcedClose);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onForcedClose);
    };
  }, []);

  const startSwipe = (e: PointerEvent<HTMLDialogElement>) => {
    swiped.current = false;
    const target = e.target as Element;
    if (!swipeable || !e.isPrimary || e.button !== 0) return;
    if (!target.closest('.sheet-grab, .sheet-head') || target.closest('button')) return;
    swipe.current = { id: e.pointerId, startY: e.clientY, startT: e.timeStamp, dy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveSwipe = (e: PointerEvent<HTMLDialogElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    s.dy = Math.max(0, e.clientY - s.startY);
    e.currentTarget.style.transform = `translateY(${s.dy}px)`;
  };

  const endSwipe = (e: PointerEvent<HTMLDialogElement>) => {
    const s = swipe.current;
    if (!s || s.id !== e.pointerId) return;
    swipe.current = null;
    swiped.current = s.dy > 4;
    const dialog = e.currentTarget;
    const flick = s.dy > 24 && s.dy / Math.max(e.timeStamp - s.startT, 1) > 0.5;
    if (e.type === 'pointerup' && (s.dy > SWIPE_CLOSE_PX || flick)) {
      // the exit animation starts from where the finger let go
      dialog.style.setProperty('--swipe-y', `${s.dy}px`);
      onClose();
      return;
    }
    dialog.animate([{ transform: `translateY(${s.dy}px)` }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
    dialog.style.transform = '';
  };

  return (
    <dialog
      ref={ref}
      className={`sheet ${variant}`}
      aria-label={label}
      onPointerDown={startSwipe}
      onPointerMove={moveSwipe}
      onPointerUp={endSwipe}
      onPointerCancel={endSwipe}
      // ::backdrop clicks target the dialog itself
      onClick={e => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-body">
        {swipeable && <div className="sheet-grab" aria-hidden="true" />}
        {children}
      </div>
    </dialog>
  );
}
