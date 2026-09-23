import { useEffect, useRef, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  variant: 'bottom' | 'center';
  dismissible?: boolean;
  children: ReactNode;
}

const EXIT_MS = 220;

// Stays mounted so closing can animate; parents only toggle `open`.
export default function Sheet({ open, onClose, label, variant, dismissible = true, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const dialog = ref.current!;
    if (open) {
      dialog.classList.remove('closing');
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
    // Escape closes through React, keeping state in sync and animating.
    const onCancel = (e: Event) => {
      e.preventDefault();
      closeRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, []);

  return (
    <dialog
      ref={ref}
      className={`sheet ${variant}`}
      aria-label={label}
      // ::backdrop clicks target the dialog itself
      onClick={e => { if (dismissible && e.target === e.currentTarget) onClose(); }}
    >
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
