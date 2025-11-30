// Coordinate system: Origin (0,0) at bottom-left interior corner
// xFt along container length, yFt along width, all in feet

export type FixtureCategory =
  | "shell-structure"
  | "fixture-bath"
  | "fixture-galley"
  | "fixture-sleep"
  | "opening"
  | "storage"
  | "interior"; // legacy support

export type UtilityType = "water" | "waste" | "power" | "vent";

export type FootprintAnchor = "center" | "front-left" | "back-left";

export type ModuleCatalogItem = {
  key: string;
  label: string;
  category: FixtureCategory;
  footprintFt: { length: number; width: number };
  footprintAnchor: FootprintAnchor;
  mount: "wall" | "floor";
  allowedZones?: string[];
  requiresUtilities?: UtilityType[];
  minClearanceFt?: { front?: number; back?: number; left?: number; right?: number };
  priceRule: {
    baseCents: number;
    perLinearFtCents?: number;
  };
  // 3D Model support
  modelUrl?: string;
  modelScale?: number;
  modelRotation?: { x: number; y: number; z: number };
  modelOffset?: { x: number; y: number; z: number };
  // Hide from fixture library (used for internal items like walls)
  hidden?: boolean;
};

// Legacy support - maps from DB format
export type ModuleCatalogEntry = {
  id: string;
  key: string;
  name: string;
  category: string;
  schemaJson: Record<string, unknown>;
  priceRuleJson: Record<string, unknown>;
  createdAt: string;
};

export type FixtureConfig = {
  id: string;
  catalogKey: string;
  name?: string;
  xFt: number;
  yFt: number;
  rotationDeg: 0 | 90 | 180 | 270;
  zone?: string;
  locked?: boolean;
  properties?: Record<string, unknown>;
};


export type ZoneConstraints = {
  minLengthFt: number;
  maxLengthFt?: number;
  canResize: boolean;
};

export type ZoneConfig = {
  id: string;
  name: string;
  xFt: number;
  yFt: number;
  lengthFt: number;
  widthFt: number;
  constraints?: ZoneConstraints;
};

// Annotation callout configuration
export type AnnotationConfig = {
  id: string;
  anchorFt: { x: number; y: number };  // Where the leader line points to
  labelFt: { x: number; y: number };   // Where the text label sits
  text: string;
  color?: string;  // Optional accent color
};

export type ShellConfig = {
  id: string;
  lengthFt: number;
  widthFt: number;
  heightFt: number;
};

export type DesignConfig = {
  version: 1;
  shell: ShellConfig;
  fixtures: FixtureConfig[];
  zones: ZoneConfig[];
  annotations?: AnnotationConfig[];
};

// Legacy support - old linear module placement
export type PlacedModule = {
  id: string;
  catalogKey: string;
  name: string;
  category: string;
  positionFt: number;
  lengthFt: number;
  notes?: string;
};

// Geometry types
export type RectFt = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Validation types
export type ValidationLevel = "error" | "warning";

export type ValidationIssue = {
  id: string;
  fixtureId?: string;
  level: ValidationLevel;
  code: string;
  message: string;
};

export type ValidationRule = (
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
) => ValidationIssue[];

// Pricing types
export type PriceLine = {
  fixtureId: string;
  catalogKey: string;
  label: string;
  quantity: number;
  lineCents: number;
};

export type PriceSummary = {
  subtotalCents: number;
  lines: PriceLine[];
};

// Editor state machine types
export type ViewportState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type DragState = {
  fixtureId: string;
  startXFt: number;
  startYFt: number;
  pointerStartPx: { x: number; y: number };
  fixtureWidth: number;
  fixtureHeight: number;
  footprintAnchor: "center" | "front-left" | "back-left";
};

export type MarqueeState = {
  origin: { x: number; y: number };
  current: { x: number; y: number };
  isActive: boolean;
};

export type ZoneDragState = {
  zoneId: string;
  startXFt: number;
  startYFt: number;
  pointerStartPx: { x: number; y: number };
};

export type ZoneResizeState = {
  zoneId: string;
  handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
  startXFt: number;
  startYFt: number;
  startLengthFt: number;
  startWidthFt: number;
  pointerStartPx: { x: number; y: number };
};

// Wall material types
export type WallMaterial = "drywall" | "plywood" | "wood" | "steel";

// Wall drawing state for click-to-draw tool
export type WallDrawState = {
  startPoint: { xFt: number; yFt: number };
  currentPoint: { xFt: number; yFt: number } | null;
};

// Wall length drag state for adjusting wall ends
export type WallLengthDragState = {
  fixtureId: string;
  end: "start" | "end"; // Which end of the wall is being dragged
  initialLengthFt: number;
  initialXFt: number; // Initial wall center X position
  initialYFt: number; // Initial wall center Y position
  isVisuallyHorizontal: boolean; // true if wall extends left-right on screen
  pointerStartPx: { x: number; y: number };
};

// Annotation drag state for moving anchor or label
export type AnnotationDragState = {
  annotationId: string;
  target: "anchor" | "label";  // Which part is being dragged
  startFt: { x: number; y: number };
  pointerStartPx: { x: number; y: number };
};

export type DesignEditorState = {
  design: DesignConfig;
  primarySelectedId?: string;
  selectedIds: string[];
  selectedZoneId?: string;
  selectedAnnotationId?: string;
  drag?: DragState;
  zoneDrag?: ZoneDragState;
  zoneResize?: ZoneResizeState;
  marquee?: MarqueeState;
  wallDraw?: WallDrawState;
  wallLengthDrag?: WallLengthDragState;
  annotationDrag?: AnnotationDragState;
  history: DesignConfig[];
  future: DesignConfig[];
  viewport: ViewportState;
  snapIncrement: number;
};

export type DesignAction =
  | { type: "SELECT_FIXTURE"; id?: string; append?: boolean }
  | { type: "SELECT_FIXTURES"; ids: string[] }
  | { type: "TOGGLE_FIXTURE_SELECTION"; id: string }
  | { type: "CLEAR_SELECTION" }
  | {
    type: "ADD_FIXTURE";
    catalogKey: string;
    zoneId?: string;
    xFt?: number;
    yFt?: number;
    rotationDeg?: 0 | 90 | 180 | 270;
  }
  | { type: "REMOVE_FIXTURE"; id: string }
  | {
    type: "UPDATE_FIXTURE_POSITION";
    id: string;
    xFt: number;
    yFt: number;
    fixtureWidth?: number;
    fixtureHeight?: number;
    footprintAnchor?: "center" | "front-left" | "back-left";
  }
  | {
    type: "UPDATE_FIXTURE_ROTATION";
    id: string;
    rotationDeg: 0 | 90 | 180 | 270;
  }
  | {
    type: "UPDATE_FIXTURE_SIZE";
    id: string;
    lengthFt?: number;
    widthFt?: number;
  }
  | {
    type: "START_DRAG";
    id: string;
    pointerStartPx: { x: number; y: number };
    fixtureWidth?: number;
    fixtureHeight?: number;
    footprintAnchor?: "center" | "front-left" | "back-left";
  }
  | {
    type: "UPDATE_DRAG";
    pointerCurrentPx: { x: number; y: number };
    scalePxPerFt: number;
    fixtureWidth?: number;
    fixtureHeight?: number;
    footprintAnchor?: "center" | "front-left" | "back-left";
    skipSnap?: boolean;  // Skip grid snapping (for mobile)
  }
  | { type: "END_DRAG" }
  | { type: "START_MARQUEE"; origin: { x: number; y: number } }
  | { type: "UPDATE_MARQUEE"; current: { x: number; y: number } }
  | { type: "END_MARQUEE" }
  | { type: "PAN_VIEWPORT"; deltaPx: { x: number; y: number }; bounds?: { minX: number; maxX: number; minY: number; maxY: number } }
  | { type: "ZOOM_VIEWPORT"; deltaScale: number; centerPx?: { x: number; y: number }; bounds?: { minX: number; maxX: number; minY: number; maxY: number } }
  | { type: "SET_VIEWPORT"; viewport: ViewportState }
  | { type: "SET_SNAP_INCREMENT"; snapIncrement: number }
  // Zone editing actions
  | { type: "SELECT_ZONE"; id?: string }
  | { type: "RESIZE_ZONE"; zoneId: string; newLengthFt: number }
  | { 
      type: "UPDATE_ZONE"; 
      id: string; 
      xFt?: number; 
      yFt?: number; 
      lengthFt?: number; 
      widthFt?: number;
      name?: string;
    }
  | {
      type: "START_ZONE_DRAG";
      id: string;
      pointerStartPx: { x: number; y: number };
    }
  | {
      type: "UPDATE_ZONE_DRAG";
      pointerCurrentPx: { x: number; y: number };
      scalePxPerFt: number;
    }
  | { type: "END_ZONE_DRAG" }
  | {
      type: "START_ZONE_RESIZE";
      id: string;
      handle: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
      pointerStartPx: { x: number; y: number };
    }
  | {
      type: "UPDATE_ZONE_RESIZE";
      pointerCurrentPx: { x: number; y: number };
      scalePxPerFt: number;
    }
  | { type: "END_ZONE_RESIZE" }
  | { type: "ADD_ZONE"; name?: string; xFt?: number; yFt?: number; lengthFt?: number; widthFt?: number }
  | { type: "REMOVE_ZONE"; id: string }
  | { type: "RENAME_ZONE"; id: string; name: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "UPDATE_DESIGN"; design: DesignConfig }
  | { type: "LOAD_DESIGN"; design: DesignConfig }
  // Wall drawing actions
  | { type: "START_WALL_DRAW"; startPoint: { xFt: number; yFt: number } }
  | { type: "UPDATE_WALL_DRAW"; currentPoint: { xFt: number; yFt: number } }
  | { type: "END_WALL_DRAW"; endPoint: { xFt: number; yFt: number } }
  | { type: "CANCEL_WALL_DRAW" }
  // Wall length drag actions
  | { type: "START_WALL_LENGTH_DRAG"; fixtureId: string; end: "start" | "end"; isVisuallyHorizontal: boolean; pointerStartPx: { x: number; y: number } }
  | { type: "UPDATE_WALL_LENGTH_DRAG"; pointerCurrentPx: { x: number; y: number }; scalePxPerFt: number }
  | { type: "END_WALL_LENGTH_DRAG" }
  // Fixture property updates
  | { type: "UPDATE_FIXTURE_PROPERTIES"; id: string; properties: Record<string, unknown> }
  // Fixture lock action
  | { type: "TOGGLE_FIXTURE_LOCK"; id: string }
  // Annotation actions
  | { type: "ADD_ANNOTATION"; anchorFt: { x: number; y: number }; labelFt: { x: number; y: number }; text?: string }
  | { type: "UPDATE_ANNOTATION"; id: string; anchorFt?: { x: number; y: number }; labelFt?: { x: number; y: number }; text?: string; color?: string }
  | { type: "REMOVE_ANNOTATION"; id: string }
  | { type: "SELECT_ANNOTATION"; id?: string }
  | { type: "START_ANNOTATION_DRAG"; id: string; target: "anchor" | "label"; pointerStartPx: { x: number; y: number } }
  | { type: "UPDATE_ANNOTATION_DRAG"; pointerCurrentPx: { x: number; y: number }; scalePxPerFt: number }
  | { type: "END_ANNOTATION_DRAG" };
