"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AnnotationDragState,
  DesignAction,
  DesignConfig,
  DragState,
  MarqueeState,
  ModuleCatalogItem,
  ValidationIssue,
  ViewportState,
  WallDrawState,
  WallLengthDragState,
  ZoneDragState,
  ZoneResizeState,
} from "@/types/design";
import type { ToolType } from "./Toolbar";
import { rectFromFixture } from "@/lib/design/geometry";
import { Fixture2DRenderer } from "./Fixture2DRenderer";
import { AnnotationLayer } from "./AnnotationLayer";

const BASE_SCALE = 32;
const CANVAS_PADDING = 80;
const DROP_MIME = "application/x-readybuilt-fixture";
const ALIGN_THRESHOLD_FT = 0.25;

type DebugLogFn = (type: "click" | "action" | "state" | "coord" | "error" | "info", message: string, data?: Record<string, unknown>) => void;

type FixtureCanvasProps = {
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  selectedIds: string[];
  selectedZoneId?: string;
  selectedAnnotationId?: string;
  validationIssues: ValidationIssue[];
  viewport: ViewportState;
  snapIncrement: number;
  dragState?: DragState;
  zoneDragState?: ZoneDragState;
  zoneResizeState?: ZoneResizeState;
  marqueeState?: MarqueeState;
  wallDrawState?: WallDrawState;
  wallLengthDragState?: WallLengthDragState;
  annotationDragState?: AnnotationDragState;
  dispatch: (action: DesignAction) => void;
  onAddFixtureAt: (
    catalogKey: string,
    coords: { xFt: number; yFt: number }
  ) => void;
  activeTool?: ToolType;
  zoneEditMode?: boolean;
  onDebugLog?: DebugLogFn;
  pendingPlacement?: ModuleCatalogItem | null;
  pendingPlacementRotation?: 0 | 90 | 180 | 270;
  onPlaceFixture?: (catalogKey: string, coords: { xFt: number; yFt: number }) => void;
  onEditAnnotation?: (id: string) => void;
};

export function FixtureCanvas({
  design,
  catalog,
  selectedIds,
  selectedZoneId,
  selectedAnnotationId,
  validationIssues,
  viewport,
  snapIncrement,
  dragState,
  zoneDragState,
  zoneResizeState,
  marqueeState,
  wallDrawState,
  wallLengthDragState,
  annotationDragState,
  dispatch,
  onAddFixtureAt,
  activeTool = "select",
  zoneEditMode = false,
  onDebugLog,
  pendingPlacement,
  pendingPlacementRotation = 0,
  onPlaceFixture,
  onEditAnnotation,
}: FixtureCanvasProps) {
  // Debug log helper (no-op if not provided)
  const log: DebugLogFn = onDebugLog || (() => {});
  const svgRef = useRef<SVGSVGElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number } | null>(
    null
  );
  const [hoveredFixtureId, setHoveredFixtureId] = useState<string | null>(null);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [hoveredResizeHandle, setHoveredResizeHandle] = useState<string | null>(null);
  const [measurePoints, setMeasurePoints] = useState<
    Array<{ xFt: number; yFt: number }>
  >([]);
  const [wallSnapPreview, setWallSnapPreview] = useState<{ xFt: number; yFt: number } | null>(null);
  const [placementPreview, setPlacementPreview] = useState<{ xFt: number; yFt: number } | null>(null);
  const [measureSnapPreview, setMeasureSnapPreview] = useState<{ xFt: number; yFt: number } | null>(null);

  // Add touch refs/state:
  const touchStartDistanceRef = useRef(0);
  const lastTouchCenterRef = useRef({ x: 0, y: 0 });

  // Log wallDrawState changes for debugging
  useEffect(() => {
    log("state", `wallDrawState changed`, {
      hasState: !!wallDrawState,
      startPoint: wallDrawState?.startPoint ?? "none",
      currentPoint: wallDrawState?.currentPoint ?? "none",
    });
  }, [wallDrawState, log]);

  // Clear measure points and preview when switching away from measure tool
  useEffect(() => {
    if (activeTool !== "measure") {
      setMeasurePoints([]);
      setMeasureSnapPreview(null);
    }
  }, [activeTool]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const errorSet = useMemo(
    () =>
      new Set(
        validationIssues
          .filter((issue) => issue.level === "error" && issue.fixtureId)
          .map((issue) => issue.fixtureId as string)
      ),
    [validationIssues]
  );

  const shellWidthPx = design.shell.lengthFt * BASE_SCALE;
  const shellHeightPx = design.shell.widthFt * BASE_SCALE;

  const gridLinesX = useMemo(() => {
    const lines: number[] = [];
    const spacing = snapIncrement > 0 ? snapIncrement : 0.5;
    for (let ft = 0; ft <= design.shell.lengthFt; ft += spacing) {
      lines.push(ft);
    }
    return lines;
  }, [design.shell.lengthFt, snapIncrement]);

  const gridLinesY = useMemo(() => {
    const lines: number[] = [];
    const spacing = snapIncrement > 0 ? snapIncrement : 0.5;
    for (let ft = 0; ft <= design.shell.widthFt; ft += spacing) {
      lines.push(ft);
    }
    return lines;
  }, [design.shell.widthFt, snapIncrement]);

  const collisionRects = useMemo(
    () => computeCollisions(design, catalog),
    [design, catalog]
  );
  const clearanceRects = useMemo(
    () => computeClearances(design, catalog),
    [design, catalog]
  );
  const selectionBounds = useMemo(
    () => computeSelectionBounds(design, catalog, selectedIds),
    [design, catalog, selectedIds]
  );
  const alignmentGuides = useMemo(
    () => computeAlignmentGuides(design, catalog, selectedIds),
    [design, catalog, selectedIds]
  );

  // Calculate viewBox dimensions for coordinate conversion
  const viewBoxWidth = shellWidthPx + CANVAS_PADDING * 2;
  const viewBoxHeight = shellHeightPx + CANVAS_PADDING * 2;

  /**
   * Convert screen coordinates to SVG viewBox coordinates
   * This properly handles aspect ratio preservation (default SVG behavior)
   * and accounts for centering when the container doesn't match the viewBox aspect ratio.
   * Works dynamically on any device/screen size.
   */
  const screenToViewBox = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    
    // Get actual rendered size on this device (dynamic!)
    const bounds = svg.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return null;
    
    // Calculate how the browser scaled the viewBox to fit (preserving aspect ratio)
    // The browser uses the smaller scale to ensure the entire viewBox fits
    const scaleX = bounds.width / viewBoxWidth;
    const scaleY = bounds.height / viewBoxHeight;
    const actualScale = Math.min(scaleX, scaleY);
    
    // Calculate the actual rendered size of the viewBox content
    const renderedWidth = viewBoxWidth * actualScale;
    const renderedHeight = viewBoxHeight * actualScale;
    
    // Calculate centering offset (SVG centers content by default with xMidYMid)
    const offsetX = (bounds.width - renderedWidth) / 2;
    const offsetY = (bounds.height - renderedHeight) / 2;
    
    // Convert screen coords to viewBox coords
    // 1. Subtract bounds.left/top to get coords relative to SVG element
    // 2. Subtract centering offset to get coords relative to actual content
    // 3. Divide by actualScale to convert from screen pixels to viewBox units
    return {
      x: (clientX - bounds.left - offsetX) / actualScale,
      y: (clientY - bounds.top - offsetY) / actualScale,
    };
  };

  /**
   * Convert screen coordinates to world coordinates (inside the viewport transform group)
   * This applies the inverse of the viewport transform to viewBox coords
   */
  const screenToWorldPx = (clientX: number, clientY: number) => {
    const vb = screenToViewBox(clientX, clientY);
    if (!vb) return null;
    
    // Apply inverse viewport transform (reverse translate then scale)
    return {
      x: (vb.x - viewport.offsetX) / viewport.scale,
      y: (vb.y - viewport.offsetY) / viewport.scale,
    };
  };

  /**
   * Convert screen coordinates to feet (design coordinates)
   * Uses world coordinates which are inside the viewport transform
   */
  const screenToFt = (clientX: number, clientY: number) => {
    const world = screenToWorldPx(clientX, clientY);
    if (!world) return null;
    return {
      xFt: (world.x - CANVAS_PADDING) / BASE_SCALE,
      yFt: (world.y - CANVAS_PADDING) / BASE_SCALE,
    };
  };

  /**
   * Calculate pan multiplier that adapts to screen size and zoom level.
   * This ensures consistent panning feel across different devices and screen sizes.
   */
  const getPanMultiplier = () => {
    const svg = svgRef.current;
    if (!svg) return 1 / viewport.scale;
    
    const bounds = svg.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) return 1 / viewport.scale;
    
    // Calculate how the browser scaled the viewBox to fit the container
    const actualScale = Math.min(bounds.width / viewBoxWidth, bounds.height / viewBoxHeight);
    
    // Pan multiplier: converts screen pixels to viewBox units, accounting for zoom
    // Large screens -> smaller multiplier, small screens -> larger multiplier
    return 1 / (actualScale * viewport.scale);
  };

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds) return;
    dispatch({
      type: "ZOOM_VIEWPORT",
      deltaScale: -event.deltaY * 0.001,
      centerPx: {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      },
    });
  };

  const startPan = (clientX: number, clientY: number) => {
    setIsPanning(true);
    setPanOrigin({ x: clientX, y: clientY });
  };

  const stopPan = () => {
    setIsPanning(false);
    setPanOrigin(null);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    // Handle zone dragging
    if (zoneDragState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      if (!point) return;
      dispatch({
        type: "UPDATE_ZONE_DRAG",
        pointerCurrentPx: point,
        scalePxPerFt: BASE_SCALE,
      });
      return;
    }

    // Handle zone resizing
    if (zoneResizeState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      if (!point) return;
      dispatch({
        type: "UPDATE_ZONE_RESIZE",
        pointerCurrentPx: point,
        scalePxPerFt: BASE_SCALE,
      });
      return;
    }

    // Handle wall length dragging
    if (wallLengthDragState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      if (!point) return;
      dispatch({
        type: "UPDATE_WALL_LENGTH_DRAG",
        pointerCurrentPx: point,
        scalePxPerFt: BASE_SCALE,
      });
      return;
    }

    // Handle annotation dragging - use raw screen coords since that's what we stored at drag start
    if (annotationDragState) {
      dispatch({
        type: "UPDATE_ANNOTATION_DRAG",
        pointerCurrentPx: { x: event.clientX, y: event.clientY },
        scalePxPerFt: BASE_SCALE * viewport.scale, // Account for viewport zoom
      });
      return;
    }

    // Handle wall drawing preview
    if (wallDrawState && activeTool === "wall") {
      const coords = screenToFt(event.clientX, event.clientY);
      if (!coords) return;
      dispatch({
        type: "UPDATE_WALL_DRAW",
        currentPoint: coords,
      });
      return;
    }

    if (dragState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      if (!point) return;
      dispatch({
        type: "UPDATE_DRAG",
        pointerCurrentPx: point,
        scalePxPerFt: BASE_SCALE,
      });
      return;
    }

    if (isPanning && panOrigin) {
      const multiplier = getPanMultiplier();
      const deltaX = (event.clientX - panOrigin.x) * multiplier;
      const deltaY = (event.clientY - panOrigin.y) * multiplier;
      setPanOrigin({ x: event.clientX, y: event.clientY });
      dispatch({ type: "PAN_VIEWPORT", deltaPx: { x: deltaX, y: deltaY } });
      return;
    }

    if (marqueeState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      if (!point) return;
      dispatch({ type: "UPDATE_MARQUEE", current: point });
      return;
    }

    // Wall tool snap preview - show where the start point will snap to before clicking
    if (activeTool === "wall" && !wallDrawState) {
      const coords = screenToFt(event.clientX, event.clientY);
      if (coords) {
        // Apply snapping to show where point will actually land
        const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
        const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
        setWallSnapPreview({ xFt: snappedX, yFt: snappedY });
      } else {
        setWallSnapPreview(null);
      }
    } else if (wallSnapPreview) {
      // Clear preview when not in wall tool or when drawing has started
      setWallSnapPreview(null);
    }

    // Placement mode preview - show ghost fixture following cursor
    if (pendingPlacement) {
      const coords = screenToFt(event.clientX, event.clientY);
      if (coords) {
        // Apply snapping to the placement preview
        const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
        const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
        setPlacementPreview({ xFt: snappedX, yFt: snappedY });
      } else {
        setPlacementPreview(null);
      }
    } else if (placementPreview) {
      setPlacementPreview(null);
    }

    // Measure tool snap preview - show where the next point will be placed
    if (activeTool === "measure") {
      const coords = screenToFt(event.clientX, event.clientY);
      if (coords) {
        const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
        const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
        setMeasureSnapPreview({ xFt: snappedX, yFt: snappedY });
      } else {
        setMeasureSnapPreview(null);
      }
    } else if (measureSnapPreview) {
      setMeasureSnapPreview(null);
    }
  };

  const finalizeMarquee = () => {
    if (!marqueeState) return;
    const minX = Math.min(marqueeState.origin.x, marqueeState.current.x);
    const maxX = Math.max(marqueeState.origin.x, marqueeState.current.x);
    const minY = Math.min(marqueeState.origin.y, marqueeState.current.y);
    const maxY = Math.max(marqueeState.origin.y, marqueeState.current.y);
    const ids = design.fixtures
      .filter((fixture) => {
        const catalogItem = catalog[fixture.catalogKey];
        if (!catalogItem) return false;
        const rect = rectFromFixture(fixture, catalogItem);
        const pxRect = {
          x: CANVAS_PADDING + rect.x * BASE_SCALE,
          y: CANVAS_PADDING + rect.y * BASE_SCALE,
          width: rect.width * BASE_SCALE,
          height: rect.height * BASE_SCALE,
        };
        return (
          pxRect.x < maxX &&
          pxRect.x + pxRect.width > minX &&
          pxRect.y < maxY &&
          pxRect.y + pxRect.height > minY
        );
      })
      .map((fixture) => fixture.id);
    if (ids.length > 0) {
      dispatch({ type: "SELECT_FIXTURES", ids });
    } else {
      dispatch({ type: "CLEAR_SELECTION" });
    }
    dispatch({ type: "END_MARQUEE" });
  };

  const handlePointerUp = (event: React.PointerEvent<SVGSVGElement>) => {
    if (zoneDragState) {
      dispatch({ type: "END_ZONE_DRAG" });
    }
    if (zoneResizeState) {
      dispatch({ type: "END_ZONE_RESIZE" });
    }
    if (wallLengthDragState) {
      dispatch({ type: "END_WALL_LENGTH_DRAG" });
    }
    if (annotationDragState) {
      dispatch({ type: "END_ANNOTATION_DRAG" });
    }
    if (dragState) {
      dispatch({ type: "END_DRAG" });
    }
    if (isPanning) {
      stopPan();
    }
    if (marqueeState) {
      finalizeMarquee();
    }
    // Release pointer capture if it was set for panning
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const handleBackgroundPointerDown = (
    event: React.PointerEvent<SVGRectElement>
  ) => {
    log("click", "Background PointerDown", {
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      activeTool,
    });

    // Middle mouse button or modifier keys = pan
    if (event.button === 1 || event.metaKey || event.altKey || event.ctrlKey) {
      log("action", "Starting pan from background");
      event.preventDefault();
      startPan(event.clientX, event.clientY);
      // Capture pointer to ensure smooth panning
      (event.target as Element).setPointerCapture(event.pointerId);
      return;
    }
    
    // Wall tool clicks are handled at SVG level, skip marquee for wall tool
    if (activeTool === "wall") {
      log("info", "Background click ignored - wall tool active, letting bubble to SVG");
      return;
    }
    
    const point = screenToWorldPx(event.clientX, event.clientY);
    if (!point) return;
    log("action", "Starting marquee selection", { origin: point });
    dispatch({ type: "START_MARQUEE", origin: point });
    if (!event.shiftKey) {
      dispatch({ type: "CLEAR_SELECTION" });
    }
  };

  const handleSvgPointerDown = (
    event: React.PointerEvent<SVGSVGElement>
  ) => {
    const targetTag = (event.target as Element).tagName;
    log("click", `SVG PointerDown - target: ${targetTag}, button: ${event.button}`, {
      clientX: event.clientX,
      clientY: event.clientY,
      target: targetTag,
      activeTool,
      hasWallDrawState: !!wallDrawState,
    });

    // Handle middle mouse button panning at SVG level to work everywhere
    if (event.button === 1 || (activeTool === "pan" && event.button === 0)) {
      log("action", "Starting pan from SVG");
      event.preventDefault();
      startPan(event.clientX, event.clientY);
      svgRef.current?.setPointerCapture(event.pointerId);
      return;
    }

    // Placement mode - click to place fixture
    if (pendingPlacement && onPlaceFixture && event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      const coords = screenToFt(event.clientX, event.clientY);
      if (!coords) {
        log("error", "Placement - screenToFt returned null");
        return;
      }
      // Snap to grid
      const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
      const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
      log("action", "Placing fixture", { 
        catalogKey: pendingPlacement.key, 
        coords: { xFt: snappedX, yFt: snappedY } 
      });
      onPlaceFixture(pendingPlacement.key, { xFt: snappedX, yFt: snappedY });
      return;
    }
    
    // Wall drawing tool - handle at SVG level so it works regardless of what element is clicked
    if (activeTool === "wall" && event.button === 0) {
      event.preventDefault();
      const coords = screenToFt(event.clientX, event.clientY);
      log("coord", "Wall tool - screenToFt result", {
        clientX: event.clientX,
        clientY: event.clientY,
        coords: coords ?? "null",
      });
      if (!coords) {
        log("error", "screenToFt returned null - click may be outside canvas");
        return;
      }
      
      if (!wallDrawState) {
        // First click - start wall drawing
        log("action", "START_WALL_DRAW dispatched", { startPoint: coords });
        dispatch({ type: "START_WALL_DRAW", startPoint: coords });
      } else {
        // Second click - end wall drawing and place the wall
        log("action", "END_WALL_DRAW dispatched", { 
          startPoint: wallDrawState.startPoint,
          endPoint: coords 
        });
        dispatch({ type: "END_WALL_DRAW", endPoint: coords });
      }
      return;
    }

    // Measure tool - click to add points
    if (activeTool === "measure" && event.button === 0) {
      event.preventDefault();
      const coords = screenToFt(event.clientX, event.clientY);
      if (!coords) return;
      
      // Snap to grid
      const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
      const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
      
      setMeasurePoints((prev) => {
        // If we already have 2 points, start fresh with this as the new first point
        if (prev.length >= 2) {
          return [{ xFt: snappedX, yFt: snappedY }];
        }
        // Otherwise add the new point
        return [...prev, { xFt: snappedX, yFt: snappedY }];
      });
      return;
    }

    // Annotate tool - click to add annotation
    if (activeTool === "annotate" && event.button === 0) {
      event.preventDefault();
      const coords = screenToFt(event.clientX, event.clientY);
      if (!coords) return;
      
      // Snap to grid
      const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
      const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
      
      // Place anchor at click position, label offset by 2ft up and to the right
      const anchorFt = { x: snappedX, y: snappedY };
      const labelFt = { 
        x: snappedX + 2, 
        y: Math.max(0, snappedY - 2) 
      };
      
      log("action", "ADD_ANNOTATION dispatched", { anchorFt, labelFt });
      dispatch({ type: "ADD_ANNOTATION", anchorFt, labelFt });
      return;
    }
  };

  const handleFixturePointerDown = (
    event: React.PointerEvent<SVGElement>,
    fixtureId: string
  ) => {
    log("click", `Fixture PointerDown: ${fixtureId}`, {
      fixtureId,
      activeTool,
      zoneEditMode,
    });

    // Don't handle fixture selection when in zone edit mode or wall tool is active
    if (zoneEditMode) {
      log("info", "Fixture click ignored - zoneEditMode active");
      return;
    }
    if (activeTool === "wall") {
      log("info", "Fixture click ignored - wall tool active, letting bubble to SVG");
      return; // Let SVG handler deal with wall clicks
    }
    
    log("info", "Fixture click stopping propagation");
    event.stopPropagation();
    const fixture = design.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) return;
    
    // Don't allow selection or drag of locked fixtures
    if (fixture.locked) {
      log("info", "Fixture click ignored - fixture is locked");
      return;
    }
    
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) return;
    const rect = rectFromFixture(fixture, catalogItem);
    const point = screenToWorldPx(event.clientX, event.clientY);
    if (!point) return;
    dispatch({
      type: "SELECT_FIXTURE",
      id: fixtureId,
      append: event.shiftKey,
    });
    dispatch({
      type: "START_DRAG",
      id: fixtureId,
      pointerStartPx: point,
      fixtureWidth: rect.width,
      fixtureHeight: rect.height,
      footprintAnchor: catalogItem.footprintAnchor,
    });
  };

  const handleZonePointerDown = (
    event: React.PointerEvent<SVGElement>,
    zoneId: string
  ) => {
    log("click", `Zone PointerDown: ${zoneId}`, {
      zoneId,
      zoneEditMode,
      activeTool,
    });

    if (!zoneEditMode) {
      log("info", "Zone click ignored - zoneEditMode not active");
      return;
    }
    log("info", "Zone click stopping propagation");
    event.stopPropagation();
    const point = screenToWorldPx(event.clientX, event.clientY);
    if (!point) return;
    dispatch({ type: "SELECT_ZONE", id: zoneId });
    dispatch({
      type: "START_ZONE_DRAG",
      id: zoneId,
      pointerStartPx: point,
    });
  };

  const handleZoneResizePointerDown = (
    event: React.PointerEvent<SVGElement>,
    zoneId: string,
    handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
  ) => {
    if (!zoneEditMode) return;
    event.stopPropagation();
    const point = screenToWorldPx(event.clientX, event.clientY);
    if (!point) return;
    dispatch({ type: "SELECT_ZONE", id: zoneId });
    dispatch({
      type: "START_ZONE_RESIZE",
      id: zoneId,
      handle,
      pointerStartPx: point,
    });
  };

  const handleDragOver = (event: React.DragEvent<SVGSVGElement>) => {
    if (event.dataTransfer.types.includes(DROP_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (event: React.DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData(DROP_MIME);
    if (!raw) return;
    const payload = JSON.parse(raw) as { catalogKey: string };
    const coords = screenToFt(event.clientX, event.clientY);
    if (!coords) return;
    onAddFixtureAt(payload.catalogKey, coords);
  };

  const handleRotate = (fixtureId: string, direction: 1 | -1) => {
    const fixture = design.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) return;
    const next = (((fixture.rotationDeg + direction * 90) % 360) + 360) % 360;
    dispatch({
      type: "UPDATE_FIXTURE_ROTATION",
      id: fixtureId,
      rotationDeg: next as 0 | 90 | 180 | 270,
    });
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistanceRef.current = Math.sqrt(dx*dx + dy*dy);
      lastTouchCenterRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1 && isPanning && panOrigin) {
      // Single touch pan with screen-size-aware sensitivity
      const touch = e.touches[0];
      const multiplier = getPanMultiplier() * 1.5; // Slight boost for touch
      const deltaX = (touch.clientX - panOrigin.x) * multiplier;
      const deltaY = (touch.clientY - panOrigin.y) * multiplier;
      setPanOrigin({ x: touch.clientX, y: touch.clientY });
      dispatch({ type: "PAN_VIEWPORT", deltaPx: { x: deltaX, y: deltaY } });
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx*dx + dy*dy);
      const deltaDistance = distance - touchStartDistanceRef.current;
      const deltaScale = deltaDistance * 0.005; // Pinch sensitivity
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      const bounds = svgRef.current?.getBoundingClientRect();
      if (bounds) {
        dispatch({
          type: "ZOOM_VIEWPORT",
          deltaScale,
          centerPx: { x: center.x - bounds.left, y: center.y - bounds.top },
        });
      }
      touchStartDistanceRef.current = distance;
      lastTouchCenterRef.current = center;
    }
  };

  const handleTouchEnd = () => {
    stopPan();
  };

  return (
    <div className="h-full w-full overflow-hidden bg-slate-950" data-canvas="fixture-canvas">
      <svg
        ref={svgRef}
        className="h-full w-full touch-action-pan-x pan-y pinch-zoom"
        viewBox={`0 0 ${shellWidthPx + CANVAS_PADDING * 2} ${shellHeightPx + CANVAS_PADDING * 2
          }`}
        role="img"
        aria-label="Design workspace"
        style={{ cursor: pendingPlacement ? "crosshair" : undefined }}
        onPointerDown={handleSvgPointerDown}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          {/* Arrow marker for dimension lines */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
          </marker>
        </defs>

        <rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="#020617"
          onPointerDown={handleBackgroundPointerDown}
        />

        <g
          transform={`translate(${viewport.offsetX} ${viewport.offsetY}) scale(${viewport.scale})`}
        >
          <rect
            x={CANVAS_PADDING}
            y={CANVAS_PADDING}
            width={shellWidthPx}
            height={shellHeightPx}
            rx={8}
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth={3}
          />

          {/* Grid - Major lines (every 1ft) */}
          <g stroke="#334155" strokeWidth={1.5}>
            {gridLinesX.filter((ft) => ft % 1 === 0).map((ft) => {
              const x = CANVAS_PADDING + ft * BASE_SCALE;
              return (
                <line
                  key={`grid-major-x-${ft}`}
                  x1={x}
                  x2={x}
                  y1={CANVAS_PADDING}
                  y2={CANVAS_PADDING + shellHeightPx}
                />
              );
            })}
            {gridLinesY.filter((ft) => ft % 1 === 0).map((ft) => {
              const y = CANVAS_PADDING + ft * BASE_SCALE;
              return (
                <line
                  key={`grid-major-y-${ft}`}
                  y1={y}
                  y2={y}
                  x1={CANVAS_PADDING}
                  x2={CANVAS_PADDING + shellWidthPx}
                />
              );
            })}
          </g>

          {/* Grid - Minor lines (every 0.5ft) */}
          <g stroke="#1e293b" strokeWidth={1}>
            {gridLinesX.filter((ft) => ft % 1 !== 0).map((ft) => {
              const x = CANVAS_PADDING + ft * BASE_SCALE;
              return (
                <line
                  key={`grid-minor-x-${ft}`}
                  x1={x}
                  x2={x}
                  y1={CANVAS_PADDING}
                  y2={CANVAS_PADDING + shellHeightPx}
                  strokeDasharray="4 8"
                />
              );
            })}
            {gridLinesY.filter((ft) => ft % 1 !== 0).map((ft) => {
              const y = CANVAS_PADDING + ft * BASE_SCALE;
              return (
                <line
                  key={`grid-minor-y-${ft}`}
                  y1={y}
                  y2={y}
                  x1={CANVAS_PADDING}
                  x2={CANVAS_PADDING + shellWidthPx}
                  strokeDasharray="4 8"
                />
              );
            })}
          </g>

          <g>
            {design.zones.map((zone) => {
              const x = CANVAS_PADDING + zone.xFt * BASE_SCALE;
              const y = CANVAS_PADDING + zone.yFt * BASE_SCALE;
              const width = zone.lengthFt * BASE_SCALE;
              const height = zone.widthFt * BASE_SCALE;
              const isSelected = selectedZoneId === zone.id;
              const isHovered = hoveredZoneId === zone.id;
              const handleSize = 10;
              
              return (
                <g key={zone.id}>
                  {/* Zone background and border */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={isSelected ? "rgba(251,191,36,0.15)" : isHovered && zoneEditMode ? "rgba(34,211,238,0.1)" : "rgba(34,211,238,0.05)"}
                    stroke={isSelected ? "#f59e0b" : "#22d3ee"}
                    strokeDasharray={isSelected ? "none" : "8 12"}
                    strokeWidth={isSelected ? 3 : 2}
                    rx={4}
                    style={{ cursor: zoneEditMode ? "move" : "default" }}
                    onPointerDown={(e) => handleZonePointerDown(e, zone.id)}
                    onPointerEnter={() => zoneEditMode && setHoveredZoneId(zone.id)}
                    onPointerLeave={() => setHoveredZoneId(null)}
                  />
                  
                  {/* Zone name */}
                  <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    fontSize={14}
                    fill={isSelected ? "#f59e0b" : "#22d3ee"}
                    fontFamily="monospace"
                    style={{ 
                      fontWeight: 700, 
                      letterSpacing: "0.2em", 
                      opacity: isSelected ? 0.9 : 0.6,
                      pointerEvents: "none",
                    }}
                  >
                    {zone.name.toUpperCase()}
                  </text>
                  
                  {/* Dimensions label when selected */}
                  {isSelected && zoneEditMode && (
                    <text
                      x={x + width / 2}
                      y={y + height / 2 + 18}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#f59e0b"
                      fontFamily="monospace"
                      style={{ fontWeight: 600, opacity: 0.8, pointerEvents: "none" }}
                    >
                      {zone.lengthFt.toFixed(1)}' × {zone.widthFt.toFixed(1)}'
                    </text>
                  )}
                  
                  {/* Resize handles - only show when zone is selected and in edit mode */}
                  {zoneEditMode && isSelected && (
                    <g>
                      {/* Corner handles */}
                      {/* NW */}
                      <rect
                        x={x - handleSize / 2}
                        y={y - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "nw-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "nw")}
                      />
                      {/* NE */}
                      <rect
                        x={x + width - handleSize / 2}
                        y={y - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "ne-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "ne")}
                      />
                      {/* SW */}
                      <rect
                        x={x - handleSize / 2}
                        y={y + height - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "sw-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "sw")}
                      />
                      {/* SE */}
                      <rect
                        x={x + width - handleSize / 2}
                        y={y + height - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#f59e0b"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "se-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "se")}
                      />
                      
                      {/* Edge handles */}
                      {/* N */}
                      <rect
                        x={x + width / 2 - handleSize / 2}
                        y={y - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "n-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "n")}
                      />
                      {/* S */}
                      <rect
                        x={x + width / 2 - handleSize / 2}
                        y={y + height - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "s-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "s")}
                      />
                      {/* W */}
                      <rect
                        x={x - handleSize / 2}
                        y={y + height / 2 - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "w-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "w")}
                      />
                      {/* E */}
                      <rect
                        x={x + width - handleSize / 2}
                        y={y + height / 2 - handleSize / 2}
                        width={handleSize}
                        height={handleSize}
                        fill="#fbbf24"
                        stroke="#fff"
                        strokeWidth={1}
                        rx={2}
                        style={{ cursor: "e-resize" }}
                        onPointerDown={(e) => handleZoneResizePointerDown(e, zone.id, "e")}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          <g>
            {clearanceRects.map((rect, index) => (
              <rect
                key={`clearance-${index}`}
                x={CANVAS_PADDING + rect.x * BASE_SCALE}
                y={CANVAS_PADDING + rect.y * BASE_SCALE}
                width={rect.width * BASE_SCALE}
                height={rect.height * BASE_SCALE}
                fill="none"
                stroke="rgba(250,204,21,0.6)"
                strokeDasharray="6 10"
                strokeWidth={1}
              />
            ))}
          </g>

          <g>
            {collisionRects.map((rect, index) => (
              <rect
                key={`collision-${index}`}
                x={CANVAS_PADDING + rect.x * BASE_SCALE}
                y={CANVAS_PADDING + rect.y * BASE_SCALE}
                width={rect.width * BASE_SCALE}
                height={rect.height * BASE_SCALE}
                fill="rgba(239,68,68,0.25)"
                stroke="rgba(239,68,68,0.5)"
                strokeWidth={1}
              />
            ))}
          </g>

          {design.fixtures.map((fixture) => {
            const catalogItem = catalog[fixture.catalogKey];
            if (!catalogItem) return null;
            const rect = rectFromFixture(fixture, catalogItem);
            const x = CANVAS_PADDING + rect.x * BASE_SCALE;
            const y = CANVAS_PADDING + rect.y * BASE_SCALE;
            const width = rect.width * BASE_SCALE;
            const height = rect.height * BASE_SCALE;
            const isSelected = selectedSet.has(fixture.id);
            const hasError = errorSet.has(fixture.id);
            const isHovered = hoveredFixtureId === fixture.id;
            const isLocked = fixture.locked ?? false;
            return (
              <g key={fixture.id}>
                {/* Render detailed 2D fixture */}
                <g
                  onPointerDown={(event) =>
                    handleFixturePointerDown(event, fixture.id)
                  }
                  onPointerEnter={() => setHoveredFixtureId(fixture.id)}
                  onPointerLeave={() => setHoveredFixtureId(null)}
                  style={{ cursor: isLocked ? "not-allowed" : "pointer" }}
                  opacity={isLocked ? 0.7 : 1}
                >
                  <Fixture2DRenderer
                    fixture={fixture}
                    catalogItem={catalogItem}
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    isSelected={isSelected}
                    hasError={hasError}
                    isHovered={isHovered}
                  />
                </g>
                
                {/* Lock indicator overlay for locked fixtures */}
                {isLocked && (
                  <g transform={`translate(${x + width - 16}, ${y + 4})`}>
                    <circle cx="8" cy="8" r="10" fill="#f59e0b" opacity="0.9" />
                    <path
                      d="M8 3a3 3 0 00-3 3v2H4a1 1 0 00-1 1v5a1 1 0 001 1h8a1 1 0 001-1v-5a1 1 0 00-1-1h-1V6a3 3 0 00-3-3zm-1.5 5V6a1.5 1.5 0 113 0v2h-3z"
                      fill="white"
                      transform="scale(0.75) translate(2, 2)"
                    />
                  </g>
                )}

                {/* Dimension Annotations on Hover */}
                {isHovered && (
                  <g>
                    {/* Width dimension (top) */}
                    <line
                      x1={x}
                      x2={x + width}
                      y1={y - 20}
                      y2={y - 20}
                      stroke="#fbbf24"
                      strokeWidth={2}
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={x + width / 2}
                      y={y - 25}
                      textAnchor="middle"
                      fontSize={12}
                      fill="#fbbf24"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {rect.width.toFixed(1)}'
                    </text>

                    {/* Height dimension (right) */}
                    <line
                      x1={x + width + 20}
                      x2={x + width + 20}
                      y1={y}
                      y2={y + height}
                      stroke="#fbbf24"
                      strokeWidth={2}
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={x + width + 25}
                      y={y + height / 2 + 5}
                      textAnchor="start"
                      fontSize={12}
                      fill="#fbbf24"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {rect.height.toFixed(1)}'
                    </text>
                  </g>
                )}
                {isSelected && (
                  <g>
                    {/* Rotation handle - using Lucide RotateCw icon */}
                    <g
                      style={{ cursor: "pointer" }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        handleRotate(fixture.id, event.altKey ? -1 : 1);
                      }}
                    >
                      {/* Background circle */}
                      <circle
                        cx={x + width / 2}
                        cy={y - 20}
                        r={14}
                        fill="#38bdf8"
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                      {/* Lucide RotateCw icon - scaled and centered */}
                      <g transform={`translate(${x + width / 2 - 9}, ${y - 29}) scale(0.75)`}>
                        <path
                          d="M21 2v6h-6"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 13a9 9 0 1 1-3-7.7L21 8"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </g>
                    
                    {/* Wall-specific end grips for length adjustment (draggable) */}
                    {fixture.catalogKey === "fixture-wall" && (() => {
                      // Determine visual orientation by comparing width and height
                      const isVisuallyHorizontal = width > height;
                      const gripSize = 8;
                      
                      if (isVisuallyHorizontal) {
                        // Wall extends left-right, grips at left and right ends
                        return (
                          <>
                            {/* Left end grip */}
                            <circle
                              cx={x}
                              cy={y + height / 2}
                              r={gripSize}
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth={2}
                              style={{ cursor: "ew-resize" }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                // Capture pointer to prevent text selection during drag
                                (event.target as Element).setPointerCapture(event.pointerId);
                                const pt = screenToWorldPx(event.clientX, event.clientY);
                                if (pt) {
                                  dispatch({
                                    type: "START_WALL_LENGTH_DRAG",
                                    fixtureId: fixture.id,
                                    end: "start",
                                    isVisuallyHorizontal: true,
                                    pointerStartPx: pt,
                                  });
                                }
                              }}
                            />
                            {/* Right end grip */}
                            <circle
                              cx={x + width}
                              cy={y + height / 2}
                              r={gripSize}
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth={2}
                              style={{ cursor: "ew-resize" }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                (event.target as Element).setPointerCapture(event.pointerId);
                                const pt = screenToWorldPx(event.clientX, event.clientY);
                                if (pt) {
                                  dispatch({
                                    type: "START_WALL_LENGTH_DRAG",
                                    fixtureId: fixture.id,
                                    end: "end",
                                    isVisuallyHorizontal: true,
                                    pointerStartPx: pt,
                                  });
                                }
                              }}
                            />
                          </>
                        );
                      } else {
                        // Wall extends top-bottom, grips at top and bottom ends
                        return (
                          <>
                            {/* Top end grip */}
                            <circle
                              cx={x + width / 2}
                              cy={y}
                              r={gripSize}
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth={2}
                              style={{ cursor: "ns-resize" }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                (event.target as Element).setPointerCapture(event.pointerId);
                                const pt = screenToWorldPx(event.clientX, event.clientY);
                                if (pt) {
                                  dispatch({
                                    type: "START_WALL_LENGTH_DRAG",
                                    fixtureId: fixture.id,
                                    end: "start",
                                    isVisuallyHorizontal: false,
                                    pointerStartPx: pt,
                                  });
                                }
                              }}
                            />
                            {/* Bottom end grip */}
                            <circle
                              cx={x + width / 2}
                              cy={y + height}
                              r={gripSize}
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth={2}
                              style={{ cursor: "ns-resize" }}
                              onPointerDown={(event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                (event.target as Element).setPointerCapture(event.pointerId);
                                const pt = screenToWorldPx(event.clientX, event.clientY);
                                if (pt) {
                                  dispatch({
                                    type: "START_WALL_LENGTH_DRAG",
                                    fixtureId: fixture.id,
                                    end: "end",
                                    isVisuallyHorizontal: false,
                                    pointerStartPx: pt,
                                  });
                                }
                              }}
                            />
                          </>
                        );
                      }
                    })()}
                  </g>
                )}
              </g>
            );
          })}

          {selectionBounds && (
            <rect
              x={selectionBounds.x}
              y={selectionBounds.y}
              width={selectionBounds.width}
              height={selectionBounds.height}
              fill="none"
              stroke="#22d3ee"
              strokeDasharray="10 6"
              strokeWidth={2.5}
            />
          )}

          <g stroke="#d946ef" strokeDasharray="4 4" strokeWidth={1.5} opacity={0.8}>
            {alignmentGuides.map((guide, index) =>
              guide.orientation === "vertical" ? (
                <line
                  key={`guide-v-${index}`}
                  x1={CANVAS_PADDING + guide.value * BASE_SCALE}
                  x2={CANVAS_PADDING + guide.value * BASE_SCALE}
                  y1={CANVAS_PADDING}
                  y2={CANVAS_PADDING + shellHeightPx}
                />
              ) : (
                <line
                  key={`guide-h-${index}`}
                  y1={CANVAS_PADDING + guide.value * BASE_SCALE}
                  y2={CANVAS_PADDING + guide.value * BASE_SCALE}
                  x1={CANVAS_PADDING}
                  x2={CANVAS_PADDING + shellWidthPx}
                />
              )
            )}
          </g>

          {/* Wall Snap Preview - shows where start point will snap before first click */}
          {activeTool === "wall" && !wallDrawState && wallSnapPreview && (
            <g pointerEvents="none">
              {/* Snap point indicator */}
              <circle
                cx={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE}
                cy={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE}
                r={8 / viewport.scale}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={2 / viewport.scale}
                opacity={0.8}
              />
              {/* Crosshair */}
              <line
                x1={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE - 12 / viewport.scale}
                y1={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE}
                x2={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE + 12 / viewport.scale}
                y2={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE}
                stroke="#06b6d4"
                strokeWidth={1.5 / viewport.scale}
                opacity={0.6}
              />
              <line
                x1={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE}
                y1={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE - 12 / viewport.scale}
                x2={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE}
                y2={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE + 12 / viewport.scale}
                stroke="#06b6d4"
                strokeWidth={1.5 / viewport.scale}
                opacity={0.6}
              />
              {/* Coordinate label */}
              <text
                x={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE + 14 / viewport.scale}
                y={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE - 8 / viewport.scale}
                fontSize={11 / viewport.scale}
                fill="#06b6d4"
                fontFamily="monospace"
              >
                ({wallSnapPreview.xFt.toFixed(1)}, {wallSnapPreview.yFt.toFixed(1)}) ft
              </text>
            </g>
          )}

          {/* Placement Preview Ghost - shows fixture preview following cursor */}
          {pendingPlacement && placementPreview && (() => {
            // Create a temporary fixture config for the ghost preview
            const ghostFixture = {
              id: "__ghost__",
              catalogKey: pendingPlacement.key,
              xFt: placementPreview.xFt,
              yFt: placementPreview.yFt,
              rotationDeg: pendingPlacementRotation,
              locked: false,
              properties: {},
            };
            const rect = rectFromFixture(ghostFixture, pendingPlacement);
            const x = CANVAS_PADDING + rect.x * BASE_SCALE;
            const y = CANVAS_PADDING + rect.y * BASE_SCALE;
            const width = rect.width * BASE_SCALE;
            const height = rect.height * BASE_SCALE;

            return (
              <g pointerEvents="none" opacity={0.6}>
                <Fixture2DRenderer
                  fixture={ghostFixture}
                  catalogItem={pendingPlacement}
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  isSelected={true}
                  hasError={false}
                  isHovered={false}
                />
                {/* Position label */}
                <text
                  x={x + width / 2}
                  y={y - 10 / viewport.scale}
                  textAnchor="middle"
                  fontSize={12 / viewport.scale}
                  fill="#22d3ee"
                  fontFamily="monospace"
                  fontWeight="bold"
                  stroke="#000000"
                  strokeWidth={3 / viewport.scale}
                  paintOrder="stroke"
                >
                  {pendingPlacement.label} • Click to place
                </text>
              </g>
            );
          })()}

          {/* Wall Drawing Preview - inside transform group so it aligns with design */}
          {wallDrawState && wallDrawState.currentPoint && (
            <g pointerEvents="none">
              {/* Preview line from start to current */}
              <line
                x1={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                y1={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                x2={CANVAS_PADDING + wallDrawState.currentPoint.xFt * BASE_SCALE}
                y2={CANVAS_PADDING + wallDrawState.currentPoint.yFt * BASE_SCALE}
                stroke="#06b6d4"
                strokeWidth={4 / viewport.scale}
                strokeDasharray={`${8 / viewport.scale} ${4 / viewport.scale}`}
                opacity={0.8}
              />
              {/* Start point marker */}
              <circle
                cx={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                cy={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                r={6 / viewport.scale}
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth={2 / viewport.scale}
              />
              {/* End point marker */}
              <circle
                cx={CANVAS_PADDING + wallDrawState.currentPoint.xFt * BASE_SCALE}
                cy={CANVAS_PADDING + wallDrawState.currentPoint.yFt * BASE_SCALE}
                r={6 / viewport.scale}
                fill="#06b6d4"
                stroke="#ffffff"
                strokeWidth={2 / viewport.scale}
              />
              {/* Length label */}
              <text
                x={
                  CANVAS_PADDING +
                  ((wallDrawState.startPoint.xFt + wallDrawState.currentPoint.xFt) / 2) * BASE_SCALE
                }
                y={
                  CANVAS_PADDING +
                  ((wallDrawState.startPoint.yFt + wallDrawState.currentPoint.yFt) / 2) * BASE_SCALE - 12 / viewport.scale
                }
                textAnchor="middle"
                fontSize={14 / viewport.scale}
                fill="#06b6d4"
                fontFamily="monospace"
                fontWeight="bold"
                stroke="#000000"
                strokeWidth={3 / viewport.scale}
                paintOrder="stroke"
              >
                {Math.sqrt(
                  Math.pow(wallDrawState.currentPoint.xFt - wallDrawState.startPoint.xFt, 2) +
                  Math.pow(wallDrawState.currentPoint.yFt - wallDrawState.startPoint.yFt, 2)
                ).toFixed(1)}
                ' wall
              </text>
            </g>
          )}

          {/* Measure Tool Snap Preview - shows where next point will be placed */}
          {activeTool === "measure" && measureSnapPreview && (
            <g pointerEvents="none">
              {/* Snap point indicator */}
              <circle
                cx={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE}
                cy={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE}
                r={8 / viewport.scale}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2 / viewport.scale}
                opacity={0.8}
              />
              {/* Crosshair */}
              <line
                x1={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE - 12 / viewport.scale}
                y1={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE}
                x2={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE + 12 / viewport.scale}
                y2={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE}
                stroke="#fbbf24"
                strokeWidth={1.5 / viewport.scale}
                opacity={0.6}
              />
              <line
                x1={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE}
                y1={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE - 12 / viewport.scale}
                x2={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE}
                y2={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE + 12 / viewport.scale}
                stroke="#fbbf24"
                strokeWidth={1.5 / viewport.scale}
                opacity={0.6}
              />
              {/* Coordinate label */}
              <text
                x={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE + 14 / viewport.scale}
                y={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE - 8 / viewport.scale}
                fontSize={11 / viewport.scale}
                fill="#fbbf24"
                fontFamily="monospace"
              >
                ({measureSnapPreview.xFt.toFixed(1)}, {measureSnapPreview.yFt.toFixed(1)}) ft
              </text>
              {/* Preview line from first point to cursor when one point exists */}
              {measurePoints.length === 1 && (
                <>
                  <line
                    x1={CANVAS_PADDING + measurePoints[0].xFt * BASE_SCALE}
                    y1={CANVAS_PADDING + measurePoints[0].yFt * BASE_SCALE}
                    x2={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE}
                    y2={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE}
                    stroke="#fbbf24"
                    strokeWidth={2 / viewport.scale}
                    strokeDasharray={`${6 / viewport.scale} ${3 / viewport.scale}`}
                    opacity={0.5}
                  />
                  {/* Preview distance label */}
                  <text
                    x={CANVAS_PADDING + ((measurePoints[0].xFt + measureSnapPreview.xFt) / 2) * BASE_SCALE}
                    y={CANVAS_PADDING + ((measurePoints[0].yFt + measureSnapPreview.yFt) / 2) * BASE_SCALE - 10 / viewport.scale}
                    textAnchor="middle"
                    fontSize={12 / viewport.scale}
                    fill="#fbbf24"
                    fontFamily="monospace"
                    fontWeight="bold"
                    stroke="#000000"
                    strokeWidth={2 / viewport.scale}
                    paintOrder="stroke"
                    opacity={0.7}
                  >
                    {Math.sqrt(
                      Math.pow(measureSnapPreview.xFt - measurePoints[0].xFt, 2) +
                      Math.pow(measureSnapPreview.yFt - measurePoints[0].yFt, 2)
                    ).toFixed(2)}'
                  </text>
                </>
              )}
            </g>
          )}

          {/* Measurement Tool Visualization - inside transform group */}
          {activeTool === "measure" && measurePoints.length > 0 && (
            <g>
              {measurePoints.map((point, index) => (
                <circle
                  key={index}
                  cx={CANVAS_PADDING + point.xFt * BASE_SCALE}
                  cy={CANVAS_PADDING + point.yFt * BASE_SCALE}
                  r={6 / viewport.scale}
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth={2 / viewport.scale}
                />
              ))}
              {measurePoints.length === 2 && (
                <>
                  <line
                    x1={CANVAS_PADDING + measurePoints[0].xFt * BASE_SCALE}
                    y1={CANVAS_PADDING + measurePoints[0].yFt * BASE_SCALE}
                    x2={CANVAS_PADDING + measurePoints[1].xFt * BASE_SCALE}
                    y2={CANVAS_PADDING + measurePoints[1].yFt * BASE_SCALE}
                    stroke="#fbbf24"
                    strokeWidth={3 / viewport.scale}
                    strokeDasharray={`${8 / viewport.scale} ${4 / viewport.scale}`}
                  />
                  <text
                    x={
                      CANVAS_PADDING +
                      ((measurePoints[0].xFt + measurePoints[1].xFt) / 2) * BASE_SCALE
                    }
                    y={
                      CANVAS_PADDING +
                      ((measurePoints[0].yFt + measurePoints[1].yFt) / 2) * BASE_SCALE - 10 / viewport.scale
                    }
                    textAnchor="middle"
                    fontSize={16 / viewport.scale}
                    fill="#fbbf24"
                    fontFamily="monospace"
                    fontWeight="bold"
                    stroke="#000000"
                    strokeWidth={3 / viewport.scale}
                    paintOrder="stroke"
                  >
                    {Math.sqrt(
                      Math.pow(measurePoints[1].xFt - measurePoints[0].xFt, 2) +
                      Math.pow(measurePoints[1].yFt - measurePoints[0].yFt, 2)
                    ).toFixed(2)}
                    '
                  </text>
                </>
              )}
            </g>
          )}

          {/* Annotation Layer */}
          {(design.annotations?.length ?? 0) > 0 && (
            <g transform={`translate(${CANVAS_PADDING}, ${CANVAS_PADDING})`}>
              <AnnotationLayer
                annotations={design.annotations ?? []}
                selectedAnnotationId={selectedAnnotationId}
                viewport={viewport}
                scalePxPerFt={BASE_SCALE}
                dispatch={dispatch}
                onStartDrag={(id, target, pointerStartPx) => {
                  dispatch({ type: "START_ANNOTATION_DRAG", id, target, pointerStartPx });
                }}
                onEditText={(id) => {
                  if (onEditAnnotation) {
                    onEditAnnotation(id);
                  }
                }}
              />
            </g>
          )}
        </g>

        {marqueeState && (
          <rect
            x={Math.min(marqueeState.origin.x, marqueeState.current.x)}
            y={Math.min(marqueeState.origin.y, marqueeState.current.y)}
            width={Math.abs(marqueeState.origin.x - marqueeState.current.x)}
            height={Math.abs(marqueeState.origin.y - marqueeState.current.y)}
            fill="rgba(34,211,238,0.15)"
            stroke="#22d3ee"
            strokeDasharray="6 8"
            strokeWidth={2}
          />
        )}

      </svg>
    </div>
  );
}

function computeCollisions(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
) {
  const overlaps: { x: number; y: number; width: number; height: number }[] =
    [];
  for (let i = 0; i < design.fixtures.length; i++) {
    const fixtureA = design.fixtures[i];
    const catalogA = catalog[fixtureA.catalogKey];
    if (!catalogA) continue;
    const rectA = rectFromFixture(fixtureA, catalogA);
    for (let j = i + 1; j < design.fixtures.length; j++) {
      const fixtureB = design.fixtures[j];
      const catalogB = catalog[fixtureB.catalogKey];
      if (!catalogB) continue;

      // Ignore collisions between items on different mounts (e.g. Floor vs Wall)
      // This allows upper cabinets to be placed above base cabinets
      if (catalogA.mount !== catalogB.mount) continue;

      // Check if either fixture is a wall or door
      const keyA = fixtureA.catalogKey.toLowerCase();
      const keyB = fixtureB.catalogKey.toLowerCase();
      const isWallA = keyA.includes('wall');
      const isWallB = keyB.includes('wall');
      const isDoorA = keyA.includes('door');
      const isDoorB = keyB.includes('door');

      // Allow walls to intersect with walls
      if (isWallA && isWallB) continue;

      // Allow doors to intersect with walls (in either direction)
      if ((isDoorA && isWallB) || (isWallA && isDoorB)) continue;

      const rectB = rectFromFixture(fixtureB, catalogB);
      const width = Math.min(
        rectA.x + rectA.width,
        rectB.x + rectB.width
      ) - Math.max(rectA.x, rectB.x);
      const height = Math.min(
        rectA.y + rectA.height,
        rectB.y + rectB.height
      ) - Math.max(rectA.y, rectB.y);
      if (width > 0 && height > 0) {
        overlaps.push({
          x: Math.max(rectA.x, rectB.x),
          y: Math.max(rectA.y, rectB.y),
          width,
          height,
        });
      }
    }
  }
  return overlaps;
}

function computeClearances(
  _design: DesignConfig,
  _catalog: Record<string, ModuleCatalogItem>
) {
  // Buffer/clearance zones removed - return empty array
  return [] as { x: number; y: number; width: number; height: number }[];
}

function computeSelectionBounds(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>,
  ids: string[]
) {
  if (ids.length === 0) return null;
  const rects = ids
    .map((id) => {
      const fixture = design.fixtures.find((f) => f.id === id);
      if (!fixture) return null;
      const catalogItem = catalog[fixture.catalogKey];
      if (!catalogItem) return null;
      return rectFromFixture(fixture, catalogItem);
    })
    .filter(Boolean) as { x: number; y: number; width: number; height: number }[];
  if (rects.length === 0) return null;
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));
  return {
    x: CANVAS_PADDING + minX * BASE_SCALE,
    y: CANVAS_PADDING + minY * BASE_SCALE,
    width: (maxX - minX) * BASE_SCALE,
    height: (maxY - minY) * BASE_SCALE,
  };
}

function computeAlignmentGuides(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>,
  ids: string[]
) {
  if (ids.length !== 1) return [] as {
    orientation: "vertical" | "horizontal";
    value: number;
  }[];
  const fixture = design.fixtures.find((f) => f.id === ids[0]);
  if (!fixture) return [];
  const catalogItem = catalog[fixture.catalogKey];
  if (!catalogItem) return [];
  const target = rectFromFixture(fixture, catalogItem);
  const guides: { orientation: "vertical" | "horizontal"; value: number }[] = [];
  design.fixtures.forEach((candidate) => {
    if (candidate.id === fixture.id) return;
    const candidateItem = catalog[candidate.catalogKey];
    if (!candidateItem) return;
    const rect = rectFromFixture(candidate, candidateItem);
    if (Math.abs(rect.x - target.x) <= ALIGN_THRESHOLD_FT) {
      guides.push({ orientation: "vertical", value: rect.x });
    }
    if (
      Math.abs(rect.x + rect.width - (target.x + target.width)) <=
      ALIGN_THRESHOLD_FT
    ) {
      guides.push({ orientation: "vertical", value: rect.x + rect.width });
    }
    if (Math.abs(rect.y - target.y) <= ALIGN_THRESHOLD_FT) {
      guides.push({ orientation: "horizontal", value: rect.y });
    }
    if (
      Math.abs(rect.y + rect.height - (target.y + target.height)) <=
      ALIGN_THRESHOLD_FT
    ) {
      guides.push({ orientation: "horizontal", value: rect.y + rect.height });
    }
  });
  return guides;
}
