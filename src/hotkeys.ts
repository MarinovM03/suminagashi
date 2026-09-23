import { useEffect, useRef } from 'react';

export type HotkeyAction = 'drop' | 'wash' | 'save' | 'undo' | 'toggleUi';

/** Where a key press landed — decides which keys the page may claim. */
export type KeyTarget = 'page' | 'control' | 'text';

export type KeyInput = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey' | 'repeat'>;

/* Letters match the physical key (e.code), so shortcuts work on any keyboard
   layout. Browser combos (Ctrl/Cmd+S, Ctrl+X…) stay the browser's, and held
   keys don't repeat except Space, where a held key rains ink on purpose. */
export function resolveHotkey(e: KeyInput, target: KeyTarget): HotkeyAction | null {
  if (target === 'text' || e.altKey) return null;
  if (e.ctrlKey || e.metaKey) return e.code === 'KeyZ' && !e.shiftKey ? 'undo' : null;
  // a focused button or slider keeps Space for itself
  if (e.code === 'Space') return target === 'page' ? 'drop' : null;
  if (e.repeat) return null;
  switch (e.code) {
    case 'KeyX': return 'wash';
    case 'KeyS': return 'save';
    case 'KeyH': return 'toggleUi';
    default: return null;
  }
}

const TEXT_FIELDS = 'textarea, select, [contenteditable]:not([contenteditable="false"]), '
  + 'input:not([type="range"], [type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"], [type="color"])';
const CONTROLS = 'button, a[href], input, [role="button"], [role="switch"], [role="slider"], [tabindex]';

export function classifyTarget(target: EventTarget | null): KeyTarget {
  if (!(target instanceof Element)) return 'page';
  if (target.closest(TEXT_FIELDS)) return 'text';
  if (target.closest(CONTROLS)) return 'control';
  return 'page';
}

function modalOpen() {
  try {
    return document.querySelector(':modal') !== null;
  } catch {
    return false; // browsers without :modal have no modal <dialog>s either
  }
}

export function useHotkeys(handlers: Partial<Record<HotkeyAction, () => void>>) {
  const latest = useRef(handlers);
  useEffect(() => { latest.current = handlers; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || modalOpen()) return;
      const action = resolveHotkey(e, classifyTarget(e.target));
      const run = action && latest.current[action];
      if (!run) return;
      e.preventDefault();
      run();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);
}
