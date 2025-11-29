/**
 * Shared constants for 3D rendering
 * Single source of truth for coordinate system and visual settings
 */

// ============================================================================
// Coordinate System
// ============================================================================

/**
 * Conversion factor from feet to Three.js units
 * 1 foot = 0.25 units (4 feet per unit)
 */
export const FT_TO_UNITS = 0.25;

/**
 * Convert feet to Three.js units
 */
export function ftToUnits(ft: number): number {
  return ft * FT_TO_UNITS;
}

/**
 * Convert Three.js units to feet
 */
export function unitsToFt(units: number): number {
  return units / FT_TO_UNITS;
}

// ============================================================================
// Coordinate Mapping (2D to 3D)
// ============================================================================

/**
 * Coordinate system mapping:
 * 
 * 2D Plan View:
 *   - X axis: Along container length (left to right)
 *   - Y axis: Along container width (bottom to top)
 *   - Origin: Bottom-left corner of shell
 * 
 * 3D View:
 *   - X axis: Along container length (maps from 2D X)
 *   - Y axis: Vertical height (up)
 *   - Z axis: Along container width (maps from 2D Y)
 *   - Origin: Center of shell at floor level
 */
export const COORDINATE_SYSTEM = {
  /** 2D X maps to 3D X */
  LENGTH_AXIS_2D: 'x' as const,
  LENGTH_AXIS_3D: 'x' as const,
  
  /** 2D Y maps to 3D Z */
  WIDTH_AXIS_2D: 'y' as const,
  WIDTH_AXIS_3D: 'z' as const,
  
  /** Height is 3D Y */
  HEIGHT_AXIS_3D: 'y' as const,
} as const;

// ============================================================================
// Colors
// ============================================================================

export const COLORS = {
  // Scene
  SCENE_BACKGROUND: 0x0f172a,
  GROUND_PLANE: 0x1e293b,
  
  // Grid
  GRID_PRIMARY: 0x334155,
  GRID_SECONDARY: 0x1e293b,
  
  // Shell
  SHELL_WIREFRAME: 0x22d3ee,
  SHELL_BOUNDS: 0xfff3c4,
  
  // Fixture categories
  FIXTURE_DEFAULT: 0x64748b,
  FIXTURE_BATH: 0x3b82f6,
  FIXTURE_GALLEY: 0xf97316,
  FIXTURE_SLEEP: 0xa855f7,
  FIXTURE_SHELL: 0x22c55e,
  FIXTURE_STORAGE: 0x64748b,
  
  // Selection
  SELECTION_HIGHLIGHT: 0x22d3ee,
  SELECTION_EMISSIVE: 0x22d3ee,
  
  // Hover
  HOVER_EMISSIVE: 0x4ade80,
  HOVER_OUTLINE: 0x4ade80,
  
  // Snap Grid
  SNAP_GRID_COLOR: 0x22d3ee,
  SNAP_POINT_COLOR: 0xfbbf24,
  DRAG_PLANE_COLOR: 0x22d3ee,
  
  // Debug
  DEBUG_ORIGIN: 0xff0000,
  DEBUG_BOUNDS_GROUP: 0x00ff00,
  DEBUG_BOUNDS_INDIVIDUAL: 0xffff00,
  DEBUG_WIREFRAME: 0xff00ff,
  
  // Helpers
  HELPER_POLAR_PRIMARY: 0x22d3ee,
  HELPER_POLAR_SECONDARY: 0x0ea5e9,
} as const;

// ============================================================================
// Fixture Heights (by category)
// ============================================================================

export const FIXTURE_HEIGHTS_FT: Record<string, number> = {
  'shell-structure': 8,
  'fixture-sleep': 2,    // Beds are low
  'fixture-galley': 3,   // Counters
  'fixture-bath': 7,     // Showers/stalls are tall
  'storage': 6,          // Cabinets
  'opening': 7,          // Doors/windows
  'interior': 8,         // Interior walls - full height
  'default': 3,
};

/**
 * Get the height for a fixture category in feet
 */
export function getFixtureHeightFt(category: string): number {
  return FIXTURE_HEIGHTS_FT[category] ?? FIXTURE_HEIGHTS_FT.default;
}

/**
 * Get the color for a fixture category
 */
export function getFixtureColor(category: string): number {
  switch (category) {
    case 'fixture-bath':
      return COLORS.FIXTURE_BATH;
    case 'fixture-galley':
      return COLORS.FIXTURE_GALLEY;
    case 'fixture-sleep':
      return COLORS.FIXTURE_SLEEP;
    case 'shell-structure':
      return COLORS.FIXTURE_SHELL;
    case 'storage':
      return COLORS.FIXTURE_STORAGE;
    default:
      return COLORS.FIXTURE_DEFAULT;
  }
}

// ============================================================================
// Camera Settings
// ============================================================================

export const CAMERA_SETTINGS = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 1000,
  
  // OrbitControls
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 200,
  MAX_POLAR_ANGLE: Math.PI / 2,
  DAMPING_FACTOR: 0.05,
  
  // First-person movement speed (units per second)
  FIRST_PERSON_SPEED: 20,
} as const;

// ============================================================================
// Lighting Settings
// ============================================================================

export const LIGHTING = {
  AMBIENT_INTENSITY: 0.6,
  HEMISPHERE_INTENSITY: 0.6,
  DIRECTIONAL_INTENSITY: 0.8,
  SHADOW_MAP_SIZE: 2048,
  SHADOW_CAMERA_SIZE: 50,
} as const;

// ============================================================================
// Scene Dimensions
// ============================================================================

export const SCENE_DIMENSIONS = {
  GROUND_SIZE: 200,
  GRID_SIZE: 100,
  GRID_DIVISIONS: 100,
} as const;

// ============================================================================
// Material Settings
// ============================================================================

export const MATERIAL_SETTINGS = {
  GROUND_ROUGHNESS: 0.8,
  GROUND_METALNESS: 0.2,
  FIXTURE_OPACITY: 0.95,
  FIXTURE_SELECTED_OPACITY: 1.0,
  SELECTION_EMISSIVE_INTENSITY: 0.4,
  HOVER_EMISSIVE_INTENSITY: 0.25,
} as const;

// ============================================================================
// Interaction Settings
// ============================================================================

export const INTERACTION_SETTINGS = {
  // Snap grid - 0.25ft allows placing 0.5ft-deep fixtures (doors, windows) flush against walls
  SNAP_INCREMENT_FT: 0.25,
  SNAP_GRID_SIZE: 20,
  SNAP_POINT_SIZE: 0.08,
  
  // Drag plane
  DRAG_PLANE_OPACITY: 0.1,
  
  // Hit area expansion (makes objects easier to click)
  HIT_AREA_PADDING_FT: 0.25,
} as const;

// ============================================================================
// Fixture Material Colors (from cabin reference photos)
// ============================================================================

export const FIXTURE_MATERIAL_COLORS = {
  // Wood cabinets - warm brown like the cabin photos
  WOOD_CABINET: 0x8B5A2B,
  
  // White porcelain fixtures (toilet, sink basin)
  WHITE_PORCELAIN: 0xF5F5F5,
  
  // Countertops - light gray stone/laminate
  COUNTERTOP: 0xD3D3D3,
  
  // Refrigerator - dark charcoal/black
  APPLIANCE_DARK: 0x2F2F2F,
  
  // Stove/Range - stainless steel
  APPLIANCE_STAINLESS: 0x8A8A8A,
  
  // Bed frame - dark metal
  BED_FRAME: 0x4A4A4A,
  
  // Mattress/cushions - cream
  MATTRESS: 0xE8DCC8,
  
  // Pillows - white
  PILLOW: 0xFAFAFA,
  
  // Shower base - off-white
  SHOWER_BASE: 0xE8E8E8,
  
  // Glass/transparent elements
  GLASS: 0xADD8E6,
  
  // Chrome/faucets
  CHROME: 0xC0C0C0,
} as const;

// ============================================================================
// Zone Wall Settings
// ============================================================================

export const ZONE_WALL_SETTINGS = {
  HEIGHT_FT: 8,           // Standard interior wall height
  THICKNESS: 0.02,        // Thin for glass-like appearance
  OPACITY: 0.15,          // Transparent
  COLOR: 0xFFFFFF,        // White
  EDGE_COLOR: 0x88CCFF,   // Light blue edge highlight
  DOOR_GAP_FT: 3,         // Gap for doorways
} as const;

// ============================================================================
// Environment Settings (Forest Scene)
// ============================================================================

export const ENVIRONMENT_COLORS = {
  // Sky
  SKY_TOP: 0x87CEEB,         // Sky blue
  SKY_HORIZON: 0xE0E8F0,     // Pale blue/white at horizon
  SKY_BOTTOM: 0xB8C4D0,      // Slightly darker at ground level
  
  // Ground/Grass
  GRASS_PRIMARY: 0x4A7C4E,   // Forest green
  GRASS_SECONDARY: 0x3D6B41, // Darker green variation
  DIRT: 0x8B7355,            // Brown earth
  
  // Trees
  TREE_TRUNK: 0x5D4037,      // Brown bark
  TREE_FOLIAGE: 0x2E7D32,    // Dark green pine
  TREE_FOLIAGE_LIGHT: 0x4CAF50, // Lighter green variation
  
  // Container exterior
  CONTAINER_EXTERIOR: 0xD4C5A9, // Tan/beige corrugated metal
  CONTAINER_INTERIOR: 0xF5F5F0, // Off-white drywall
  CONTAINER_TRIM: 0x8B4513,     // Dark wood trim
  
  // Window
  WINDOW_FRAME: 0xFFFFFF,    // White frame
  WINDOW_GLASS: 0xADD8E6,    // Light blue tinted glass
} as const;

export const ENVIRONMENT_SETTINGS = {
  // Sky dome
  SKY_RADIUS: 400,
  
  // Ground
  GROUND_RADIUS: 300,
  
  // Trees
  TREE_COUNT: 40,
  TREE_MIN_DISTANCE: 20,     // Minimum distance from container
  TREE_MAX_DISTANCE: 100,    // Maximum distance from container
  TREE_MIN_HEIGHT: 8,
  TREE_MAX_HEIGHT: 20,
  
  // Grass patches
  GRASS_PATCH_COUNT: 100,
} as const;

