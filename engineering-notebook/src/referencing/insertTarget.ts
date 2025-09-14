export type InsertTarget = {
  kind?: 'report' | 'sheet';
  boxId?: string;
  insert?: (text: string) => void;
  // Optional rich API for sticky/cross-tab editing
  getText?: () => string;
  setText?: (next: string) => void;
  getSelection?: () => { start: number; end: number } | null;
  setSelection?: (sel: { start: number; end: number } | null) => void;
  commit?: () => void;
  cancel?: () => void;
};

export type FallbackTarget = {
  docId: string;
  reportTabId?: string;
  boxId: string;
  append?: boolean; // default true
};

let currentTarget: InsertTarget | null = null;
let stickyTarget: InsertTarget | null = null;
let fallbackTarget: FallbackTarget | null = null;
const listeners = new Set<() => void>();

export function setInsertTarget(t: InsertTarget | null, opts?: { sticky?: boolean }) {
  if (opts?.sticky) {
    stickyTarget = t;
  } else {
    currentTarget = t;
  }
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

export function getInsertTarget(): InsertTarget | null {
  return currentTarget || stickyTarget;
}

export function hasInsertTarget(): boolean {
  return currentTarget != null || stickyTarget != null || fallbackTarget != null;
}

export function insertText(text: string): boolean {
  const target = currentTarget || stickyTarget;
  if (target) {
    try {
      // Prefer rich API to honor caret/selection if available
      if (target.getText && target.setText) {
        const buf = target.getText();
        let start = buf.length; let end = buf.length;
        if (target.getSelection) {
          const sel = target.getSelection();
          if (sel) { start = sel.start; end = sel.end; }
        }
        const next = buf.slice(0, start) + text + buf.slice(end);
        target.setText(next);
        if (target.setSelection) target.setSelection({ start: start + text.length, end: start + text.length });
        // Notify subscribers so UI can re-render bound Formula Bar
        listeners.forEach((fn) => { try { fn(); } catch {} });
        return true;
      }
      if (target.insert) { target.insert(text); return true; }
      return false;
    } catch { return false; }
  }
  if (fallbackTarget) {
    try {
      const { docId, boxId } = fallbackTarget;
      const key = `reportCanvas:doc:${docId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { boxes: any[] };
      if (!parsed || !Array.isArray(parsed.boxes)) return false;
      const boxes = parsed.boxes.map(b => ({ ...b }));
      const idx = boxes.findIndex(b => String(b.id) === String(boxId));
      if (idx < 0) return false;
      const b = boxes[idx];
      // Decide which field to edit: prefer src for math, else raw
      if (b && b.src && b.renderAsMath) {
        b.src = String(b.src || '') + text;
        // Keep raw unchanged; it will be regenerated on next open
      } else {
        b.raw = String(b.raw || '') + text;
      }
      localStorage.setItem(key, JSON.stringify({ boxes }));
      // Mark which box should open in edit on next load
      localStorage.setItem(`reportCanvas:editing:${docId}`, String(boxId));
      return true;
    } catch { return false; }
  }
  return false;
}

export function subscribeInsertTarget(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function notifyInsertTargetChanged(): void {
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

export function setFallbackInsertTarget(target: FallbackTarget | null) {
  fallbackTarget = target;
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

export function getFallbackTarget(): FallbackTarget | null { return fallbackTarget; }



