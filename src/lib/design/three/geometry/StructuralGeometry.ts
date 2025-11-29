/**
 * Structural Fixtures - Entry Wall, Interior Walls, Doors, Windows, Generic Box
 */

import * as THREE from "three";
import { ftToUnits } from "../constants";
import { FIXTURE_MATERIALS, createMaterial } from "./materials";

/**
 * Create an entry wall - thin wall with integrated door and window
 * This is the cedar-clad wall visible when container doors open
 * 
 * Coordinate mapping:
 * - 2D Plan: X = container length (depth), Y = container width (span)
 * - 3D: X = container length, Y = height, Z = container width
 * - So 2D Y maps to 3D Z
 * 
 * Parameters from FixtureRenderer: widthFt = footprint width (8ft span), lengthFt = footprint length (0.67ft thickness)
 */
export function createSteelEntryGeometry(
  widthFt: number,
  lengthFt: number,
  heightFt: number,
  _properties?: Record<string, unknown>
): THREE.Group {
  const group = new THREE.Group();

  // Debug logging to verify dimensions
  console.log(`[Entry] Creating with widthFt=${widthFt}, lengthFt=${lengthFt}, heightFt=${heightFt}`);

  // widthFt = 8ft (wall span), lengthFt = 0.67ft (wall thickness)
  // Geometry is built with span along Z, then rotated 90° at the end
  // to match the convention used by other fixtures (widthFt → X, lengthFt → Z)
  const wallSpan = ftToUnits(widthFt);       // Built along Z, rotated to X
  const wallThickness = ftToUnits(lengthFt); // Built along X, rotated to Z
  const wallHeight = ftToUnits(heightFt);    // Along Y axis (floor to ceiling)

  // Door: 3ft wide x 7ft tall, positioned on one side (negative Z)
  const doorWidth = ftToUnits(3);
  const doorHeight = ftToUnits(7);
  const doorCenterZ = -wallSpan * 0.25;

  // Window: 2.5ft wide x 3ft tall, positioned on other side (positive Z), 3ft from floor
  const windowWidth = ftToUnits(2.5);
  const windowHeight = ftToUnits(3);
  const windowCenterZ = wallSpan * 0.25;
  const windowBottomY = ftToUnits(3);

  // Materials
  const cedarMat = createMaterial(0xB8946F, { roughness: 0.85, metalness: 0.0 });
  const doorMat = createMaterial(0x4A1C0A, { roughness: 0.4, metalness: 0.0 });
  const frameMat = createMaterial(0xF5F5F0, { roughness: 0.5, metalness: 0.0 });
  const glassMat = createMaterial(0x87CEEB, { transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0.3 });

  // Build wall sections: BoxGeometry(X=thickness, Y=height, Z=width)

  // 1. Far left section (negative Z edge to door left)
  const leftEdgeZ = -wallSpan / 2;
  const doorLeftZ = doorCenterZ - doorWidth / 2;
  const leftSectionSpan = doorLeftZ - leftEdgeZ;
  console.log(`[Entry] Section 1 (left): span=${leftSectionSpan.toFixed(2)}, valid=${leftSectionSpan > 0.01}`);
  if (leftSectionSpan > 0.01) {
    const leftGeom = new THREE.BoxGeometry(wallThickness, wallHeight, leftSectionSpan);
    const leftWall = new THREE.Mesh(leftGeom, cedarMat);
    leftWall.position.set(0, wallHeight / 2, leftEdgeZ + leftSectionSpan / 2);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);
  }

  // 2. Above door section
  const aboveDoorHeight = wallHeight - doorHeight;
  console.log(`[Entry] Section 2 (above door): height=${aboveDoorHeight.toFixed(2)}, valid=${aboveDoorHeight > 0.01}`);
  if (aboveDoorHeight > 0.01) {
    const aboveDoorGeom = new THREE.BoxGeometry(wallThickness, aboveDoorHeight, doorWidth);
    const aboveDoor = new THREE.Mesh(aboveDoorGeom, cedarMat);
    aboveDoor.position.set(0, doorHeight + aboveDoorHeight / 2, doorCenterZ);
    aboveDoor.castShadow = true;
    aboveDoor.receiveShadow = true;
    group.add(aboveDoor);
  }

  // 3. Section between door and window (full height)
  const doorRightZ = doorCenterZ + doorWidth / 2;
  const windowLeftZ = windowCenterZ - windowWidth / 2;
  const middleSectionSpan = windowLeftZ - doorRightZ;
  console.log(`[Entry] Section 3 (middle): span=${middleSectionSpan.toFixed(2)}, valid=${middleSectionSpan > 0.01}`);
  if (middleSectionSpan > 0.01) {
    const middleGeom = new THREE.BoxGeometry(wallThickness, wallHeight, middleSectionSpan);
    const middleWall = new THREE.Mesh(middleGeom, cedarMat);
    middleWall.position.set(0, wallHeight / 2, doorRightZ + middleSectionSpan / 2);
    middleWall.castShadow = true;
    middleWall.receiveShadow = true;
    group.add(middleWall);
  }

  // 4. Below window section
  console.log(`[Entry] Section 4 (below window): height=${windowBottomY.toFixed(2)}, valid=${windowBottomY > 0.01}`);
  if (windowBottomY > 0.01) {
    const belowWindowGeom = new THREE.BoxGeometry(wallThickness, windowBottomY, windowWidth);
    const belowWindow = new THREE.Mesh(belowWindowGeom, cedarMat);
    belowWindow.position.set(0, windowBottomY / 2, windowCenterZ);
    belowWindow.castShadow = true;
    belowWindow.receiveShadow = true;
    group.add(belowWindow);
  }

  // 5. Above window section
  const windowTopY = windowBottomY + windowHeight;
  const aboveWindowHeight = wallHeight - windowTopY;
  console.log(`[Entry] Section 5 (above window): height=${aboveWindowHeight.toFixed(2)}, valid=${aboveWindowHeight > 0.01}`);
  if (aboveWindowHeight > 0.01) {
    const aboveWindowGeom = new THREE.BoxGeometry(wallThickness, aboveWindowHeight, windowWidth);
    const aboveWindow = new THREE.Mesh(aboveWindowGeom, cedarMat);
    aboveWindow.position.set(0, windowTopY + aboveWindowHeight / 2, windowCenterZ);
    aboveWindow.castShadow = true;
    aboveWindow.receiveShadow = true;
    group.add(aboveWindow);
  }

  // 6. Far right section (window right to positive Z edge)
  const windowRightZ = windowCenterZ + windowWidth / 2;
  const rightEdgeZ = wallSpan / 2;
  const rightSectionSpan = rightEdgeZ - windowRightZ;
  console.log(`[Entry] Section 6 (right): span=${rightSectionSpan.toFixed(2)}, valid=${rightSectionSpan > 0.01}`);
  if (rightSectionSpan > 0.01) {
    const rightGeom = new THREE.BoxGeometry(wallThickness, wallHeight, rightSectionSpan);
    const rightWall = new THREE.Mesh(rightGeom, cedarMat);
    rightWall.position.set(0, wallHeight / 2, windowRightZ + rightSectionSpan / 2);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);
  }

  // === DOOR FRAME AND PANEL ===
  const frameThick = ftToUnits(0.08);

  // Door frame - top
  const doorFrameTopGeom = new THREE.BoxGeometry(wallThickness, frameThick, doorWidth + frameThick * 2);
  const doorFrameTop = new THREE.Mesh(doorFrameTopGeom, frameMat);
  doorFrameTop.position.set(0, doorHeight, doorCenterZ);
  group.add(doorFrameTop);

  // Door frame - sides
  const doorFrameSideGeom = new THREE.BoxGeometry(wallThickness, doorHeight, frameThick);
  const doorFrameL = new THREE.Mesh(doorFrameSideGeom, frameMat);
  doorFrameL.position.set(0, doorHeight / 2, doorLeftZ);
  group.add(doorFrameL);

  const doorFrameR = new THREE.Mesh(doorFrameSideGeom, frameMat);
  doorFrameR.position.set(0, doorHeight / 2, doorLeftZ + doorWidth);
  group.add(doorFrameR);

  // Door panel (ajar at 30 degrees, swings into interior = positive X)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(wallThickness / 2, 0, doorLeftZ);

  const doorPanelGeom = new THREE.BoxGeometry(ftToUnits(0.15), doorHeight, doorWidth);
  const doorPanel = new THREE.Mesh(doorPanelGeom, doorMat);
  doorPanel.position.set(ftToUnits(0.075), doorHeight / 2, doorWidth / 2);
  doorPanel.castShadow = true;
  doorPivot.add(doorPanel);

  // Door handle
  const knobGeom = new THREE.SphereGeometry(ftToUnits(0.08), 16, 16);
  const handleMat = createMaterial(0xB5A642, { roughness: 0.25, metalness: 0.85 });
  const knob = new THREE.Mesh(knobGeom, handleMat);
  knob.position.set(ftToUnits(0.15) + ftToUnits(0.08), ftToUnits(3), doorWidth - ftToUnits(0.3));
  doorPivot.add(knob);

  doorPivot.rotation.y = Math.PI / 6; // 30 degrees open into interior
  group.add(doorPivot);

  // === WINDOW FRAME AND GLASS ===
  // Window frame - top/bottom
  const windowFrameHGeom = new THREE.BoxGeometry(wallThickness, frameThick, windowWidth + frameThick * 2);
  const windowFrameTop = new THREE.Mesh(windowFrameHGeom, frameMat);
  windowFrameTop.position.set(0, windowBottomY + windowHeight, windowCenterZ);
  group.add(windowFrameTop);

  const windowFrameBottom = new THREE.Mesh(windowFrameHGeom, frameMat);
  windowFrameBottom.position.set(0, windowBottomY, windowCenterZ);
  group.add(windowFrameBottom);

  // Window frame - sides
  const windowFrameVGeom = new THREE.BoxGeometry(wallThickness, windowHeight, frameThick);
  const windowFrameL = new THREE.Mesh(windowFrameVGeom, frameMat);
  windowFrameL.position.set(0, windowBottomY + windowHeight / 2, windowLeftZ);
  group.add(windowFrameL);

  const windowFrameR = new THREE.Mesh(windowFrameVGeom, frameMat);
  windowFrameR.position.set(0, windowBottomY + windowHeight / 2, windowRightZ);
  group.add(windowFrameR);

  // Window glass
  const glassGeom = new THREE.BoxGeometry(ftToUnits(0.02), windowHeight - frameThick, windowWidth - frameThick);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.set(0, windowBottomY + windowHeight / 2, windowCenterZ);
  group.add(glass);

  // Rotate 90 degrees to swap X and Z axes, matching the convention used by other fixtures
  // This makes the wall span along X (matching 2D horizontal) instead of Z
  group.rotation.y = Math.PI / 2;

  return group;
}

/**
 * Create an interior wall with configurable material
 * Supports different materials: drywall, plywood, wood, steel
 * Optionally semi-transparent for 3D visibility
 * 
 * Note: Parameters come from FixtureRenderer as (footprintWidth, footprintLength, height, properties)
 * For walls: footprintWidth is the thickness (0.25), footprintLength is the wall length (4+)
 * 
 * In 2D, footprintLength goes along Y axis (height in rectFromFixture when unrotated)
 * In 3D, this corresponds to the Z axis
 */
export function createInteriorWallGeometry(
  _thicknessFt: number, // Footprint width - not used, we use fixed thickness
  wallLengthFt: number, // Footprint length - actual wall length
  heightFt: number,
  properties?: Record<string, unknown>
): THREE.Group {
  const group = new THREE.Group();

  // Get material and transparency settings from properties
  const material = (properties?.material as string) ?? "drywall";
  const transparent3D = (properties?.transparent3D as boolean) ?? true;

  // Wall extends along Z axis (matching 2D Y axis / footprintLength)
  const wallLength = ftToUnits(wallLengthFt);  // Along Z axis
  const wallThickness = ftToUnits(0.3);   // Along X axis (wall thickness)
  const wallHeight = ftToUnits(heightFt); // Along Y axis (floor to ceiling)

  // Material colors based on type
  const materialColors: Record<string, { color: number; roughness: number; metalness: number }> = {
    drywall: { color: 0xF5F5F0, roughness: 0.9, metalness: 0.0 },
    plywood: { color: 0xD4A574, roughness: 0.8, metalness: 0.0 },
    wood: { color: 0x8B6F47, roughness: 0.7, metalness: 0.0 },
    steel: { color: 0x888888, roughness: 0.3, metalness: 0.8 },
  };

  const matProps = materialColors[material] || materialColors.drywall;

  // Create wall material
  const wallMat = new THREE.MeshStandardMaterial({
    color: matProps.color,
    roughness: matProps.roughness,
    metalness: matProps.metalness,
    transparent: transparent3D,
    opacity: transparent3D ? 0.4 : 1.0,
    side: transparent3D ? THREE.DoubleSide : THREE.FrontSide,
    depthWrite: !transparent3D,
  });

  // Main wall panel
  // BoxGeometry(x, y, z) = (thickness, height, length)
  const wallGeom = new THREE.BoxGeometry(
    wallThickness,    // X = thickness
    wallHeight,       // Y = height (floor to ceiling)
    wallLength        // Z = wall length
  );
  const wall = new THREE.Mesh(wallGeom, wallMat);
  wall.position.set(0, wallHeight / 2, 0);
  wall.castShadow = !transparent3D;
  wall.receiveShadow = true;
  if (transparent3D) {
    wall.renderOrder = 1;  // Render after opaque objects
  }
  group.add(wall);

  // Add trim at top and bottom for more realistic look
  const trimMat = new THREE.MeshStandardMaterial({
    color: material === "steel" ? 0x666666 : 0xE8E4DC,
    roughness: 0.6,
    metalness: material === "steel" ? 0.5 : 0.0,
    transparent: transparent3D,
    opacity: transparent3D ? 0.5 : 1.0,
  });

  const trimHeight = ftToUnits(0.15);
  const trimDepth = ftToUnits(0.35);

  // Bottom trim (baseboard)
  const bottomTrimGeom = new THREE.BoxGeometry(trimDepth, trimHeight, wallLength);
  const bottomTrim = new THREE.Mesh(bottomTrimGeom, trimMat);
  bottomTrim.position.set(0, trimHeight / 2, 0);
  bottomTrim.castShadow = true;
  bottomTrim.receiveShadow = true;
  group.add(bottomTrim);

  // Top trim (crown)
  const topTrimGeom = new THREE.BoxGeometry(trimDepth, trimHeight, wallLength);
  const topTrim = new THREE.Mesh(topTrimGeom, trimMat);
  topTrim.position.set(0, wallHeight - trimHeight / 2, 0);
  topTrim.castShadow = true;
  topTrim.receiveShadow = true;
  group.add(topTrim);

  // Add edge lines for better visibility
  const edgeGeom = new THREE.EdgesGeometry(wallGeom);
  const edgeMat = new THREE.LineBasicMaterial({
    color: transparent3D ? 0x888888 : 0x666666,
    transparent: true,
    opacity: transparent3D ? 0.3 : 0.5
  });
  const edges = new THREE.LineSegments(edgeGeom, edgeMat);
  edges.position.copy(wall.position);
  group.add(edges);

  return group;
}

/**
 * Create an interior door - door panel with frame, shown ajar at 45 degrees
 * The door pivots from the hinge side so you can see swing clearance
 */
export function createInteriorDoorGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  // Door dimensions from footprint
  // widthFt = frame depth (perpendicular to wall, typically 0.5ft)
  // lengthFt = door opening width (typically 3ft)
  const openingWidth = ftToUnits(lengthFt);
  const frameDepth = ftToUnits(widthFt);     // Use actual footprint width for frame depth
  const doorThickness = ftToUnits(0.125);    // Door panel thickness
  const doorHeight = ftToUnits(7);           // Standard 7ft door
  const frameThickness = ftToUnits(0.08);    // Frame member thickness

  // Door material - rich wood brown
  const doorMat = createMaterial(0x6B3A0A, {
    roughness: 0.5,
    metalness: 0.0,
  });

  // Door handle material - brushed nickel
  const handleMat = createMaterial(0xC0C0C0, {
    roughness: 0.2,
    metalness: 0.9,
  });

  // Frame material - white/off-white
  const frameMat = createMaterial(0xF5F5F0, {
    roughness: 0.5,
    metalness: 0.0,
  });

  // === DOOR FRAME (stays within footprint) ===
  // Frame is centered at origin, doesn't rotate with door

  // Top frame piece (fits within openingWidth)
  const topFrameGeom = new THREE.BoxGeometry(frameDepth, frameThickness, openingWidth);
  const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
  topFrame.position.set(0, doorHeight, 0);
  topFrame.castShadow = true;
  topFrame.receiveShadow = true;
  group.add(topFrame);

  // Left frame piece (at -Z, inset from edge)
  const sideFrameGeom = new THREE.BoxGeometry(frameDepth, doorHeight, frameThickness);
  const leftFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  leftFrame.position.set(0, doorHeight / 2, -openingWidth / 2 + frameThickness / 2);
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  group.add(leftFrame);

  // Right frame piece (at +Z, inset from edge)
  const rightFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  rightFrame.position.set(0, doorHeight / 2, openingWidth / 2 - frameThickness / 2);
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  group.add(rightFrame);

  // === DOOR PANEL ===
  const doorPivot = new THREE.Group();
  // Hinge at one edge of the opening (inset to stay within bounds)
  const hingeZ = -openingWidth / 2 + frameThickness;
  doorPivot.position.set(0, 0, hingeZ);

  // Panel is slightly smaller to fit within frame
  const panelWidth = openingWidth - frameThickness * 2;
  const panelHeight = doorHeight;

  const panelGeom = new THREE.BoxGeometry(doorThickness, panelHeight, panelWidth);
  const doorPanel = new THREE.Mesh(panelGeom, doorMat);
  doorPanel.position.set(0, panelHeight / 2, panelWidth / 2);
  doorPanel.castShadow = true;
  doorPanel.receiveShadow = true;
  doorPivot.add(doorPanel);

  // Door handle at standard height (~36 inches from floor)
  const handleHeight = ftToUnits(3);
  const handleOffset = panelWidth - ftToUnits(0.2);

  const handleBaseGeom = new THREE.CylinderGeometry(
    ftToUnits(0.04), ftToUnits(0.04), ftToUnits(0.08), 12
  );
  const handleBase = new THREE.Mesh(handleBaseGeom, handleMat);
  handleBase.rotation.z = Math.PI / 2;
  handleBase.position.set(doorThickness / 2 + ftToUnits(0.04), handleHeight, handleOffset);
  doorPivot.add(handleBase);

  // Lever handle
  const leverGeom = new THREE.BoxGeometry(ftToUnits(0.1), ftToUnits(0.03), ftToUnits(0.15));
  const lever = new THREE.Mesh(leverGeom, handleMat);
  lever.position.set(doorThickness / 2 + ftToUnits(0.09), handleHeight, handleOffset);
  doorPivot.add(lever);

  // Rotate door 45 degrees open
  doorPivot.rotation.y = Math.PI / 4;

  group.add(doorPivot);

  return group;
}

/**
 * Create an exterior door - door panel with frame, shown ajar at 45 degrees
 */
export function createExteriorDoorGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  // Door dimensions from footprint
  // widthFt = frame depth (perpendicular to wall, typically 0.5ft)
  // lengthFt = door opening width (typically 3ft)
  const openingWidth = ftToUnits(lengthFt);
  const frameDepth = ftToUnits(widthFt);     // Use actual footprint width for frame depth
  const doorThickness = ftToUnits(0.15);     // Door thickness
  const doorHeight = ftToUnits(7);           // Standard 7ft door
  const frameThickness = ftToUnits(0.08);    // Frame member thickness

  // Door material - deep brown/burgundy (classic exterior door)
  const doorMat = createMaterial(0x4A1C0A, {
    roughness: 0.4,
    metalness: 0.0,
  });

  // Handle material - antique brass
  const handleMat = createMaterial(0xB5A642, {
    roughness: 0.25,
    metalness: 0.85,
  });

  // Frame material - white
  const frameMat = createMaterial(0xF5F5F0, {
    roughness: 0.5,
    metalness: 0.0,
  });

  // === DOOR FRAME (stays within footprint) ===
  // Frame is centered at origin, doesn't rotate with door

  // Top frame piece (fits within openingWidth)
  const topFrameGeom = new THREE.BoxGeometry(frameDepth, frameThickness, openingWidth);
  const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
  topFrame.position.set(0, doorHeight, 0);
  topFrame.castShadow = true;
  topFrame.receiveShadow = true;
  group.add(topFrame);

  // Left frame piece (at -Z, inset from edge)
  const sideFrameGeom = new THREE.BoxGeometry(frameDepth, doorHeight, frameThickness);
  const leftFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  leftFrame.position.set(0, doorHeight / 2, -openingWidth / 2 + frameThickness / 2);
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  group.add(leftFrame);

  // Right frame piece (at +Z, inset from edge)
  const rightFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  rightFrame.position.set(0, doorHeight / 2, openingWidth / 2 - frameThickness / 2);
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  group.add(rightFrame);

  // === DOOR PANEL ===
  const doorPivot = new THREE.Group();
  // Hinge at one edge of the opening (inset to stay within bounds)
  const hingeZ = -openingWidth / 2 + frameThickness;
  doorPivot.position.set(0, 0, hingeZ);

  // Panel is slightly smaller to fit within frame
  const panelWidth = openingWidth - frameThickness * 2;
  const panelHeight = doorHeight;

  const panelGeom = new THREE.BoxGeometry(doorThickness, panelHeight, panelWidth);
  const doorPanel = new THREE.Mesh(panelGeom, doorMat);
  doorPanel.position.set(0, panelHeight / 2, panelWidth / 2);
  doorPanel.castShadow = true;
  doorPanel.receiveShadow = true;
  doorPivot.add(doorPanel);

  // Door handle at standard height (~36 inches from floor)
  const handleHeight = ftToUnits(3);
  const handleOffset = panelWidth - ftToUnits(0.2);

  // Door knob base
  const knobBaseGeom = new THREE.CylinderGeometry(ftToUnits(0.05), ftToUnits(0.05), ftToUnits(0.08), 16);
  const knobBase = new THREE.Mesh(knobBaseGeom, handleMat);
  knobBase.rotation.z = Math.PI / 2;
  knobBase.position.set(doorThickness / 2 + ftToUnits(0.04), handleHeight, handleOffset);
  doorPivot.add(knobBase);

  // Door knob
  const knobGeom = new THREE.SphereGeometry(ftToUnits(0.08), 16, 16);
  const knob = new THREE.Mesh(knobGeom, handleMat);
  knob.position.set(doorThickness / 2 + ftToUnits(0.12), handleHeight, handleOffset);
  doorPivot.add(knob);

  // Rotate door 45 degrees open
  doorPivot.rotation.y = Math.PI / 4;

  group.add(doorPivot);

  return group;
}

/**
 * Create a floating window frame with glass
 * This is a standalone 3D object that can be moved freely and positioned on walls manually.
 * 
 * Parameters from FixtureRenderer:
 * - widthFt = footprint width (frame depth, ~0.5ft)
 * - lengthFt = footprint length (window width along wall, 2-3ft)
 * - heightFt = container height (used as reference)
 * 
 * Window dimensions are derived from catalog key patterns:
 * - fixture-window-24x36: 24" wide × 36" tall = 2ft × 3ft
 * - fixture-window-36x48: 36" wide × 48" tall = 3ft × 4ft
 */
export function createWindowGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number,
  properties?: Record<string, unknown>
): THREE.Group {
  const group = new THREE.Group();

  // Window dimensions from footprint
  // widthFt = frame depth (perpendicular to wall, typically 0.5ft)
  // lengthFt = window width along wall (e.g., 2ft for 24x36, 3ft for 36x48)
  const windowWidth = ftToUnits(lengthFt);
  const frameDepth = ftToUnits(widthFt);   // Use actual footprint width for frame depth
  
  // Derive window height from width ratio (standard window proportions)
  // 24x36 = 2ft wide × 3ft tall (1:1.5 ratio)
  // 36x48 = 3ft wide × 4ft tall (1:1.33 ratio)
  // Default to 3ft tall for 2ft wide, 4ft tall for 3ft wide
  const windowHeightFt = lengthFt <= 2 ? 3 : 4;
  const windowHeight = ftToUnits(windowHeightFt);
  
  const frameThickness = ftToUnits(0.08);  // Frame member thickness
  
  // Standard window sill height (4ft from floor)
  const sillHeight = ftToUnits(4);

  // Frame material - white
  const frameMat = createMaterial(0xF5F5F0, {
    roughness: 0.5,
    metalness: 0.0,
  });

  // Glass material - light blue, semi-transparent
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x87CEEB,
    transparent: true,
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  // === WINDOW FRAME ===
  // Frame is positioned at sill height
  
  // Top frame piece
  const topFrameGeom = new THREE.BoxGeometry(frameDepth, frameThickness, windowWidth + frameThickness * 2);
  const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
  topFrame.position.set(0, sillHeight + windowHeight - frameThickness / 2, 0);
  topFrame.castShadow = true;
  topFrame.receiveShadow = true;
  group.add(topFrame);

  // Bottom frame piece (sill)
  const bottomFrameGeom = new THREE.BoxGeometry(frameDepth, frameThickness, windowWidth + frameThickness * 2);
  const bottomFrame = new THREE.Mesh(bottomFrameGeom, frameMat);
  bottomFrame.position.set(0, sillHeight + frameThickness / 2, 0);
  bottomFrame.castShadow = true;
  bottomFrame.receiveShadow = true;
  group.add(bottomFrame);

  // Left frame piece
  const sideFrameGeom = new THREE.BoxGeometry(frameDepth, windowHeight - frameThickness * 2, frameThickness);
  const leftFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  leftFrame.position.set(0, sillHeight + windowHeight / 2, -windowWidth / 2 - frameThickness / 2);
  leftFrame.castShadow = true;
  leftFrame.receiveShadow = true;
  group.add(leftFrame);

  // Right frame piece
  const rightFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  rightFrame.position.set(0, sillHeight + windowHeight / 2, windowWidth / 2 + frameThickness / 2);
  rightFrame.castShadow = true;
  rightFrame.receiveShadow = true;
  group.add(rightFrame);

  // === CENTER CROSS MUNTIN (classic 4-pane look) ===
  // Horizontal muntin
  const hMuntinGeom = new THREE.BoxGeometry(frameDepth * 0.5, frameThickness * 0.6, windowWidth - frameThickness * 2);
  const hMuntin = new THREE.Mesh(hMuntinGeom, frameMat);
  hMuntin.position.set(0, sillHeight + windowHeight / 2, 0);
  group.add(hMuntin);

  // Vertical muntin
  const vMuntinGeom = new THREE.BoxGeometry(frameDepth * 0.5, windowHeight - frameThickness * 2, frameThickness * 0.6);
  const vMuntin = new THREE.Mesh(vMuntinGeom, frameMat);
  vMuntin.position.set(0, sillHeight + windowHeight / 2, 0);
  group.add(vMuntin);

  // === GLASS PANE ===
  const glassWidth = windowWidth - frameThickness * 2;
  const glassHeight = windowHeight - frameThickness * 2;
  const glassGeom = new THREE.PlaneGeometry(glassWidth, glassHeight);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.rotation.y = Math.PI / 2;  // Face along X axis
  glass.position.set(0, sillHeight + windowHeight / 2, 0);
  group.add(glass);

  return group;
}

/**
 * Create a generic box fallback
 */
export function createGenericBoxGeometry(
  widthFt: number,
  lengthFt: number,
  heightFt: number,
  properties?: Record<string, unknown>
): THREE.Group {
  const color = typeof properties?.color === "number" ? properties.color : FIXTURE_MATERIALS.WOOD_CABINET;
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(heightFt);

  const mat = createMaterial(color);
  const geom = new THREE.BoxGeometry(w, h, l);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(0, h / 2, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

