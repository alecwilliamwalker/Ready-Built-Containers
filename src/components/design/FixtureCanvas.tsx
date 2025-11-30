"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
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

// Color palette for the canvas (matches desktop styling)
const COLORS = {
  canvasBg: "#020617",
  shellFill: "#0f172a",
  shellStroke: "#1e293b",
  gridLine: "#334155",
  zoneFill: "rgba(34, 211, 238, 0.05)",
  zoneStroke: "rgba(34, 211, 238, 0.3)",
  zoneHoverFill: "rgba(34, 211, 238, 0.1)",
  zoneHoverStroke: "rgba(34, 211, 238, 0.5)",
  zoneSelectedFill: "rgba(34, 211, 238, 0.15)",
  zoneSelectedStroke: "rgba(34, 211, 238, 0.8)",
  zoneLabel: "rgba(34, 211, 238, 0.6)",
  selectionBounds: "rgba(34, 211, 238, 0.6)",
  alignmentGuide: "rgba(251, 191, 36, 0.8)",
};

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
  onToolChange?: (tool: ToolType) => void;
  zoneEditMode?: boolean;
  onDebugLog?: DebugLogFn;
  pendingPlacement?: ModuleCatalogItem | null;
  pendingPlacementRotation?: 0 | 90 | 180 | 270;
  onPlaceFixture?: (catalogKey: string, coords: { xFt: number; yFt: number }) => void;
  onEditAnnotation?: (id: string) => void;
  onAnnotationPlaced?: () => void;
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
  onToolChange,
  zoneEditMode = false,
  onDebugLog,
  pendingPlacement,
  pendingPlacementRotation = 0,
  onPlaceFixture,
  onEditAnnotation,
  onAnnotationPlaced,
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
  
  // Mobile magnifier - shows zoomed view above finger during precision operations
  const [magnifierPos, setMagnifierPos] = useState<{ screenX: number; screenY: number; vbX: number; vbY: number } | null>(null);

  // Mobile "drag from anywhere" pending state - waits for movement threshold before starting drag
  const [pendingMobileDrag, setPendingMobileDrag] = useState<{
    fixtureId: string;
    startClientX: number;
    startClientY: number;
    startPointPx: { x: number; y: number };
    fixtureWidth: number;
    fixtureHeight: number;
    footprintAnchor: "center" | "front-left" | "back-left";
  } | null>(null);
  const MOBILE_DRAG_THRESHOLD = 10; // pixels of movement before drag starts

  // Mobile detection for gesture library vs desktop controls
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
   * Uses SVG's built-in getScreenCTM() which properly handles all transforms
   * including CSS transforms from gesture libraries like react-zoom-pan-pinch
   */
  const screenToViewBox = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    
    // Use SVG's coordinate transformation matrix - handles ALL transforms including CSS
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    
    // Create a point and transform it from screen to SVG coordinates
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    
    // Apply inverse of the screen CTM to get SVG coordinates
    const svgPoint = point.matrixTransform(ctm.inverse());
    
    return {
      x: svgPoint.x,
      y: svgPoint.y,
    };
  };

  /**
   * Convert screen coordinates to world coordinates (inside the viewport transform group)
   * This applies the inverse of the viewport transform to viewBox coords
   * 
   * On mobile, getScreenCTM() may not correctly include CSS transforms from 
   * react-zoom-pan-pinch on iOS Safari, so we apply the viewport correction
   * just like we do on desktop.
   */
  const screenToWorldPx = (clientX: number, clientY: number) => {
    const vb = screenToViewBox(clientX, clientY);
    if (!vb) return null;
    
    // Apply inverse viewport transform (same for both mobile and desktop)
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
   * Convert screen coordinates to feet - MOBILE ONLY
   * Uses getBoundingClientRect which correctly includes CSS transforms from react-zoom-pan-pinch
   * This is used for absolute positioning (wall, measure, annotate, fixture placement)
   * where we need accurate coordinates, not relative deltas
   * 
   * IMPORTANT: Accounts for SVG preserveAspectRatio="xMidYMid meet" which centers content
   * and may leave empty space around the edges
   */
  const screenToFtMobile = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    
    // getBoundingClientRect includes all CSS transforms from react-zoom-pan-pinch
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    
    // Calculate the actual rendered size accounting for preserveAspectRatio="xMidYMid meet"
    // The SVG content scales uniformly to fit while maintaining aspect ratio
    const viewBoxAspect = viewBox.width / viewBox.height;
    const containerAspect = rect.width / rect.height;
    
    let renderedWidth: number;
    let renderedHeight: number;
    let offsetX: number;
    let offsetY: number;
    
    if (containerAspect > viewBoxAspect) {
      // Container is wider than content - letterboxing on sides
      renderedHeight = rect.height;
      renderedWidth = rect.height * viewBoxAspect;
      offsetX = (rect.width - renderedWidth) / 2;
      offsetY = 0;
    } else {
      // Container is taller than content - letterboxing on top/bottom
      renderedWidth = rect.width;
      renderedHeight = rect.width / viewBoxAspect;
      offsetX = 0;
      offsetY = (rect.height - renderedHeight) / 2;
    }
    
    // Map screen position to viewBox position, accounting for centering offset
    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;
    const scaleX = viewBox.width / renderedWidth;
    const scaleY = viewBox.height / renderedHeight;
    const vbX = relX * scaleX;
    const vbY = relY * scaleY;
    
    // Convert viewBox coords to feet (viewBox has CANVAS_PADDING offset)
    return {
      xFt: (vbX - CANVAS_PADDING) / BASE_SCALE,
      yFt: (vbY - CANVAS_PADDING) / BASE_SCALE,
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
    const svgBounds = svgRef.current?.getBoundingClientRect();
    if (!svgBounds) return;
    dispatch({
      type: "ZOOM_VIEWPORT",
      deltaScale: -event.deltaY * 0.001,
      centerPx: {
        x: event.clientX - svgBounds.left,
        y: event.clientY - svgBounds.top,
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
    // Handle pending mobile drag - check if movement threshold exceeded
    if (pendingMobileDrag) {
      const dx = event.clientX - pendingMobileDrag.startClientX;
      const dy = event.clientY - pendingMobileDrag.startClientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance >= MOBILE_DRAG_THRESHOLD) {
        log("action", "[MOBILE] Movement threshold exceeded - starting actual drag", {
          fixtureId: pendingMobileDrag.fixtureId,
          distance,
        });
        
        // Start the actual drag
        dispatch({
          type: "START_DRAG",
          id: pendingMobileDrag.fixtureId,
          pointerStartPx: pendingMobileDrag.startPointPx,
          fixtureWidth: pendingMobileDrag.fixtureWidth,
          fixtureHeight: pendingMobileDrag.fixtureHeight,
          footprintAnchor: pendingMobileDrag.footprintAnchor,
        });
        
        // Clear pending state
        setPendingMobileDrag(null);
        
        // Continue to process this move event as a drag update
        const point = screenToWorldPx(event.clientX, event.clientY);
        if (point) {
          dispatch({
            type: "UPDATE_DRAG",
            pointerCurrentPx: point,
            scalePxPerFt: BASE_SCALE * viewport.scale,
            skipSnap: true,
          });
        }
        return;
      }
      // Still under threshold - don't process other move handlers
      return;
    }

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
      // Calculate scale factor to convert screen pixels to feet
      // On mobile, need to account for CSS transforms + SVG viewBox scaling
      let scalePxPerFt = BASE_SCALE * viewport.scale;
      if (isMobile && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const viewBox = svgRef.current.viewBox.baseVal;
        // Screen pixels per viewBox pixel (includes CSS zoom)
        const screenToViewBoxRatio = rect.width / viewBox.width;
        // Feet to screen pixels: BASE_SCALE viewBox pixels * screen/viewBox ratio
        scalePxPerFt = BASE_SCALE * screenToViewBoxRatio;
      }
      
      dispatch({
        type: "UPDATE_ANNOTATION_DRAG",
        pointerCurrentPx: { x: event.clientX, y: event.clientY },
        scalePxPerFt,
      });
      return;
    }

    // Handle wall drawing preview
    if (wallDrawState && activeTool === "wall") {
      // Use mobile-specific coordinate conversion for accurate preview
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
      if (!coords) return;
      dispatch({
        type: "UPDATE_WALL_DRAW",
        currentPoint: coords,
      });
      // Update magnifier position on mobile
      if (isMobile) {
        const vbX = CANVAS_PADDING + coords.xFt * BASE_SCALE;
        const vbY = CANVAS_PADDING + coords.yFt * BASE_SCALE;
        setMagnifierPos({ screenX: event.clientX, screenY: event.clientY, vbX, vbY });
      }
      return;
    }

    if (dragState) {
      const point = screenToWorldPx(event.clientX, event.clientY);
      
      // Debug logging for mobile drag - log every 10th event to avoid flooding
      if (isMobile && Math.random() < 0.1) {
        log("coord", `[MOBILE DEBUG] Drag MOVE`, {
          fixtureId: dragState.fixtureId,
          clientX: event.clientX,
          clientY: event.clientY,
          convertedX: point?.x ?? "NULL",
          convertedY: point?.y ?? "NULL",
          pointerType: event.pointerType,
          hasPointerCapture: svgRef.current?.hasPointerCapture(event.pointerId) ?? false,
          viewportScale: viewport.scale,
        });
      }
      
      if (!point) {
        log("error", `[MOBILE DEBUG] Drag MOVE - screenToWorldPx returned NULL!`, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
        return;
      }
      dispatch({
        type: "UPDATE_DRAG",
        pointerCurrentPx: point,
        scalePxPerFt: BASE_SCALE,
        skipSnap: false,  // Enable 0.25ft snapping on both mobile and desktop
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
      // Use mobile-specific coordinate conversion for accurate preview
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
      if (coords) {
        // Apply snapping to show where point will actually land
        const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
        const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
        setWallSnapPreview({ xFt: snappedX, yFt: snappedY });
        // Update magnifier position on mobile
        if (isMobile) {
          const vbX = CANVAS_PADDING + snappedX * BASE_SCALE;
          const vbY = CANVAS_PADDING + snappedY * BASE_SCALE;
          setMagnifierPos({ screenX: event.clientX, screenY: event.clientY, vbX, vbY });
        }
      } else {
        setWallSnapPreview(null);
        if (isMobile) setMagnifierPos(null);
      }
    } else if (wallSnapPreview) {
      // Clear preview when not in wall tool or when drawing has started
      setWallSnapPreview(null);
    }

    // Placement mode preview - show ghost fixture following cursor
    if (pendingPlacement) {
      // Use mobile-specific coordinate conversion for accurate preview
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
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
      // Use mobile-specific coordinate conversion for accurate preview
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
      if (coords) {
        const snappedX = Math.round(coords.xFt / snapIncrement) * snapIncrement;
        const snappedY = Math.round(coords.yFt / snapIncrement) * snapIncrement;
        setMeasureSnapPreview({ xFt: snappedX, yFt: snappedY });
        // Update magnifier position on mobile
        if (isMobile) {
          const vbX = CANVAS_PADDING + snappedX * BASE_SCALE;
          const vbY = CANVAS_PADDING + snappedY * BASE_SCALE;
          setMagnifierPos({ screenX: event.clientX, screenY: event.clientY, vbX, vbY });
        }
      } else {
        setMeasureSnapPreview(null);
        if (isMobile) setMagnifierPos(null);
      }
    } else if (measureSnapPreview) {
      setMeasureSnapPreview(null);
      if (isMobile) setMagnifierPos(null);
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
    // Log pointer up/leave events on mobile for debugging
    if (isMobile && (dragState || zoneDragState || annotationDragState || wallDrawState)) {
      log("action", `[MOBILE DEBUG] PointerUp/Leave triggered`, {
        eventType: event.type,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        clientX: event.clientX,
        clientY: event.clientY,
        hasDragState: !!dragState,
        hasWallDrawState: !!wallDrawState,
        dragFixtureId: dragState?.fixtureId ?? "none",
      });
    }
    
    // Mobile wall tool: Complete wall on pointer up (drag-to-draw gesture)
    if (isMobile && wallDrawState && activeTool === "wall") {
      const coords = screenToFtMobile(event.clientX, event.clientY);
      if (coords) {
        // Only create wall if there's meaningful distance from start
        const dx = coords.xFt - wallDrawState.startPoint.xFt;
        const dy = coords.yFt - wallDrawState.startPoint.yFt;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= 0.5) { // Minimum 0.5ft wall length
          log("action", "[MOBILE] END_WALL_DRAW (drag gesture complete)", { 
            startPoint: wallDrawState.startPoint,
            endPoint: coords,
            distance,
          });
          dispatch({ type: "END_WALL_DRAW", endPoint: coords });
          // Switch back to select tool for adjustment
          onToolChange?.("select");
        } else {
          // Too short - cancel the wall
          log("action", "[MOBILE] Wall too short, canceling", { distance });
          dispatch({ type: "CANCEL_WALL_DRAW" });
        }
      } else {
        dispatch({ type: "CANCEL_WALL_DRAW" });
      }
      return;
    }
    
    // Handle pending mobile drag - if we get pointer up without starting actual drag, 
    // it was a tap in empty space, so deselect
    if (pendingMobileDrag) {
      log("action", "[MOBILE] Tap in empty space - clearing selection (no drag started)", {
        fixtureId: pendingMobileDrag.fixtureId,
      });
      setPendingMobileDrag(null);
      dispatch({ type: "CLEAR_SELECTION" });
    }
    
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
      // Find the fixture to log its final position
      const draggedFixture = design.fixtures.find(f => f.id === dragState.fixtureId);
      log("action", `[MOBILE DEBUG] Drag END`, {
        fixtureId: dragState.fixtureId,
        finalXFt: draggedFixture?.xFt ?? "unknown",
        finalYFt: draggedFixture?.yFt ?? "unknown",
        startXFt: dragState.startXFt,
        startYFt: dragState.startYFt,
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
        isMobile,
      });
      dispatch({ type: "END_DRAG" });
    }
    if (isPanning) {
      stopPan();
    }
    if (marqueeState) {
      finalizeMarquee();
    }
    // Release pointer capture if it was set (for panning, fixture dragging, etc.)
    const hadPointerCapture = svgRef.current?.hasPointerCapture(event.pointerId) ?? false;
    if (hadPointerCapture) {
      svgRef.current!.releasePointerCapture(event.pointerId);
    }
    // Clear magnifier on pointer up
    if (isMobile) {
      setMagnifierPos(null);
      log("info", `[MOBILE DEBUG] PointerUp complete`, {
        hadPointerCapture,
        pointerId: event.pointerId,
      });
    }
  };

  // Separate handler for pointerleave - ignore during active drag on mobile
  // iOS WebKit fires pointerleave even with pointer capture when touch moves
  const handlePointerLeave = (event: React.PointerEvent<SVGSVGElement>) => {
    // On mobile, ignore pointerleave during active drag, wall drawing, or pending drag - only end on pointerup
    // This is critical because iOS fires spurious pointerleave events even with pointer capture
    const hasActiveDrag = !!(dragState || zoneDragState || zoneResizeState || wallLengthDragState || annotationDragState || pendingMobileDrag || (wallDrawState && activeTool === "wall"));
    
    if (isMobile && hasActiveDrag) {
      log("info", `[MOBILE DEBUG] PointerLeave IGNORED during active drag`, {
        pointerId: event.pointerId,
        dragFixtureId: dragState?.fixtureId ?? "none",
        hasPendingMobileDrag: !!pendingMobileDrag,
      });
      return; // Don't end the drag on pointerleave
    }
    
    // For non-drag scenarios or desktop, handle normally
    handlePointerUp(event);
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
    if (isMobile) {
      log("action", "[MOBILE DEBUG] Placement check", {
        hasPendingPlacement: !!pendingPlacement,
        pendingKey: pendingPlacement?.key ?? "none",
        hasOnPlaceFixture: !!onPlaceFixture,
        eventButton: event.button,
        pointerType: event.pointerType,
      });
    }
    if (pendingPlacement && onPlaceFixture && event.button === 0) {
      event.preventDefault();
      event.stopPropagation();
      // Use mobile-specific coordinate conversion for accurate placement
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
      if (!coords) {
        log("error", "Placement - coordinate conversion returned null");
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
      // Use mobile-specific coordinate conversion for accurate placement
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
      log("coord", "Wall tool - coordinate result", {
        clientX: event.clientX,
        clientY: event.clientY,
        coords: coords ?? "null",
        isMobile,
      });
      if (!coords) {
        log("error", "Coordinate conversion returned null - click may be outside canvas");
        return;
      }
      
      if (isMobile) {
        // Mobile: Always start a new wall on touch down (drag-to-draw gesture)
        // Wall will be completed on pointer up
        log("action", "[MOBILE] START_WALL_DRAW (drag gesture)", { startPoint: coords });
        dispatch({ type: "START_WALL_DRAW", startPoint: coords });
        // Capture pointer to ensure we get all move/up events
        if (svgRef.current) {
          svgRef.current.setPointerCapture(event.pointerId);
        }
      } else if (!wallDrawState) {
        // Desktop: First click - start wall drawing
        log("action", "START_WALL_DRAW dispatched", { startPoint: coords });
        dispatch({ type: "START_WALL_DRAW", startPoint: coords });
      } else {
        // Desktop: Second click - end wall drawing and place the wall
        log("action", "END_WALL_DRAW dispatched", { 
          startPoint: wallDrawState.startPoint,
          endPoint: coords 
        });
        dispatch({ type: "END_WALL_DRAW", endPoint: coords });
        // Switch back to select tool for adjustment
        onToolChange?.("select");
      }
      return;
    }

    // Measure tool - click to add points
    if (activeTool === "measure" && event.button === 0) {
      event.preventDefault();
      // Use mobile-specific coordinate conversion for accurate placement
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
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
      // Use mobile-specific coordinate conversion for accurate placement
      const coords = isMobile ? screenToFtMobile(event.clientX, event.clientY) : screenToFt(event.clientX, event.clientY);
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
      onAnnotationPlaced?.();
      return;
    }

    // Mobile: Prepare to drag selected fixture from anywhere on canvas
    // This makes it easier to move objects on touch devices where precise tapping is difficult
    // We use a pending state so that a quick tap deselects, but tap-and-drag moves the fixture
    if (isMobile && activeTool === "select" && selectedIds.length === 1 && event.button === 0) {
      const selectedFixtureId = selectedIds[0];
      const fixture = design.fixtures.find((f) => f.id === selectedFixtureId);
      
      if (fixture && !fixture.locked) {
        const catalogItem = catalog[fixture.catalogKey];
        if (catalogItem) {
          event.preventDefault();
          
          // Set pointer capture on SVG
          if (svgRef.current) {
            svgRef.current.setPointerCapture(event.pointerId);
          }
          
          const rect = rectFromFixture(fixture, catalogItem);
          const point = screenToWorldPx(event.clientX, event.clientY);
          
          if (point) {
            log("action", "[MOBILE] Pending drag from anywhere - waiting for movement threshold", {
              fixtureId: selectedFixtureId,
              clientX: event.clientX,
              clientY: event.clientY,
            });
            
            // Set pending drag - actual drag will start when movement threshold is exceeded
            setPendingMobileDrag({
              fixtureId: selectedFixtureId,
              startClientX: event.clientX,
              startClientY: event.clientY,
              startPointPx: point,
              fixtureWidth: rect.width,
              fixtureHeight: rect.height,
              footprintAnchor: catalogItem.footprintAnchor,
            });
            return;
          }
        }
      }
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
      hasPendingPlacement: !!pendingPlacement,
    });

    // Don't intercept if we're in placement mode - let it bubble to SVG handler
    if (pendingPlacement) {
      log("info", "Fixture click ignored - pending placement active");
      return;
    }

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
    event.preventDefault();
    event.stopPropagation();
    
    // Set pointer capture on SVG to ensure we receive events even when finger moves outside fixture
    // This is critical for mobile touch dragging
    const pointerCaptureSet = !!svgRef.current;
    if (svgRef.current) {
      svgRef.current.setPointerCapture(event.pointerId);
    }
    
    log("action", `[MOBILE DEBUG] Drag START attempt`, {
      fixtureId,
      isMobile,
      pointerType: event.pointerType,
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      pointerCaptureSet,
      viewportScale: viewport.scale,
      viewportOffsetX: viewport.offsetX,
      viewportOffsetY: viewport.offsetY,
    });
    
    const fixture = design.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) {
      log("error", `[MOBILE DEBUG] Fixture not found: ${fixtureId}`);
      return;
    }
    
    // Don't allow selection or drag of locked fixtures
    if (fixture.locked) {
      log("info", "Fixture click ignored - fixture is locked");
      // Release capture since we're not starting a drag
      if (svgRef.current?.hasPointerCapture(event.pointerId)) {
        svgRef.current.releasePointerCapture(event.pointerId);
      }
      return;
    }
    
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) {
      log("error", `[MOBILE DEBUG] Catalog item not found: ${fixture.catalogKey}`);
      return;
    }
    const rect = rectFromFixture(fixture, catalogItem);
    const point = screenToWorldPx(event.clientX, event.clientY);
    if (!point) {
      log("error", `[MOBILE DEBUG] screenToWorldPx returned null!`);
      return;
    }
    
    log("action", `[MOBILE DEBUG] Drag START success`, {
      fixtureId,
      fixtureXFt: fixture.xFt,
      fixtureYFt: fixture.yFt,
      convertedPointX: point.x,
      convertedPointY: point.y,
      fixtureWidth: rect.width,
      fixtureHeight: rect.height,
    });
    
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
      hasPendingPlacement: !!pendingPlacement,
    });

    // Don't intercept if we're in placement mode - let it bubble to SVG handler
    if (pendingPlacement) {
      log("info", "Zone click ignored - pending placement active");
      return;
    }

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

  // Sync gesture library transform with our viewport state
  const handleTransformChange = useCallback((ref: { state: { scale: number; positionX: number; positionY: number } }) => {
    const { scale, positionX, positionY } = ref.state;
    // Update our viewport state to keep StatusBar zoom display in sync
    dispatch({ 
      type: "SET_VIEWPORT", 
      viewport: { 
        scale, 
        offsetX: positionX, 
        offsetY: positionY 
      } 
    });
  }, [dispatch]);

  // Disable panning when any drag operation is in progress
  const isDragging = !!(dragState || zoneDragState || zoneResizeState || wallLengthDragState || annotationDragState);

  // Mobile: Use gesture library for smooth pinch/pan
  // Desktop: Use our existing wheel/pointer handlers
  if (isMobile) {
    return (
      <div className="h-full w-full overflow-hidden bg-slate-950" data-canvas="fixture-canvas">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          limitToBounds={true}
          centerOnInit={true}
          doubleClick={{ mode: "reset" }}
          panning={{ 
            disabled: true,  // Disable single-finger pan - use two fingers instead
            excluded: ["fixture-draggable", "zone-draggable"]  // Exclude draggable elements
          }}
          pinch={{ 
            disabled: isDragging,  // Disable pinch during drag to prevent interference
            excluded: ["fixture-draggable", "zone-draggable"]
          }}
          wheel={{ disabled: true }}  // Disable wheel on mobile
          velocityAnimation={{ disabled: true }}  // Disable velocity animation to prevent drift after gestures
          onTransformed={handleTransformChange}
        >
          {({ resetTransform }) => (
            <>
              {/* Reset View Button for Mobile */}
              <button
                onClick={() => resetTransform()}
                className="absolute bottom-20 left-4 z-20 px-3 py-2 rounded-lg bg-slate-800/90 border border-white/20 text-white text-xs font-semibold backdrop-blur-sm active:scale-95 transition-transform"
              >
                Reset View
              </button>
              
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%", touchAction: "none" }}
                contentStyle={{ width: "100%", height: "100%", touchAction: "none" }}
              >
                <svg
                  ref={svgRef}
                  className="h-full w-full"
                  style={{ touchAction: "none", cursor: pendingPlacement ? "crosshair" : undefined }}
                  viewBox={`0 0 ${shellWidthPx + CANVAS_PADDING * 2} ${shellHeightPx + CANVAS_PADDING * 2}`}
                  role="img"
                  aria-label="Design workspace"
                  onPointerDown={handleSvgPointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
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
                    width={shellWidthPx + CANVAS_PADDING * 2}
                    height={shellHeightPx + CANVAS_PADDING * 2}
                    fill={COLORS.canvasBg}
                  />

                  {/* Content group - no internal transform, TransformWrapper handles zoom/pan */}
                  <g>
                    {/* Grid */}
                    <g opacity={0.15}>
                      {gridLinesX.map((ft) => (
                        <line
                          key={`gx-${ft}`}
                          x1={CANVAS_PADDING + ft * BASE_SCALE}
                          y1={CANVAS_PADDING}
                          x2={CANVAS_PADDING + ft * BASE_SCALE}
                          y2={CANVAS_PADDING + shellHeightPx}
                          stroke={COLORS.gridLine}
                          strokeWidth={ft % 1 === 0 ? 1 : 0.5}
                        />
                      ))}
                      {gridLinesY.map((ft) => (
                        <line
                          key={`gy-${ft}`}
                          x1={CANVAS_PADDING}
                          y1={CANVAS_PADDING + ft * BASE_SCALE}
                          x2={CANVAS_PADDING + shellWidthPx}
                          y2={CANVAS_PADDING + ft * BASE_SCALE}
                          stroke={COLORS.gridLine}
                          strokeWidth={ft % 1 === 0 ? 1 : 0.5}
                        />
                      ))}
                    </g>

                    {/* Shell outline */}
                    <rect
                      x={CANVAS_PADDING}
                      y={CANVAS_PADDING}
                      width={shellWidthPx}
                      height={shellHeightPx}
                      fill={COLORS.shellFill}
                      stroke={COLORS.shellStroke}
                      strokeWidth={2}
                    />

                    {/* Zones */}
                    {design.zones.map((zone) => {
                      const isSelected = zone.id === selectedZoneId;
                      const isHovered = zone.id === hoveredZoneId;
                      return (
                        <g key={zone.id} className="zone-draggable">
                          <rect
                            x={CANVAS_PADDING + zone.xFt * BASE_SCALE}
                            y={CANVAS_PADDING + zone.yFt * BASE_SCALE}
                            width={zone.lengthFt * BASE_SCALE}
                            height={zone.widthFt * BASE_SCALE}
                            fill={isSelected ? COLORS.zoneSelectedFill : isHovered ? COLORS.zoneHoverFill : COLORS.zoneFill}
                            stroke={isSelected ? COLORS.zoneSelectedStroke : isHovered ? COLORS.zoneHoverStroke : COLORS.zoneStroke}
                            strokeWidth={isSelected ? 2 : 1}
                            strokeDasharray={isSelected ? "none" : "4 2"}
                            style={{ cursor: zoneEditMode ? "move" : "default", touchAction: "none" }}
                            onPointerDown={(e) => {
                              // Don't stop propagation during placement mode - let it bubble to SVG
                              if (!pendingPlacement && zoneEditMode) {
                                e.stopPropagation();
                              }
                              handleZonePointerDown(e, zone.id);
                            }}
                            onPointerEnter={() => zoneEditMode && setHoveredZoneId(zone.id)}
                            onPointerLeave={() => setHoveredZoneId(null)}
                          />
                          {/* Zone label */}
                          <text
                            x={CANVAS_PADDING + zone.xFt * BASE_SCALE + 4}
                            y={CANVAS_PADDING + zone.yFt * BASE_SCALE + 14}
                            fill={COLORS.zoneLabel}
                            fontSize="11"
                            fontWeight="500"
                          >
                            {zone.name}
                          </text>
                          {/* Zone resize handle (bottom-right) */}
                          {zoneEditMode && (
                            <rect
                              x={CANVAS_PADDING + (zone.xFt + zone.lengthFt) * BASE_SCALE - 8}
                              y={CANVAS_PADDING + (zone.yFt + zone.widthFt) * BASE_SCALE - 8}
                              width={16}
                              height={16}
                              fill={hoveredResizeHandle === zone.id ? COLORS.zoneSelectedStroke : COLORS.zoneStroke}
                              stroke="white"
                              strokeWidth={1}
                              rx={2}
                              style={{ cursor: "se-resize", touchAction: "none" }}
                              onPointerEnter={() => setHoveredResizeHandle(zone.id)}
                              onPointerLeave={() => setHoveredResizeHandle(null)}
                              onPointerDown={(e) => {
                                handleZoneResizePointerDown(e, zone.id, "se");
                              }}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Clearance rects (rendered behind fixtures) */}
                    {clearanceRects.map((rect, i) => (
                      <rect
                        key={`clear-${i}`}
                        x={CANVAS_PADDING + rect.x * BASE_SCALE}
                        y={CANVAS_PADDING + rect.y * BASE_SCALE}
                        width={rect.width * BASE_SCALE}
                        height={rect.height * BASE_SCALE}
                        fill="rgba(59, 130, 246, 0.08)"
                        stroke="rgba(59, 130, 246, 0.3)"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        pointerEvents="none"
                      />
                    ))}

                    {/* Fixtures */}
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
                      const isHovered = fixture.id === hoveredFixtureId;
                      const isLocked = fixture.locked ?? false;
                      const isBeingDragged = dragState?.fixtureId === fixture.id;
                      const anotherFixtureIsDragging = !!dragState && !isBeingDragged;
                      return (
                        <g key={fixture.id} className="fixture-draggable">
                          <g
                            onPointerDown={(e) => {
                              // Don't stop propagation during placement mode - let it bubble to SVG
                              if (!pendingPlacement) {
                                e.stopPropagation();
                              }
                              handleFixturePointerDown(e, fixture.id);
                            }}
                            // Disable hover events during drag to prevent interference
                            onPointerEnter={anotherFixtureIsDragging ? undefined : () => setHoveredFixtureId(fixture.id)}
                            onPointerLeave={anotherFixtureIsDragging ? undefined : () => setHoveredFixtureId(null)}
                            style={{ 
                              cursor: isLocked ? "not-allowed" : "pointer", 
                              touchAction: "none",
                              // Disable pointer events on non-dragged fixtures during drag to prevent event interference
                              pointerEvents: anotherFixtureIsDragging ? "none" : "auto"
                            }}
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
                        </g>
                      );
                    })}

                    {/* Collision overlays */}
                    {collisionRects.map((rect, i) => (
                      <rect
                        key={`coll-${i}`}
                        x={CANVAS_PADDING + rect.x * BASE_SCALE}
                        y={CANVAS_PADDING + rect.y * BASE_SCALE}
                        width={rect.width * BASE_SCALE}
                        height={rect.height * BASE_SCALE}
                        fill="rgba(239, 68, 68, 0.2)"
                        stroke="rgba(239, 68, 68, 0.6)"
                        strokeWidth={2}
                        strokeDasharray="4 2"
                        pointerEvents="none"
                      />
                    ))}

                    {/* Multi-select bounding box */}
                    {selectionBounds && selectedIds.length > 1 && (
                      <rect
                        x={CANVAS_PADDING + selectionBounds.x * BASE_SCALE - 4}
                        y={CANVAS_PADDING + selectionBounds.y * BASE_SCALE - 4}
                        width={selectionBounds.width * BASE_SCALE + 8}
                        height={selectionBounds.height * BASE_SCALE + 8}
                        fill="none"
                        stroke={COLORS.selectionBounds}
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        pointerEvents="none"
                      />
                    )}

                    {/* Alignment guides */}
                    <g stroke={COLORS.alignmentGuide} strokeDasharray="4 4" strokeWidth={1.5} opacity={0.8}>
                      {alignmentGuides.map((guide, i) =>
                        guide.orientation === "vertical" ? (
                          <line
                            key={`guide-v-${i}`}
                            x1={CANVAS_PADDING + guide.value * BASE_SCALE}
                            x2={CANVAS_PADDING + guide.value * BASE_SCALE}
                            y1={CANVAS_PADDING}
                            y2={CANVAS_PADDING + shellHeightPx}
                            pointerEvents="none"
                          />
                        ) : (
                          <line
                            key={`guide-h-${i}`}
                            y1={CANVAS_PADDING + guide.value * BASE_SCALE}
                            y2={CANVAS_PADDING + guide.value * BASE_SCALE}
                            x1={CANVAS_PADDING}
                            x2={CANVAS_PADDING + shellWidthPx}
                            pointerEvents="none"
                          />
                        )
                      )}
                    </g>

                    {/* Marquee selection */}
                    {marqueeState && (
                      <rect
                        x={Math.min(marqueeState.origin.x, marqueeState.current.x)}
                        y={Math.min(marqueeState.origin.y, marqueeState.current.y)}
                        width={Math.abs(marqueeState.current.x - marqueeState.origin.x)}
                        height={Math.abs(marqueeState.current.y - marqueeState.origin.y)}
                        fill="rgba(34, 211, 238, 0.1)"
                        stroke="rgba(34, 211, 238, 0.6)"
                        strokeWidth={1}
                        strokeDasharray="4 2"
                        pointerEvents="none"
                      />
                    )}

                    {/* Placement ghost */}
                    {pendingPlacement && placementPreview && (
                      <g opacity={0.6} pointerEvents="none">
                        <rect
                          x={CANVAS_PADDING + placementPreview.xFt * BASE_SCALE - (pendingPlacement.footprintFt.length * BASE_SCALE) / 2}
                          y={CANVAS_PADDING + placementPreview.yFt * BASE_SCALE - (pendingPlacement.footprintFt.width * BASE_SCALE) / 2}
                          width={pendingPlacement.footprintFt.length * BASE_SCALE}
                          height={pendingPlacement.footprintFt.width * BASE_SCALE}
                          fill="rgba(34, 211, 238, 0.3)"
                          stroke="rgba(34, 211, 238, 0.8)"
                          strokeWidth={2}
                          strokeDasharray="4 2"
                          transform={`rotate(${pendingPlacementRotation} ${CANVAS_PADDING + placementPreview.xFt * BASE_SCALE} ${CANVAS_PADDING + placementPreview.yFt * BASE_SCALE})`}
                        />
                      </g>
                    )}

                    {/* Measure tool */}
                    {measurePoints.length > 0 && (
                      <g>
                        {measurePoints.map((pt, i) => (
                          <circle
                            key={`mp-${i}`}
                            cx={CANVAS_PADDING + pt.xFt * BASE_SCALE}
                            cy={CANVAS_PADDING + pt.yFt * BASE_SCALE}
                            r={6}
                            fill="#fbbf24"
                            stroke="#fff"
                            strokeWidth={2}
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
                              strokeWidth={2}
                              markerStart="url(#arrow)"
                              markerEnd="url(#arrow)"
                            />
                            <text
                              x={(CANVAS_PADDING + measurePoints[0].xFt * BASE_SCALE + CANVAS_PADDING + measurePoints[1].xFt * BASE_SCALE) / 2}
                              y={(CANVAS_PADDING + measurePoints[0].yFt * BASE_SCALE + CANVAS_PADDING + measurePoints[1].yFt * BASE_SCALE) / 2 - 10}
                              fill="#fbbf24"
                              fontSize="14"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {Math.sqrt(
                                Math.pow(measurePoints[1].xFt - measurePoints[0].xFt, 2) +
                                Math.pow(measurePoints[1].yFt - measurePoints[0].yFt, 2)
                              ).toFixed(2)} ft
                            </text>
                          </>
                        )}
                      </g>
                    )}

                    {/* Wall drawing preview */}
                    {wallDrawState && (
                      <g>
                        <circle
                          cx={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                          cy={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                          r={6}
                          fill="#22d3ee"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        {wallDrawState.currentPoint && (
                          <>
                            <line
                              x1={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                              y1={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                              x2={CANVAS_PADDING + wallDrawState.currentPoint.xFt * BASE_SCALE}
                              y2={CANVAS_PADDING + wallDrawState.currentPoint.yFt * BASE_SCALE}
                              stroke="#22d3ee"
                              strokeWidth={4}
                              strokeLinecap="round"
                              opacity={0.7}
                            />
                            <circle
                              cx={CANVAS_PADDING + wallDrawState.currentPoint.xFt * BASE_SCALE}
                              cy={CANVAS_PADDING + wallDrawState.currentPoint.yFt * BASE_SCALE}
                              r={4}
                              fill="#22d3ee"
                              stroke="#fff"
                              strokeWidth={1}
                            />
                          </>
                        )}
                      </g>
                    )}

                    {/* Wall snap preview (before wall draw starts) */}
                    {wallSnapPreview && activeTool === "wall" && !wallDrawState && (
                      <circle
                        cx={CANVAS_PADDING + wallSnapPreview.xFt * BASE_SCALE}
                        cy={CANVAS_PADDING + wallSnapPreview.yFt * BASE_SCALE}
                        r={6}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        pointerEvents="none"
                      />
                    )}

                    {/* Measure snap preview */}
                    {measureSnapPreview && activeTool === "measure" && (
                      <circle
                        cx={CANVAS_PADDING + measureSnapPreview.xFt * BASE_SCALE}
                        cy={CANVAS_PADDING + measureSnapPreview.yFt * BASE_SCALE}
                        r={6}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        pointerEvents="none"
                      />
                    )}

                    {/* Annotations layer */}
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
                </svg>
              </TransformComponent>
              
              {/* Mobile Magnifier - shows zoomed view above finger */}
              {magnifierPos && (activeTool === "wall" || activeTool === "measure") && (
                <div
                  className="pointer-events-none fixed z-50"
                  style={{
                    left: magnifierPos.screenX - 60,
                    top: magnifierPos.screenY - 140,
                    width: 120,
                    height: 120,
                  }}
                >
                  <svg
                    width="120"
                    height="120"
                    viewBox={`${magnifierPos.vbX - 40} ${magnifierPos.vbY - 40} 80 80`}
                    className="rounded-full border-4 border-white shadow-2xl"
                    style={{ 
                      backgroundColor: COLORS.canvasBg,
                      boxShadow: "0 0 20px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.3)",
                    }}
                  >
                    {/* Grid lines in magnifier */}
                    <g opacity={0.2}>
                      {Array.from({ length: 11 }, (_, i) => {
                        const ft = Math.floor((magnifierPos.vbX - 40 - CANVAS_PADDING) / BASE_SCALE) + i - 5;
                        const x = CANVAS_PADDING + ft * BASE_SCALE;
                        return (
                          <line
                            key={`mg-gx-${i}`}
                            x1={x}
                            y1={magnifierPos.vbY - 40}
                            x2={x}
                            y2={magnifierPos.vbY + 40}
                            stroke={COLORS.gridLine}
                            strokeWidth={0.5}
                          />
                        );
                      })}
                      {Array.from({ length: 11 }, (_, i) => {
                        const ft = Math.floor((magnifierPos.vbY - 40 - CANVAS_PADDING) / BASE_SCALE) + i - 5;
                        const y = CANVAS_PADDING + ft * BASE_SCALE;
                        return (
                          <line
                            key={`mg-gy-${i}`}
                            x1={magnifierPos.vbX - 40}
                            y1={y}
                            x2={magnifierPos.vbX + 40}
                            y2={y}
                            stroke={COLORS.gridLine}
                            strokeWidth={0.5}
                          />
                        );
                      })}
                    </g>
                    
                    {/* Shell outline */}
                    <rect
                      x={CANVAS_PADDING}
                      y={CANVAS_PADDING}
                      width={shellWidthPx}
                      height={shellHeightPx}
                      rx={4}
                      fill="none"
                      stroke={COLORS.shellStroke}
                      strokeWidth={1}
                    />
                    
                    {/* Existing fixtures in magnifier */}
                    {design.fixtures.map((fixture) => {
                      const catalogItem = catalog[fixture.catalogKey];
                      if (!catalogItem) return null;
                      const rect = rectFromFixture(fixture, catalogItem);
                      const x = CANVAS_PADDING + rect.x * BASE_SCALE;
                      const y = CANVAS_PADDING + rect.y * BASE_SCALE;
                      const width = rect.width * BASE_SCALE;
                      const height = rect.height * BASE_SCALE;
                      return (
                        <rect
                          key={`mag-fix-${fixture.id}`}
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          rx={2}
                          fill="rgba(100, 116, 139, 0.5)"
                          stroke="#64748b"
                          strokeWidth={1}
                          transform={`rotate(${fixture.rotationDeg || 0} ${x + width/2} ${y + height/2})`}
                        />
                      );
                    })}
                    
                    {/* Existing walls in magnifier */}
                    {design.fixtures
                      .filter((f) => f.catalogKey.includes('wall'))
                      .map((wall) => {
                        const wallCatalog = catalog[wall.catalogKey];
                        if (!wallCatalog) return null;
                        
                        const props = wall.properties as { lengthOverrideFt?: number; thicknessIn?: number } | undefined;
                        const lengthFt = props?.lengthOverrideFt ?? wallCatalog.footprintFt.length;
                        const thicknessIn = props?.thicknessIn ?? 4;
                        
                        // Wall is positioned at center, extends along its rotation
                        const isHorizontal = wall.rotationDeg === 0;
                        const halfLength = lengthFt / 2;
                        
                        let x1Ft, y1Ft, x2Ft, y2Ft;
                        if (isHorizontal) {
                          x1Ft = wall.xFt - halfLength;
                          x2Ft = wall.xFt + halfLength;
                          y1Ft = y2Ft = wall.yFt;
                        } else {
                          y1Ft = wall.yFt - halfLength;
                          y2Ft = wall.yFt + halfLength;
                          x1Ft = x2Ft = wall.xFt;
                        }
                        
                        return (
                          <line
                            key={`mag-wall-${wall.id}`}
                            x1={CANVAS_PADDING + x1Ft * BASE_SCALE}
                            y1={CANVAS_PADDING + y1Ft * BASE_SCALE}
                            x2={CANVAS_PADDING + x2Ft * BASE_SCALE}
                            y2={CANVAS_PADDING + y2Ft * BASE_SCALE}
                            stroke="#94a3b8"
                            strokeWidth={thicknessIn / 12 * BASE_SCALE}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    
                    {/* Wall preview line in magnifier */}
                    {wallDrawState && (
                      <>
                        {/* Wall line */}
                        <line
                          x1={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                          y1={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                          x2={magnifierPos.vbX}
                          y2={magnifierPos.vbY}
                          stroke="#06b6d4"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                        {/* Start point */}
                        <circle
                          cx={CANVAS_PADDING + wallDrawState.startPoint.xFt * BASE_SCALE}
                          cy={CANVAS_PADDING + wallDrawState.startPoint.yFt * BASE_SCALE}
                          r={4}
                          fill="#06b6d4"
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      </>
                    )}
                    
                    {/* Crosshair at center */}
                    <line
                      x1={magnifierPos.vbX - 15}
                      y1={magnifierPos.vbY}
                      x2={magnifierPos.vbX + 15}
                      y2={magnifierPos.vbY}
                      stroke="#22d3ee"
                      strokeWidth={1.5}
                    />
                    <line
                      x1={magnifierPos.vbX}
                      y1={magnifierPos.vbY - 15}
                      x2={magnifierPos.vbX}
                      y2={magnifierPos.vbY + 15}
                      stroke="#22d3ee"
                      strokeWidth={1.5}
                    />
                    
                    {/* Center dot (end point of wall) */}
                    <circle
                      cx={magnifierPos.vbX}
                      cy={magnifierPos.vbY}
                      r={4}
                      fill="#22d3ee"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </svg>
                  
                  {/* Pointer line from magnifier to actual position */}
                  <div 
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: 120,
                      width: 2,
                      height: 16,
                      background: "linear-gradient(to bottom, white, transparent)",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </TransformWrapper>
      </div>
    );
  }

  // Desktop: Use existing wheel/pointer handlers
  return (
    <div className="h-full w-full overflow-hidden bg-slate-950" data-canvas="fixture-canvas">
      <svg
        ref={svgRef}
        className="h-full w-full"
        style={{ touchAction: "none", cursor: pendingPlacement ? "crosshair" : undefined }}
        viewBox={`0 0 ${shellWidthPx + CANVAS_PADDING * 2} ${shellHeightPx + CANVAS_PADDING * 2
          }`}
        role="img"
        aria-label="Design workspace"
        onPointerDown={handleSvgPointerDown}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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
