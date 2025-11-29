/**
 * Touch gesture utilities for pan, zoom, and pinch interactions
 */

export type TouchGestureState = {
  isPanning: boolean;
  isZooming: boolean;
  startDistance: number | null;
  lastTouches: React.TouchList | null;
};

export function getTouchDistance(touch1: React.Touch, touch2: React.Touch): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export function getTouchCenter(touch1: React.Touch, touch2: React.Touch): { x: number; y: number } {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

export function handleTouchStart(
  event: React.TouchEvent,
  state: TouchGestureState
): TouchGestureState {
  const touches = event.touches;

  if (touches.length === 1) {
    return {
      ...state,
      isPanning: true,
      lastTouches: touches,
    };
  } else if (touches.length === 2) {
    const distance = getTouchDistance(touches[0], touches[1]);
    return {
      ...state,
      isZooming: true,
      startDistance: distance,
      lastTouches: touches,
    };
  }

  return state;
}

export function handleTouchMove(
  event: React.TouchEvent,
  state: TouchGestureState,
  onPan: (deltaX: number, deltaY: number) => void,
  onZoom: (scaleDelta: number, center: { x: number; y: number }) => void
): TouchGestureState {
  const touches = event.touches;

  if (state.isPanning && touches.length === 1 && state.lastTouches) {
    const lastTouch = state.lastTouches[0];
    const currentTouch = touches[0];
    const deltaX = currentTouch.clientX - lastTouch.clientX;
    const deltaY = currentTouch.clientY - lastTouch.clientY;
    onPan(deltaX, deltaY);
  } else if (state.isZooming && touches.length === 2 && state.startDistance && state.lastTouches) {
    const currentDistance = getTouchDistance(touches[0], touches[1]);
    const scaleDelta = currentDistance / state.startDistance;
    const center = getTouchCenter(touches[0], touches[1]);
    onZoom(scaleDelta, center);

    return {
      ...state,
      startDistance: currentDistance,
      lastTouches: touches,
    };
  }

  return {
    ...state,
    lastTouches: touches,
  };
}

export function handleTouchEnd(state: TouchGestureState): TouchGestureState {
  return {
    isPanning: false,
    isZooming: false,
    startDistance: null,
    lastTouches: null,
  };
}



