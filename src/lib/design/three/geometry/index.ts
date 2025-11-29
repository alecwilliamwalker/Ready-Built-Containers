/**
 * Fixture Geometry - Factory functions for creating 3D fixture geometry
 * Creates recognizable shapes for each fixture type instead of plain boxes
 */

import * as THREE from "three";

// Re-export materials
export { FIXTURE_MATERIALS, createMaterial } from "./materials";

// Re-export bath fixtures
export {
  createToiletGeometry,
  createShowerGeometry,
  createVanityGeometry,
  createBathtubGeometry,
} from "./BathGeometry";

// Re-export kitchen fixtures
export {
  createRefrigeratorGeometry,
  createRangeGeometry,
  createSinkCabinetGeometry,
  createBaseCabinetGeometry,
  createUpperCabinetGeometry,
  createDishwasherGeometry,
} from "./KitchenGeometry";

// Re-export laundry fixtures
export {
  createDryerGeometry,
  createWasherGeometry,
} from "./LaundryGeometry";

// Re-export furniture fixtures
export {
  createIslandGeometry,
  createTableGeometry,
  createBedGeometry,
  createBunkBedGeometry,
  createSofaGeometry,
  createReclinerGeometry,
  createDeskGeometry,
  createDresserGeometry,
  createBenchGeometry,
  createCoatRackGeometry,
  createStorageCubbiesGeometry,
  createClosetSystemGeometry,
} from "./FurnitureGeometry";

// Re-export structural fixtures
export {
  createSteelEntryGeometry,
  createInteriorWallGeometry,
  createInteriorDoorGeometry,
  createExteriorDoorGeometry,
  createWindowGeometry,
  createGenericBoxGeometry,
} from "./StructuralGeometry";

// Import all geometry creators for the factory function
import { createToiletGeometry, createShowerGeometry, createVanityGeometry, createBathtubGeometry } from "./BathGeometry";
import { createRefrigeratorGeometry, createRangeGeometry, createSinkCabinetGeometry, createBaseCabinetGeometry, createUpperCabinetGeometry, createDishwasherGeometry } from "./KitchenGeometry";
import { createDryerGeometry, createWasherGeometry } from "./LaundryGeometry";
import { createIslandGeometry, createTableGeometry, createBedGeometry, createBunkBedGeometry, createSofaGeometry, createReclinerGeometry, createDeskGeometry, createDresserGeometry, createBenchGeometry, createCoatRackGeometry, createStorageCubbiesGeometry, createClosetSystemGeometry } from "./FurnitureGeometry";
import { createSteelEntryGeometry, createInteriorWallGeometry, createInteriorDoorGeometry, createExteriorDoorGeometry, createWindowGeometry, createGenericBoxGeometry } from "./StructuralGeometry";

/**
 * Get the appropriate geometry creator for a fixture type
 */
export function getFixtureGeometryCreator(fixtureKey: string): (
  widthFt: number,
  lengthFt: number,
  heightFt: number,
  properties?: Record<string, unknown>
) => THREE.Group {
  const key = fixtureKey.toLowerCase();

  // Entry Wall (vestibule)
  if (key.includes("vestibule")) return createSteelEntryGeometry;

  // Bath fixtures
  if (key.includes("toilet")) return createToiletGeometry;
  if (key.includes("shower")) return createShowerGeometry;
  if (key.includes("vanity")) return createVanityGeometry;
  if (key.includes("tub") || key.includes("bathtub")) return createBathtubGeometry;

  // Galley fixtures
  if (key.includes("fridge") || key.includes("refrigerator")) return createRefrigeratorGeometry;
  if (key.includes("range") || key.includes("stove") || key.includes("cooktop")) return createRangeGeometry;
  if (key.includes("sink") && key.includes("base")) return createSinkCabinetGeometry;
  if (key.includes("island")) return createIslandGeometry;
  if (key.includes("table")) return createTableGeometry;
  if (key.includes("upper") && key.includes("cabinet")) return createUpperCabinetGeometry;
  if (key.includes("cabinet")) return createBaseCabinetGeometry;

  // Laundry appliances
  if (key.includes("dishwasher")) return createDishwasherGeometry;
  if (key.includes("dryer")) return createDryerGeometry;
  if (key.includes("washer") || key.includes("laundry")) return createWasherGeometry;

  // Sleep/Living fixtures
  if (key.includes("bunk")) return createBunkBedGeometry;
  if (key.includes("bed")) return createBedGeometry;
  if (key.includes("sofa")) return createSofaGeometry;
  if (key.includes("recliner")) return createReclinerGeometry;
  if (key.includes("desk")) return createDeskGeometry;
  if (key.includes("dresser")) return createDresserGeometry;
  if (key.includes("bench")) return createBenchGeometry;
  if (key.includes("coat") && key.includes("rack")) return createCoatRackGeometry;

  // Storage fixtures
  if (key.includes("cubby") || key.includes("cubbies")) return createStorageCubbiesGeometry;
  if (key.includes("closet")) return createClosetSystemGeometry;

  // Doors (check before "wall" since interior-door contains neither)
  if (key.includes("exterior") && key.includes("door")) return createExteriorDoorGeometry;
  if (key.includes("door")) return createInteriorDoorGeometry;

  // Windows (wall openings - handled by ContainerWalls, not as floor fixtures)
  if (key.includes("window")) return createWindowGeometry;

  // Interior walls
  if (key.includes("wall")) return createInteriorWallGeometry;

  // Default fallback
  return createGenericBoxGeometry;
}

