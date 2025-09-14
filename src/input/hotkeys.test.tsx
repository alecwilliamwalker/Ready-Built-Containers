import { describe, it, expect, vi } from 'vitest';
import { bindGlobalHotkeys } from './hotkeys';

function dispatchKey(key: string, init: Partial<KeyboardEvent> = {}) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init } as any);
  const prevent = vi.fn(); const stop = vi.fn();
  Object.defineProperty(e, 'preventDefault', { value: prevent });
  Object.defineProperty(e, 'stopPropagation', { value: stop });
  window.dispatchEvent(e);
  return { prevent, stop };
}

describe('global hotkeys', () => {
  it('handles undo/redo chords with preventDefault', () => {
    const history = { undoOnce: vi.fn(), redoOnce: vi.fn() };
    const unbind = bindGlobalHotkeys({ history, setTool: () => {}, addBoxAtCenter: () => {}, isEditingInApp: () => false });
    const u = dispatchKey('z', { ctrlKey: true });
    expect(history.undoOnce).toHaveBeenCalledTimes(1);
    expect(u.prevent).toHaveBeenCalled();
    const r1 = dispatchKey('z', { ctrlKey: true, shiftKey: true });
    expect(history.redoOnce).toHaveBeenCalledTimes(1);
    expect(r1.prevent).toHaveBeenCalled();
    const r2 = dispatchKey('y', { ctrlKey: true });
    expect(history.redoOnce).toHaveBeenCalledTimes(2);
    expect(r2.prevent).toHaveBeenCalled();
    // Plain z -> undo, plain r -> redo
    const uPlain = dispatchKey('z');
    expect(history.undoOnce).toHaveBeenCalledTimes(2);
    expect(uPlain.prevent).toHaveBeenCalled();
    const rPlain = dispatchKey('r');
    expect(history.redoOnce).toHaveBeenCalledTimes(3);
    expect(rPlain.prevent).toHaveBeenCalled();
    unbind();
  });

  it('ignores plain letter hotkeys in inputs', () => {
    const history = { undoOnce: vi.fn(), redoOnce: vi.fn() };
    const unbind = bindGlobalHotkeys({ history, setTool: vi.fn(), addBoxAtCenter: vi.fn(), isEditingInApp: () => false });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    const r = dispatchKey('a');
    expect((unbind as any)).toBeTruthy();
    expect(r.prevent).not.toHaveBeenCalled();
    document.body.removeChild(input);
    unbind();
  });
});


