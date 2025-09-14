export function startDrag(
  e: PointerEvent,
  onMove: (dx: number, dy: number) => void,
  onEnd: () => void
) {
  // Prevent text selection/scroll during drag
  e.preventDefault();

  const startX = e.clientX;
  const startY = e.clientY;
  const target = e.target as Element;

  target.setPointerCapture?.(e.pointerId);

  function move(ev: PointerEvent) {
    onMove(ev.clientX - startX, ev.clientY - startY);
  }

  function cleanup() {
    window.removeEventListener("pointermove", move as any);
    window.removeEventListener("pointerup", up as any);
    window.removeEventListener("pointercancel", cancel as any);
    (target as any).removeEventListener?.("lostpointercapture", lostCapture as any);
    onEnd();
  }

  function up() { cleanup(); }
  function cancel() { cleanup(); }
  function lostCapture() { cleanup(); }

  window.addEventListener("pointermove", move as any);
  window.addEventListener("pointerup", up as any);
  window.addEventListener("pointercancel", cancel as any);
  (target as any).addEventListener?.("lostpointercapture", lostCapture as any);
}