import type {
  AnnotationConfig,
  DesignAction,
  DesignConfig,
  DesignEditorState,
  FixtureConfig,
} from "@/types/design";
import { resizeZone } from "./zone-utils";

const MAX_HISTORY = 50;

// UUID generation with fallback for older browsers (iOS Safari < 15.4)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using crypto.getRandomValues
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

function snapToIncrement(value: number, increment: number) {
  return Math.round(value / increment) * increment;
}

function clampToShell(
  xFt: number,
  yFt: number,
  fixtureWidth: number,
  fixtureHeight: number,
  shellLength: number,
  shellWidth: number,
  footprintAnchor: "center" | "front-left" | "back-left" = "center"
) {
  // Adjust clamping based on anchor point
  // For center-anchored fixtures, the position is the center, so we need to account for half the dimensions
  if (footprintAnchor === "center") {
    const halfWidth = fixtureWidth / 2;
    const halfHeight = fixtureHeight / 2;
    return {
      xFt: clamp(xFt, halfWidth, shellLength - halfWidth),
      yFt: clamp(yFt, halfHeight, shellWidth - halfHeight),
    };
  } else {
    // For corner-anchored fixtures (front-left, back-left), position is the corner
    return {
      xFt: clamp(xFt, 0, shellLength - fixtureWidth),
      yFt: clamp(yFt, 0, shellWidth - fixtureHeight),
    };
  }
}

function withDesignChange(
  state: DesignEditorState,
  next: DesignConfig
): DesignEditorState {
  const history = [...state.history, state.design];
  if (history.length > MAX_HISTORY) history.shift();
  return {
    ...state,
    design: next,
    history,
    future: [],
  };
}

export function designEditorReducer(
  state: DesignEditorState,
  action: DesignAction
): DesignEditorState {
  switch (action.type) {
    case "SELECT_FIXTURE": {
      if (!action.id) {
        return { ...state, primarySelectedId: undefined, selectedIds: [] };
      }
      if (action.append) {
        const ids = state.selectedIds.includes(action.id)
          ? state.selectedIds
          : [...state.selectedIds, action.id];
        return { ...state, primarySelectedId: action.id, selectedIds: ids };
      }
      return {
        ...state,
        primarySelectedId: action.id,
        selectedIds: [action.id],
      };
    }
    case "SELECT_FIXTURES": {
      return {
        ...state,
        selectedIds: action.ids,
        primarySelectedId: action.ids[0],
      };
    }
    case "CLEAR_SELECTION": {
      return { ...state, selectedIds: [], primarySelectedId: undefined };
    }
    case "TOGGLE_FIXTURE_SELECTION": {
      const exists = state.selectedIds.includes(action.id);
      const selectedIds = exists
        ? state.selectedIds.filter((id) => id !== action.id)
        : [...state.selectedIds, action.id];
      return {
        ...state,
        selectedIds,
        primarySelectedId: selectedIds[selectedIds.length - 1],
      };
    }
    case "ADD_FIXTURE": {
      const { catalogKey, zoneId, xFt, yFt, rotationDeg } = action;
      const newFixture: FixtureConfig = {
        id: generateUUID(),
        catalogKey,
        xFt: xFt ?? state.design.shell.lengthFt / 2,
        yFt: yFt ?? state.design.shell.widthFt / 2,
        rotationDeg: rotationDeg ?? 0,
        zone: zoneId,
      };
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: [...state.design.fixtures, newFixture],
      };
      return {
        ...withDesignChange(state, nextDesign),
        selectedIds: [newFixture.id],
        primarySelectedId: newFixture.id,
      };
    }
    case "REMOVE_FIXTURE": {
      const nextFixtures = state.design.fixtures.filter(
        (f) => f.id !== action.id
      );
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: nextFixtures,
      };
      const selectedIds = state.selectedIds.filter((id) => id !== action.id);
      return {
        ...withDesignChange(state, nextDesign),
        selectedIds,
        primarySelectedId: selectedIds[selectedIds.length - 1],
      };
    }
    case "UPDATE_FIXTURE_POSITION": {
      const { id, xFt, yFt, fixtureWidth, fixtureHeight, footprintAnchor } = action;
      const fixture = state.design.fixtures.find((f) => f.id === id);
      if (!fixture) return state;
      const increment = state.snapIncrement;
      const snappedX = snapToIncrement(xFt, increment);
      const snappedY = snapToIncrement(yFt, increment);
      const width = fixtureWidth ?? 1;
      const height = fixtureHeight ?? 1;
      const anchor = footprintAnchor ?? "center";
      const clampedPosition = clampToShell(
        snappedX,
        snappedY,
        width,
        height,
        state.design.shell.lengthFt,
        state.design.shell.widthFt,
        anchor
      );
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === id ? { ...f, ...clampedPosition } : f
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "UPDATE_FIXTURE_ROTATION": {
      const { id, rotationDeg } = action;
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === id ? { ...f, rotationDeg } : f
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "TOGGLE_FIXTURE_LOCK": {
      const { id } = action;
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === id ? { ...f, locked: !f.locked } : f
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "UPDATE_FIXTURE_SIZE": {
      const { id, lengthFt, widthFt } = action;
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === id
            ? {
              ...f,
              properties: {
                ...(f.properties ?? {}),
                ...(lengthFt !== undefined
                  ? { lengthOverrideFt: Math.max(lengthFt, 0.5) }
                  : null),
                ...(widthFt !== undefined
                  ? { widthOverrideFt: Math.max(widthFt, 0.5) }
                  : null),
              },
            }
            : f
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "START_DRAG": {
      const { id, pointerStartPx, fixtureWidth, fixtureHeight, footprintAnchor } = action;
      const fixture = state.design.fixtures.find((f) => f.id === id);
      if (!fixture) return state;
      return {
        ...state,
        drag: {
          fixtureId: id,
          startXFt: fixture.xFt,
          startYFt: fixture.yFt,
          pointerStartPx,
          fixtureWidth: fixtureWidth ?? 1,
          fixtureHeight: fixtureHeight ?? 1,
          footprintAnchor: footprintAnchor ?? "center",
        },
        primarySelectedId: id,
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds
          : [id],
      };
    }
    case "UPDATE_DRAG": {
      if (!state.drag) return state;
      const { pointerCurrentPx, scalePxPerFt, fixtureWidth, fixtureHeight, footprintAnchor, skipSnap } =
        action;
      const {
        pointerStartPx,
        startXFt,
        startYFt,
        fixtureWidth: dragWidth,
        fixtureHeight: dragHeight,
        footprintAnchor: dragAnchor,
      } = state.drag;
      const width = fixtureWidth ?? dragWidth;
      const height = fixtureHeight ?? dragHeight;
      const anchor = footprintAnchor ?? dragAnchor;
      const deltaXPx = pointerCurrentPx.x - pointerStartPx.x;
      const deltaYPx = pointerCurrentPx.y - pointerStartPx.y;
      const newXFt = startXFt + deltaXPx / scalePxPerFt;
      const newYFt = startYFt + deltaYPx / scalePxPerFt;
      
      // Apply snapping unless skipSnap is true (mobile mode)
      const position = skipSnap 
        ? { xFt: newXFt, yFt: newYFt }
        : { xFt: snapToIncrement(newXFt, state.snapIncrement), yFt: snapToIncrement(newYFt, state.snapIncrement) };
      
      const clamped = clampToShell(
        position.xFt,
        position.yFt,
        width,
        height,
        state.design.shell.lengthFt,
        state.design.shell.widthFt,
        anchor
      );
      return {
        ...state,
        design: {
          ...state.design,
          fixtures: state.design.fixtures.map((f) =>
            f.id === state.drag!.fixtureId ? { ...f, ...clamped } : f
          ),
        },
      };
    }
    case "END_DRAG": {
      // Commit the design change to history when drag ends
      return {
        ...withDesignChange(state, state.design),
        drag: undefined,
      };
    }
    case "START_MARQUEE": {
      return {
        ...state,
        marquee: {
          origin: action.origin,
          current: action.origin,
          isActive: true,
        },
      };
    }
    case "UPDATE_MARQUEE": {
      if (!state.marquee) return state;
      return {
        ...state,
        marquee: { ...state.marquee, current: action.current },
      };
    }
    case "END_MARQUEE": {
      return { ...state, marquee: undefined };
    }
    case "PAN_VIEWPORT": {
      const { offsetX, offsetY, scale } = state.viewport;
      let nextOffsetX = offsetX + action.deltaPx.x;
      let nextOffsetY = offsetY + action.deltaPx.y;
      
      // Apply bounds if provided (keeps design from flying off screen)
      if (action.bounds) {
        nextOffsetX = clamp(nextOffsetX, action.bounds.minX, action.bounds.maxX);
        nextOffsetY = clamp(nextOffsetY, action.bounds.minY, action.bounds.maxY);
      }
      
      return {
        ...state,
        viewport: {
          scale,
          offsetX: nextOffsetX,
          offsetY: nextOffsetY,
        },
      };
    }
    case "ZOOM_VIEWPORT": {
      const { scale, offsetX, offsetY } = state.viewport;
      const nextScale = clamp(scale + action.deltaScale, 0.25, 4);
      let nextOffsetX = offsetX;
      let nextOffsetY = offsetY;
      if (action.centerPx) {
        const factor = nextScale / scale;
        nextOffsetX = action.centerPx.x - factor * (action.centerPx.x - offsetX);
        nextOffsetY =
          action.centerPx.y - factor * (action.centerPx.y - offsetY);
      }
      
      // Apply bounds if provided (keeps design from flying off screen after zoom)
      if (action.bounds) {
        nextOffsetX = clamp(nextOffsetX, action.bounds.minX, action.bounds.maxX);
        nextOffsetY = clamp(nextOffsetY, action.bounds.minY, action.bounds.maxY);
      }
      
      return {
        ...state,
        viewport: { scale: nextScale, offsetX: nextOffsetX, offsetY: nextOffsetY },
      };
    }
    case "SET_VIEWPORT": {
      return { ...state, viewport: action.viewport };
    }
    case "SET_SNAP_INCREMENT": {
      return { ...state, snapIncrement: action.snapIncrement };
    }
    case "UNDO": {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      const history = state.history.slice(0, -1);
      const future = [state.design, ...state.future].slice(0, MAX_HISTORY);
      return { ...state, design: previous, history, future };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      const history = [...state.history, state.design].slice(-MAX_HISTORY);
      return { ...state, design: next, history, future: rest };
    }
    case "UPDATE_DESIGN": {
      return { ...state, design: action.design };
    }
    case "LOAD_DESIGN": {
      return {
        ...state,
        design: action.design,
        history: [],
        future: [],
        selectedIds: [],
        primarySelectedId: undefined,
        selectedZoneId: undefined,
      };
    }
    // Zone editing actions
    case "SELECT_ZONE": {
      return {
        ...state,
        selectedZoneId: action.id,
        // Clear fixture selection when selecting a zone
        selectedIds: [],
        primarySelectedId: undefined,
      };
    }
    case "UPDATE_ZONE": {
      const { id, xFt, yFt, lengthFt, widthFt, name } = action;
      const zone = state.design.zones.find((z) => z.id === id);
      if (!zone) return state;
      
      const increment = state.snapIncrement;
      const updates: Partial<typeof zone> = {};
      
      if (xFt !== undefined) {
        updates.xFt = clamp(snapToIncrement(xFt, increment), 0, state.design.shell.lengthFt - (lengthFt ?? zone.lengthFt));
      }
      if (yFt !== undefined) {
        updates.yFt = clamp(snapToIncrement(yFt, increment), 0, state.design.shell.widthFt - (widthFt ?? zone.widthFt));
      }
      if (lengthFt !== undefined) {
        updates.lengthFt = Math.max(1, snapToIncrement(lengthFt, increment));
      }
      if (widthFt !== undefined) {
        updates.widthFt = Math.max(1, snapToIncrement(widthFt, increment));
      }
      if (name !== undefined) {
        updates.name = name;
      }
      
      const nextDesign: DesignConfig = {
        ...state.design,
        zones: state.design.zones.map((z) =>
          z.id === id ? { ...z, ...updates } : z
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "START_ZONE_DRAG": {
      const { id, pointerStartPx } = action;
      const zone = state.design.zones.find((z) => z.id === id);
      if (!zone) return state;
      return {
        ...state,
        zoneDrag: {
          zoneId: id,
          startXFt: zone.xFt,
          startYFt: zone.yFt,
          pointerStartPx,
        },
        selectedZoneId: id,
      };
    }
    case "UPDATE_ZONE_DRAG": {
      if (!state.zoneDrag) return state;
      const { pointerCurrentPx, scalePxPerFt } = action;
      const { pointerStartPx, startXFt, startYFt, zoneId } = state.zoneDrag;
      const zone = state.design.zones.find((z) => z.id === zoneId);
      if (!zone) return state;
      
      const deltaXPx = pointerCurrentPx.x - pointerStartPx.x;
      const deltaYPx = pointerCurrentPx.y - pointerStartPx.y;
      const newXFt = startXFt + deltaXPx / scalePxPerFt;
      const newYFt = startYFt + deltaYPx / scalePxPerFt;
      const increment = state.snapIncrement;
      
      const snappedX = clamp(
        snapToIncrement(newXFt, increment),
        0,
        state.design.shell.lengthFt - zone.lengthFt
      );
      const snappedY = clamp(
        snapToIncrement(newYFt, increment),
        0,
        state.design.shell.widthFt - zone.widthFt
      );
      
      return {
        ...state,
        design: {
          ...state.design,
          zones: state.design.zones.map((z) =>
            z.id === zoneId ? { ...z, xFt: snappedX, yFt: snappedY } : z
          ),
        },
      };
    }
    case "END_ZONE_DRAG": {
      return { ...state, zoneDrag: undefined };
    }
    case "START_ZONE_RESIZE": {
      const { id, handle, pointerStartPx } = action;
      const zone = state.design.zones.find((z) => z.id === id);
      if (!zone) return state;
      return {
        ...state,
        zoneResize: {
          zoneId: id,
          handle,
          startXFt: zone.xFt,
          startYFt: zone.yFt,
          startLengthFt: zone.lengthFt,
          startWidthFt: zone.widthFt,
          pointerStartPx,
        },
        selectedZoneId: id,
      };
    }
    case "UPDATE_ZONE_RESIZE": {
      if (!state.zoneResize) return state;
      const { pointerCurrentPx, scalePxPerFt } = action;
      const {
        zoneId,
        handle,
        startXFt,
        startYFt,
        startLengthFt,
        startWidthFt,
        pointerStartPx,
      } = state.zoneResize;
      
      const deltaXPx = pointerCurrentPx.x - pointerStartPx.x;
      const deltaYPx = pointerCurrentPx.y - pointerStartPx.y;
      const deltaXFt = deltaXPx / scalePxPerFt;
      const deltaYFt = deltaYPx / scalePxPerFt;
      const increment = state.snapIncrement;
      
      let newXFt = startXFt;
      let newYFt = startYFt;
      let newLengthFt = startLengthFt;
      let newWidthFt = startWidthFt;
      
      // Handle resize based on which handle is being dragged
      if (handle.includes("e")) {
        newLengthFt = Math.max(1, snapToIncrement(startLengthFt + deltaXFt, increment));
      }
      if (handle.includes("w")) {
        const newLength = Math.max(1, snapToIncrement(startLengthFt - deltaXFt, increment));
        newXFt = startXFt + startLengthFt - newLength;
        newLengthFt = newLength;
      }
      if (handle.includes("s")) {
        newWidthFt = Math.max(1, snapToIncrement(startWidthFt + deltaYFt, increment));
      }
      if (handle.includes("n")) {
        const newWidth = Math.max(1, snapToIncrement(startWidthFt - deltaYFt, increment));
        newYFt = startYFt + startWidthFt - newWidth;
        newWidthFt = newWidth;
      }
      
      // Clamp to shell bounds
      newXFt = clamp(snapToIncrement(newXFt, increment), 0, state.design.shell.lengthFt - newLengthFt);
      newYFt = clamp(snapToIncrement(newYFt, increment), 0, state.design.shell.widthFt - newWidthFt);
      newLengthFt = Math.min(newLengthFt, state.design.shell.lengthFt - newXFt);
      newWidthFt = Math.min(newWidthFt, state.design.shell.widthFt - newYFt);
      
      return {
        ...state,
        design: {
          ...state.design,
          zones: state.design.zones.map((z) =>
            z.id === zoneId
              ? { ...z, xFt: newXFt, yFt: newYFt, lengthFt: newLengthFt, widthFt: newWidthFt }
              : z
          ),
        },
      };
    }
    case "END_ZONE_RESIZE": {
      return { ...state, zoneResize: undefined };
    }
    case "RESIZE_ZONE": {
      // Legacy action - updates only the length
      const { zoneId, newLengthFt } = action;
      const nextDesign = resizeZone(state.design, zoneId, newLengthFt);
      return withDesignChange(state, nextDesign);
    }
    case "ADD_ZONE": {
      const { name, xFt, yFt, lengthFt, widthFt } = action;
      const newZone = {
        id: generateUUID(),
        name: name ?? `Zone ${state.design.zones.length + 1}`,
        xFt: xFt ?? 0,
        yFt: yFt ?? 0,
        lengthFt: lengthFt ?? 8,
        widthFt: widthFt ?? state.design.shell.widthFt,
      };
      const nextDesign: DesignConfig = {
        ...state.design,
        zones: [...state.design.zones, newZone],
      };
      return {
        ...withDesignChange(state, nextDesign),
        selectedZoneId: newZone.id,
      };
    }
    case "REMOVE_ZONE": {
      const nextDesign: DesignConfig = {
        ...state.design,
        zones: state.design.zones.filter((z) => z.id !== action.id),
        // Also remove zone reference from fixtures in this zone
        fixtures: state.design.fixtures.map((f) =>
          f.zone === action.id ? { ...f, zone: undefined } : f
        ),
      };
      return {
        ...withDesignChange(state, nextDesign),
        selectedZoneId: state.selectedZoneId === action.id ? undefined : state.selectedZoneId,
      };
    }
    case "RENAME_ZONE": {
      const { id, name } = action;
      const nextDesign: DesignConfig = {
        ...state.design,
        zones: state.design.zones.map((z) =>
          z.id === id ? { ...z, name } : z
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    // Wall drawing actions
    case "START_WALL_DRAW": {
      const { startPoint } = action;
      const increment = state.snapIncrement;
      return {
        ...state,
        wallDraw: {
          startPoint: {
            xFt: snapToIncrement(startPoint.xFt, increment),
            yFt: snapToIncrement(startPoint.yFt, increment),
          },
          currentPoint: null,
        },
      };
    }
    case "UPDATE_WALL_DRAW": {
      if (!state.wallDraw) return state;
      const { currentPoint } = action;
      const increment = state.snapIncrement;
      return {
        ...state,
        wallDraw: {
          ...state.wallDraw,
          currentPoint: {
            xFt: snapToIncrement(currentPoint.xFt, increment),
            yFt: snapToIncrement(currentPoint.yFt, increment),
          },
        },
      };
    }
    case "END_WALL_DRAW": {
      if (!state.wallDraw) return state;
      const { endPoint } = action;
      const { startPoint } = state.wallDraw;
      const increment = state.snapIncrement;
      
      const snappedEnd = {
        xFt: snapToIncrement(endPoint.xFt, increment),
        yFt: snapToIncrement(endPoint.yFt, increment),
      };
      
      // Calculate wall length and rotation from start to end points
      const deltaX = snappedEnd.xFt - startPoint.xFt;
      const deltaY = snappedEnd.yFt - startPoint.yFt;
      const wallLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Only create wall if it has meaningful length
      if (wallLength < 0.5) {
        return { ...state, wallDraw: undefined };
      }
      
      // Calculate rotation angle (snap to 0, 90, 180, 270)
      // The wall fixture's base orientation is horizontal (along X-axis at 0°)
      // We need to offset by 90° so the wall aligns with the draw direction
      const angleRad = Math.atan2(deltaY, deltaX);
      const angleDeg = (angleRad * 180) / Math.PI;
      let rotationDeg: 0 | 90 | 180 | 270;
      
      // Snap to nearest 90-degree increment, offset by 90° to align with draw direction
      if (angleDeg >= -45 && angleDeg < 45) {
        rotationDeg = 90;   // Drawing right → wall vertical
      } else if (angleDeg >= 45 && angleDeg < 135) {
        rotationDeg = 0;    // Drawing down → wall horizontal  
      } else if (angleDeg >= -135 && angleDeg < -45) {
        rotationDeg = 0;    // Drawing up → wall horizontal
      } else {
        rotationDeg = 90;   // Drawing left → wall vertical
      }
      
      // Calculate center position of the wall
      const centerX = (startPoint.xFt + snappedEnd.xFt) / 2;
      const centerY = (startPoint.yFt + snappedEnd.yFt) / 2;
      
      // Determine which axis the wall is primarily along for length calculation
      // Note: rotationDeg=0 means wall is horizontal, 90 means vertical
      const isHorizontal = rotationDeg === 0;
      const effectiveLength = isHorizontal ? Math.abs(deltaY) : Math.abs(deltaX);
      
      const newFixture: FixtureConfig = {
        id: generateUUID(),
        catalogKey: "fixture-wall",
        xFt: snapToIncrement(centerX, increment),
        yFt: snapToIncrement(centerY, increment),
        rotationDeg,
        properties: {
          lengthOverrideFt: Math.max(1, snapToIncrement(effectiveLength, increment)),
          material: "drywall",
          transparent3D: true,  // Transparent by default for better visibility
        },
      };
      
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: [...state.design.fixtures, newFixture],
      };
      
      return {
        ...withDesignChange(state, nextDesign),
        wallDraw: undefined,
        selectedIds: [newFixture.id],
        primarySelectedId: newFixture.id,
      };
    }
    case "CANCEL_WALL_DRAW": {
      return { ...state, wallDraw: undefined };
    }
    // Wall length drag actions
    /**
     * COORDINATE SYSTEM FOR WALL DRAGGING:
     * - SVG/Screen: Origin top-left, X increases RIGHT, Y increases DOWN
     * - isVisuallyHorizontal: true if wall extends left-right on screen (width > height)
     * - For horizontal walls: drag along X axis
     * - For vertical walls: drag along Y axis
     * - Wall is positioned at its CENTER, so we must adjust position to keep one end stationary
     */
    case "START_WALL_LENGTH_DRAG": {
      const { fixtureId, end, isVisuallyHorizontal, pointerStartPx } = action;
      const fixture = state.design.fixtures.find((f) => f.id === fixtureId);
      if (!fixture) return state;
      const props = fixture.properties as { lengthOverrideFt?: number } | undefined;
      const initialLengthFt = props?.lengthOverrideFt ?? 4; // Default wall length
      return {
        ...state,
        wallLengthDrag: {
          fixtureId,
          end,
          initialLengthFt,
          initialXFt: fixture.xFt,
          initialYFt: fixture.yFt,
          isVisuallyHorizontal,
          pointerStartPx,
        },
      };
    }
    case "UPDATE_WALL_LENGTH_DRAG": {
      if (!state.wallLengthDrag) return state;
      const { pointerCurrentPx, scalePxPerFt } = action;
      const { fixtureId, end, initialLengthFt, initialXFt, initialYFt, isVisuallyHorizontal, pointerStartPx } = state.wallLengthDrag;
      
      const fixture = state.design.fixtures.find((f) => f.id === fixtureId);
      if (!fixture) return state;
      
      // Calculate delta in feet based on VISUAL orientation (not rotationDeg)
      // For horizontal wall: drag along X axis
      // For vertical wall: drag along Y axis
      const deltaPx = isVisuallyHorizontal
        ? pointerCurrentPx.x - pointerStartPx.x
        : pointerCurrentPx.y - pointerStartPx.y;
      const rawDeltaFt = deltaPx / scalePxPerFt;
      
      // Determine if this drag extends or shrinks the wall
      // "end" grip: positive drag = extend, "start" grip: positive drag = shrink
      const lengthDeltaFt = end === "end" ? rawDeltaFt : -rawDeltaFt;
      
      // Calculate new length (minimum 1ft) - NO SNAPPING during drag for smooth movement
      const newLengthFt = Math.max(1, initialLengthFt + lengthDeltaFt);
      const actualLengthChange = newLengthFt - initialLengthFt;
      
      // Move the center position to keep the OPPOSITE end stationary
      // If dragging "end" grip: move center by +half the length change
      // If dragging "start" grip: move center by -half the length change
      const positionDelta = actualLengthChange / 2;
      let newXFt = initialXFt;
      let newYFt = initialYFt;
      
      if (isVisuallyHorizontal) {
        // Wall extends along X, so shift X position
        newXFt = end === "end" 
          ? initialXFt + positionDelta 
          : initialXFt - positionDelta;
      } else {
        // Wall extends along Y, so shift Y position
        newYFt = end === "end" 
          ? initialYFt + positionDelta 
          : initialYFt - positionDelta;
      }
      
      // NO position snapping during drag - will snap on release
      
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === fixtureId
            ? {
                ...f,
                xFt: newXFt,
                yFt: newYFt,
                properties: {
                  ...(f.properties ?? {}),
                  lengthOverrideFt: newLengthFt,
                },
              }
            : f
        ),
      };
      
      return { ...state, design: nextDesign };
    }
    case "END_WALL_LENGTH_DRAG": {
      if (!state.wallLengthDrag) return state;
      const { fixtureId, end, isVisuallyHorizontal, initialXFt, initialYFt, initialLengthFt } = state.wallLengthDrag;
      
      // Calculate the fixed edge position (the end that wasn't dragged)
      // This edge should stay in place after snapping
      let fixedEdgeFt: number;
      if (isVisuallyHorizontal) {
        // For horizontal wall, fixed edge is on X axis
        fixedEdgeFt = end === "end" 
          ? initialXFt - initialLengthFt / 2  // Left edge is fixed when dragging right
          : initialXFt + initialLengthFt / 2; // Right edge is fixed when dragging left
      } else {
        // For vertical wall, fixed edge is on Y axis
        fixedEdgeFt = end === "end"
          ? initialYFt - initialLengthFt / 2  // Top edge is fixed when dragging bottom
          : initialYFt + initialLengthFt / 2; // Bottom edge is fixed when dragging top
      }
      
      // Snap the fixed edge to grid
      const snappedFixedEdge = snapToIncrement(fixedEdgeFt, state.snapIncrement);
      
      // Snap the final values, calculating center to preserve the fixed edge
      const snappedDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) => {
          if (f.id !== fixtureId) return f;
          const props = f.properties as { lengthOverrideFt?: number } | undefined;
          const currentLength = props?.lengthOverrideFt ?? 4;
          const snappedLength = snapToIncrement(currentLength, state.snapIncrement);
          
          // Calculate center position that keeps the fixed edge at snappedFixedEdge
          let newXFt = f.xFt;
          let newYFt = f.yFt;
          
          if (isVisuallyHorizontal) {
            // Center = fixedEdge + length/2 (if fixed is left) or fixedEdge - length/2 (if fixed is right)
            newXFt = end === "end"
              ? snappedFixedEdge + snappedLength / 2  // Fixed left edge
              : snappedFixedEdge - snappedLength / 2; // Fixed right edge
            newYFt = snapToIncrement(f.yFt, state.snapIncrement);
          } else {
            newXFt = snapToIncrement(f.xFt, state.snapIncrement);
            // Center = fixedEdge + length/2 (if fixed is top) or fixedEdge - length/2 (if fixed is bottom)
            newYFt = end === "end"
              ? snappedFixedEdge + snappedLength / 2  // Fixed top edge
              : snappedFixedEdge - snappedLength / 2; // Fixed bottom edge
          }
          
          return {
            ...f,
            xFt: newXFt,
            yFt: newYFt,
            properties: {
              ...(f.properties ?? {}),
              lengthOverrideFt: snappedLength,
            },
          };
        }),
      };
      
      return {
        ...withDesignChange(state, snappedDesign),
        wallLengthDrag: undefined,
      };
    }
    // Fixture property updates
    case "UPDATE_FIXTURE_PROPERTIES": {
      const { id, properties } = action;
      const nextDesign: DesignConfig = {
        ...state.design,
        fixtures: state.design.fixtures.map((f) =>
          f.id === id
            ? {
                ...f,
                properties: {
                  ...(f.properties ?? {}),
                  ...properties,
                },
              }
            : f
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    // Annotation actions
    case "ADD_ANNOTATION": {
      const { anchorFt, labelFt, text } = action;
      const newAnnotation = {
        id: generateUUID(),
        anchorFt,
        labelFt,
        text: text ?? "",
      };
      const nextDesign: DesignConfig = {
        ...state.design,
        annotations: [...(state.design.annotations ?? []), newAnnotation],
      };
      return {
        ...withDesignChange(state, nextDesign),
        selectedAnnotationId: newAnnotation.id,
        // Clear fixture/zone selection when adding annotation
        selectedIds: [],
        primarySelectedId: undefined,
        selectedZoneId: undefined,
      };
    }
    case "UPDATE_ANNOTATION": {
      const { id, anchorFt, labelFt, text, color } = action;
      const annotations = state.design.annotations ?? [];
      const annotation = annotations.find((a) => a.id === id);
      if (!annotation) return state;
      
      const updates: Partial<typeof annotation> = {};
      if (anchorFt !== undefined) updates.anchorFt = anchorFt;
      if (labelFt !== undefined) updates.labelFt = labelFt;
      if (text !== undefined) updates.text = text;
      if (color !== undefined) updates.color = color;
      
      const nextDesign: DesignConfig = {
        ...state.design,
        annotations: annotations.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      };
      return withDesignChange(state, nextDesign);
    }
    case "REMOVE_ANNOTATION": {
      const annotations = state.design.annotations ?? [];
      const nextDesign: DesignConfig = {
        ...state.design,
        annotations: annotations.filter((a) => a.id !== action.id),
      };
      return {
        ...withDesignChange(state, nextDesign),
        selectedAnnotationId: state.selectedAnnotationId === action.id
          ? undefined
          : state.selectedAnnotationId,
      };
    }
    case "SELECT_ANNOTATION": {
      return {
        ...state,
        selectedAnnotationId: action.id,
        // Clear other selections when selecting annotation
        selectedIds: [],
        primarySelectedId: undefined,
        selectedZoneId: undefined,
      };
    }
    case "START_ANNOTATION_DRAG": {
      const { id, target, pointerStartPx } = action;
      const annotations = state.design.annotations ?? [];
      const annotation = annotations.find((a) => a.id === id);
      if (!annotation) return state;
      
      const startFt = target === "anchor" ? annotation.anchorFt : annotation.labelFt;
      
      return {
        ...state,
        annotationDrag: {
          annotationId: id,
          target,
          startFt: { x: startFt.x, y: startFt.y },
          pointerStartPx,
        },
        selectedAnnotationId: id,
        // Clear other selections
        selectedIds: [],
        primarySelectedId: undefined,
        selectedZoneId: undefined,
      };
    }
    case "UPDATE_ANNOTATION_DRAG": {
      if (!state.annotationDrag) return state;
      const { pointerCurrentPx, scalePxPerFt } = action;
      const { annotationId, target, startFt, pointerStartPx } = state.annotationDrag;
      
      const annotations = state.design.annotations ?? [];
      const annotation = annotations.find((a) => a.id === annotationId);
      if (!annotation) return state;
      
      const deltaXPx = pointerCurrentPx.x - pointerStartPx.x;
      const deltaYPx = pointerCurrentPx.y - pointerStartPx.y;
      const newXFt = startFt.x + deltaXPx / scalePxPerFt;
      const newYFt = startFt.y + deltaYPx / scalePxPerFt;
      
      const increment = state.snapIncrement;
      const snappedX = snapToIncrement(newXFt, increment);
      const snappedY = snapToIncrement(newYFt, increment);
      
      const updatedAnnotation = target === "anchor"
        ? { ...annotation, anchorFt: { x: snappedX, y: snappedY } }
        : { ...annotation, labelFt: { x: snappedX, y: snappedY } };
      
      return {
        ...state,
        design: {
          ...state.design,
          annotations: annotations.map((a) =>
            a.id === annotationId ? updatedAnnotation : a
          ),
        },
      };
    }
    case "END_ANNOTATION_DRAG": {
      // Commit the design change to history when drag ends
      return {
        ...withDesignChange(state, state.design),
        annotationDrag: undefined,
      };
    }
    default:
      return state;
  }
}

