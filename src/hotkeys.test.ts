import { describe, it, expect } from 'vitest';
import { resolveHotkey, type KeyInput } from './hotkeys';

const key = (code: string, mods: Partial<KeyInput> = {}): KeyInput => ({
  code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, ...mods,
});

describe('resolveHotkey', () => {
  it('maps the plain letter shortcuts', () => {
    expect(resolveHotkey(key('KeyX'), 'page')).toBe('wash');
    expect(resolveHotkey(key('KeyS'), 'page')).toBe('save');
    expect(resolveHotkey(key('KeyH'), 'page')).toBe('toggleUi');
    expect(resolveHotkey(key('KeyQ'), 'page')).toBeNull();
  });

  it('works by physical key, so non-Latin layouts still hit it', () => {
    // A Cyrillic layout reports e.key "ы" for this key, but e.code stays KeyS.
    expect(resolveHotkey(key('KeyS'), 'page')).toBe('save');
  });

  it('leaves browser shortcuts to the browser', () => {
    expect(resolveHotkey(key('KeyS', { ctrlKey: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyS', { metaKey: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyX', { ctrlKey: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyH', { ctrlKey: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyS', { altKey: true }), 'page')).toBeNull();
  });

  it('undoes with Ctrl+Z or Cmd+Z, but not redo', () => {
    expect(resolveHotkey(key('KeyZ', { ctrlKey: true }), 'page')).toBe('undo');
    expect(resolveHotkey(key('KeyZ', { metaKey: true }), 'control')).toBe('undo');
    expect(resolveHotkey(key('KeyZ', { ctrlKey: true, shiftKey: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyZ'), 'page')).toBeNull();
  });

  it('ignores held-down letters so S cannot spam downloads', () => {
    expect(resolveHotkey(key('KeyS', { repeat: true }), 'page')).toBeNull();
    expect(resolveHotkey(key('KeyX', { repeat: true }), 'page')).toBeNull();
  });

  it('lets a held Space keep dropping ink', () => {
    expect(resolveHotkey(key('Space'), 'page')).toBe('drop');
    expect(resolveHotkey(key('Space', { repeat: true }), 'page')).toBe('drop');
  });

  it('keeps Space for a focused button, but letters still work there', () => {
    expect(resolveHotkey(key('Space'), 'control')).toBeNull();
    expect(resolveHotkey(key('KeyS'), 'control')).toBe('save');
    expect(resolveHotkey(key('KeyX'), 'control')).toBe('wash');
  });

  it('never fires while typing in a text field', () => {
    for (const code of ['KeyX', 'KeyS', 'KeyH', 'Space']) {
      expect(resolveHotkey(key(code), 'text')).toBeNull();
    }
    expect(resolveHotkey(key('KeyZ', { ctrlKey: true }), 'text')).toBeNull();
  });
});
