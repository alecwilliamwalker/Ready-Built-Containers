/**
 * Three.js utilities for design visualization
 * Barrel export file
 */

// Constants
export * from "./constants";

// Core classes
export { SceneManager } from "./SceneManager";
export type { ShellDimensions, SceneManagerConfig, SceneManagerCallbacks } from "./SceneManager";

export { FixtureRenderer } from "./FixtureRenderer";
export type { FixtureRenderConfig } from "./FixtureRenderer";

export { CameraController } from "./CameraController";
export type { CameraView, CameraControllerConfig, CameraControllerCallbacks } from "./CameraController";

export { modelCache, ModelCacheManager } from "./ModelCache";
export type { ModelConfig } from "./ModelCache";

export { ZoneWallRenderer } from "./ZoneWallRenderer";

export { EnvironmentManager, createSkyDome, createForestGround, createForest } from "./Environment";

export { ContainerWallsRenderer } from "./ContainerWalls";
export type { WallSide, WindowOpening } from "./ContainerWalls";

export { FloorPlaneDragController } from "./FloorPlaneDragController";
export type { DragState, FloorPlaneDragCallbacks } from "./FloorPlaneDragController";

// Fixture geometry factories
export { 
  getFixtureGeometryCreator,
  FIXTURE_MATERIALS,
  createMaterial,
  // Bath
  createToiletGeometry,
  createShowerGeometry,
  createVanityGeometry,
  createBathtubGeometry,
  // Kitchen
  createRefrigeratorGeometry,
  createRangeGeometry,
  createSinkCabinetGeometry,
  createBaseCabinetGeometry,
  createUpperCabinetGeometry,
  createDishwasherGeometry,
  // Laundry
  createDryerGeometry,
  createWasherGeometry,
  // Furniture
  createIslandGeometry,
  createTableGeometry,
  createBedGeometry,
  createBunkBedGeometry,
  createSofaGeometry,
  createDeskGeometry,
  createBenchGeometry,
  createCoatRackGeometry,
  // Storage
  createStorageCubbiesGeometry,
  createClosetSystemGeometry,
  // Structural
  createSteelEntryGeometry,
  createInteriorWallGeometry,
  createInteriorDoorGeometry,
  createExteriorDoorGeometry,
  createWindowGeometry,
  createGenericBoxGeometry,
} from "./geometry";

// Hooks
export { useThreeScene } from "./hooks/useThreeScene";
export type { UseThreeSceneOptions, UseThreeSceneReturn } from "./hooks/useThreeScene";

export { useFixtureSync } from "./hooks/useFixtureSync";
export type { UseFixtureSyncOptions, UseFixtureSyncReturn } from "./hooks/useFixtureSync";

