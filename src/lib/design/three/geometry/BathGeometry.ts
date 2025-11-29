/**
 * Bath Fixtures - Toilet, Shower, Vanity, Bathtub
 */

import * as THREE from "three";
import { ftToUnits } from "../constants";
import { FIXTURE_MATERIALS, createMaterial } from "./materials";

/**
 * Create a toilet - cylinder bowl + box tank
 */
export function createToiletGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const totalHeight = ftToUnits(2.5); // Standard toilet height ~2.5ft

  const porcelainMat = createMaterial(FIXTURE_MATERIALS.WHITE_PORCELAIN, {
    roughness: 0.3,
    metalness: 0.1,
  });

  // Tank (back box)
  const tankHeight = totalHeight * 0.5;
  const tankDepth = l * 0.3;
  const tankGeom = new THREE.BoxGeometry(w * 0.7, tankHeight, tankDepth);
  const tank = new THREE.Mesh(tankGeom, porcelainMat);
  tank.position.set(0, totalHeight - tankHeight / 2, -l / 2 + tankDepth / 2);
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  // Bowl (elongated cylinder/ellipse shape)
  const bowlHeight = totalHeight * 0.5;
  const bowlGeom = new THREE.CylinderGeometry(
    w * 0.35, // top radius
    w * 0.3,  // bottom radius
    bowlHeight,
    16
  );
  const bowl = new THREE.Mesh(bowlGeom, porcelainMat);
  bowl.position.set(0, bowlHeight / 2, l * 0.1);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  group.add(bowl);

  // Seat rim (torus on top of bowl)
  const seatGeom = new THREE.TorusGeometry(w * 0.28, 0.03, 8, 24);
  const seat = new THREE.Mesh(seatGeom, porcelainMat);
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, bowlHeight, l * 0.1);
  seat.castShadow = true;
  group.add(seat);

  return group;
}

/**
 * Create a shower - floor tray with walls
 */
export function createShowerGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const wallHeight = ftToUnits(7); // Shower walls 7ft
  const baseHeight = ftToUnits(0.25);

  const baseMat = createMaterial(FIXTURE_MATERIALS.SHOWER_BASE, { roughness: 0.5 });
  const glassMat = createMaterial(FIXTURE_MATERIALS.GLASS, {
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.3,
  });

  // Shower base/tray
  const baseGeom = new THREE.BoxGeometry(w, baseHeight, l);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.set(0, baseHeight / 2, 0);
  base.receiveShadow = true;
  group.add(base);

  // Drain (small cylinder in center)
  const drainGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
  const drainMat = createMaterial(0x404040, { metalness: 0.8, roughness: 0.2 });
  const drain = new THREE.Mesh(drainGeom, drainMat);
  drain.position.set(0, baseHeight + 0.01, 0);
  group.add(drain);

  // Glass walls (L-shaped for corner shower)
  const wallThickness = 0.02;

  // Back wall
  const backWallGeom = new THREE.BoxGeometry(w, wallHeight, wallThickness);
  const backWall = new THREE.Mesh(backWallGeom, glassMat);
  backWall.position.set(0, wallHeight / 2 + baseHeight, -l / 2);
  group.add(backWall);

  // Side wall
  const sideWallGeom = new THREE.BoxGeometry(wallThickness, wallHeight, l);
  const sideWall = new THREE.Mesh(sideWallGeom, glassMat);
  sideWall.position.set(-w / 2, wallHeight / 2 + baseHeight, 0);
  group.add(sideWall);

  // Shower head (small cylinder at top)
  const headGeom = new THREE.CylinderGeometry(0.08, 0.06, 0.05, 12);
  const headMat = createMaterial(0xC0C0C0, { metalness: 0.9, roughness: 0.1 });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.set(0, wallHeight * 0.9, -l / 2 + 0.1);
  group.add(head);

  return group;
}

/**
 * Create a vanity - cabinet + countertop + sink basin
 */
export function createVanityGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const cabinetHeight = ftToUnits(2.5); // Standard vanity height
  const counterThickness = ftToUnits(0.15);

  const cabinetMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);
  const counterMat = createMaterial(FIXTURE_MATERIALS.COUNTERTOP, { roughness: 0.4 });
  const sinkMat = createMaterial(FIXTURE_MATERIALS.WHITE_PORCELAIN, { roughness: 0.3 });

  // Cabinet base
  const cabinetGeom = new THREE.BoxGeometry(w, cabinetHeight - counterThickness, l * 0.9);
  const cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
  cabinet.position.set(0, (cabinetHeight - counterThickness) / 2, -l * 0.05);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  // Countertop
  const counterGeom = new THREE.BoxGeometry(w * 1.02, counterThickness, l);
  const counter = new THREE.Mesh(counterGeom, counterMat);
  counter.position.set(0, cabinetHeight - counterThickness / 2, 0);
  counter.castShadow = true;
  counter.receiveShadow = true;
  group.add(counter);

  // Sink basin (ellipsoid cutout represented as oval)
  const sinkGeom = new THREE.CylinderGeometry(
    Math.min(w, l) * 0.3, // top
    Math.min(w, l) * 0.25, // bottom
    ftToUnits(0.4),
    24
  );
  const sink = new THREE.Mesh(sinkGeom, sinkMat);
  sink.position.set(0, cabinetHeight - ftToUnits(0.2), l * 0.1);
  sink.castShadow = true;
  group.add(sink);

  // Faucet
  const faucetMat = createMaterial(0xC0C0C0, { metalness: 0.9, roughness: 0.1 });
  const faucetBaseGeom = new THREE.CylinderGeometry(0.02, 0.02, ftToUnits(0.5), 8);
  const faucetBase = new THREE.Mesh(faucetBaseGeom, faucetMat);
  faucetBase.position.set(0, cabinetHeight + ftToUnits(0.25), -l * 0.25);
  group.add(faucetBase);

  const spoutGeom = new THREE.CylinderGeometry(0.015, 0.015, ftToUnits(0.3), 8);
  const spout = new THREE.Mesh(spoutGeom, faucetMat);
  spout.rotation.x = Math.PI / 2;
  spout.position.set(0, cabinetHeight + ftToUnits(0.45), -l * 0.1);
  group.add(spout);

  // Mirror above vanity
  const mirrorWidth = w * 0.9;
  const mirrorHeight = ftToUnits(2);
  const mirrorDepth = ftToUnits(0.1);
  const mirrorY = ftToUnits(4.5); // Center of mirror at ~4.5ft

  const mirrorMat = createMaterial(0xE8F0F8, { metalness: 0.9, roughness: 0.1 });
  const mirrorGeom = new THREE.BoxGeometry(mirrorWidth, mirrorHeight, mirrorDepth);
  const mirror = new THREE.Mesh(mirrorGeom, mirrorMat);
  mirror.position.set(0, mirrorY, -l / 2 + mirrorDepth / 2);
  mirror.castShadow = false;
  mirror.receiveShadow = true;
  group.add(mirror);

  // Mirror frame (thin dark border)
  const frameMat = createMaterial(0x3A3A3A, { metalness: 0.3, roughness: 0.7 });
  const frameThickness = ftToUnits(0.05);
  // Top frame
  const topFrameGeom = new THREE.BoxGeometry(mirrorWidth + frameThickness * 2, frameThickness, mirrorDepth + 0.01);
  const topFrame = new THREE.Mesh(topFrameGeom, frameMat);
  topFrame.position.set(0, mirrorY + mirrorHeight / 2 + frameThickness / 2, -l / 2 + mirrorDepth / 2);
  group.add(topFrame);
  // Bottom frame
  const bottomFrame = new THREE.Mesh(topFrameGeom, frameMat);
  bottomFrame.position.set(0, mirrorY - mirrorHeight / 2 - frameThickness / 2, -l / 2 + mirrorDepth / 2);
  group.add(bottomFrame);
  // Side frames
  const sideFrameGeom = new THREE.BoxGeometry(frameThickness, mirrorHeight, mirrorDepth + 0.01);
  const leftFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  leftFrame.position.set(-mirrorWidth / 2 - frameThickness / 2, mirrorY, -l / 2 + mirrorDepth / 2);
  group.add(leftFrame);
  const rightFrame = new THREE.Mesh(sideFrameGeom, frameMat);
  rightFrame.position.set(mirrorWidth / 2 + frameThickness / 2, mirrorY, -l / 2 + mirrorDepth / 2);
  group.add(rightFrame);

  return group;
}

/**
 * Create a bathtub - alcove style with smooth curves and realistic details
 * Standard 60" (5') bathtub with sloped backrest at head end, faucet at foot end
 */
export function createBathtubGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);   // Width (typically 2.5ft)
  const l = ftToUnits(lengthFt);  // Length (typically 5ft)
  const tubHeight = ftToUnits(1.4); // Standard alcove tub height ~17"
  const rimThickness = ftToUnits(0.15); // Rim thickness
  const wallThick = ftToUnits(0.12); // Tub wall thickness
  const cornerRadius = ftToUnits(0.3); // Rounded corner radius

  // Materials
  const tubMat = createMaterial(FIXTURE_MATERIALS.WHITE_PORCELAIN, {
    roughness: 0.15,
    metalness: 0.05,
  });
  const innerMat = createMaterial(0xF8F8F8, { // Slightly off-white for inner basin
    roughness: 0.2,
    metalness: 0.02,
  });
  const chromeMat = createMaterial(0xD4D4D4, { metalness: 0.95, roughness: 0.05 });
  const drainMat = createMaterial(0x888888, { metalness: 0.9, roughness: 0.15 });

  // === MAIN TUB BODY ===
  // Create outer tub shell using extruded rounded rectangle shape
  const outerShape = createRoundedRectShape(w, l, cornerRadius);
  const innerShape = createRoundedRectShape(
    w - wallThick * 2,
    l - wallThick * 2,
    cornerRadius * 0.6
  );

  // Outer tub walls (extruded shape)
  const outerExtrudeSettings = { depth: tubHeight, bevelEnabled: false };
  const outerGeom = new THREE.ExtrudeGeometry(outerShape, outerExtrudeSettings);
  outerGeom.rotateX(-Math.PI / 2); // Rotate to stand upright
  const outerTub = new THREE.Mesh(outerGeom, tubMat);
  outerTub.position.set(0, 0, 0);
  outerTub.castShadow = true;
  outerTub.receiveShadow = true;
  group.add(outerTub);

  // Inner basin (slightly inset and shorter)
  const basinDepth = tubHeight - rimThickness;
  const innerExtrudeSettings = { depth: basinDepth, bevelEnabled: false };
  const innerGeom = new THREE.ExtrudeGeometry(innerShape, innerExtrudeSettings);
  innerGeom.rotateX(-Math.PI / 2);
  const innerBasin = new THREE.Mesh(innerGeom, innerMat);
  innerBasin.position.set(0, rimThickness, 0);
  innerBasin.receiveShadow = true;
  group.add(innerBasin);

  // Basin floor (flat bottom)
  const floorShape = createRoundedRectShape(
    w - wallThick * 2.5,
    l - wallThick * 2.5,
    cornerRadius * 0.4
  );
  const floorGeom = new THREE.ShapeGeometry(floorShape);
  floorGeom.rotateX(-Math.PI / 2);
  const basinFloor = new THREE.Mesh(floorGeom, innerMat);
  basinFloor.position.set(0, rimThickness + 0.01, 0);
  basinFloor.receiveShadow = true;
  group.add(basinFloor);

  // === TOP RIM ===
  // Smooth rounded rim around the top edge
  const rimGeom = new THREE.TorusGeometry(
    (w + l) / 4 * 0.15, // Major radius (approximation for rounded rect)
    rimThickness * 0.4,
    8,
    32
  );
  // Instead of torus, create rim as a flat ring using the shape difference
  const rimShape = createRoundedRectShape(w + rimThickness * 0.5, l + rimThickness * 0.5, cornerRadius + rimThickness * 0.25);
  const rimHole = createRoundedRectShape(w - wallThick * 1.5, l - wallThick * 1.5, cornerRadius * 0.5);
  rimShape.holes.push(rimHole);
  
  const rimExtrudeSettings = { depth: rimThickness * 0.6, bevelEnabled: true, bevelThickness: rimThickness * 0.2, bevelSize: rimThickness * 0.15, bevelSegments: 3 };
  const rimExtrudeGeom = new THREE.ExtrudeGeometry(rimShape, rimExtrudeSettings);
  rimExtrudeGeom.rotateX(-Math.PI / 2);
  const rim = new THREE.Mesh(rimExtrudeGeom, tubMat);
  rim.position.set(0, tubHeight - rimThickness * 0.3, 0);
  rim.castShadow = true;
  group.add(rim);

  // === SLOPED BACKREST ===
  // At the head end (negative Z), create angled surface for reclining
  const backrestWidth = w - wallThick * 3;
  const backrestLength = l * 0.35;
  const backrestGeom = new THREE.PlaneGeometry(backrestWidth, backrestLength);
  const backrest = new THREE.Mesh(backrestGeom, innerMat);
  backrest.rotation.x = -Math.PI / 2 + Math.PI / 5; // ~36 degree slope
  backrest.position.set(0, tubHeight * 0.45, -l / 2 + backrestLength * 0.45 + wallThick);
  backrest.receiveShadow = true;
  group.add(backrest);

  // === DRAIN ===
  // Located at foot end (positive Z), slightly off-center toward faucet
  const drainY = rimThickness + 0.02;
  const drainZ = l * 0.3;

  // Drain flange (chrome ring)
  const flangeGeom = new THREE.TorusGeometry(ftToUnits(0.12), ftToUnits(0.02), 8, 24);
  const flange = new THREE.Mesh(flangeGeom, chromeMat);
  flange.rotation.x = Math.PI / 2;
  flange.position.set(0, drainY + 0.01, drainZ);
  group.add(flange);

  // Drain hole (dark circle)
  const drainHoleGeom = new THREE.CircleGeometry(ftToUnits(0.1), 24);
  const drainHole = new THREE.Mesh(drainHoleGeom, drainMat);
  drainHole.rotation.x = -Math.PI / 2;
  drainHole.position.set(0, drainY, drainZ);
  group.add(drainHole);

  // Drain crossbars
  const crossbarGeom = new THREE.BoxGeometry(ftToUnits(0.18), ftToUnits(0.008), ftToUnits(0.015));
  for (let i = 0; i < 4; i++) {
    const crossbar = new THREE.Mesh(crossbarGeom, chromeMat);
    crossbar.rotation.y = (Math.PI / 4) * i;
    crossbar.position.set(0, drainY + 0.015, drainZ);
    group.add(crossbar);
  }

  // === OVERFLOW DRAIN ===
  // Small circular plate on the wall near the rim at foot end
  const overflowGeom = new THREE.CylinderGeometry(ftToUnits(0.08), ftToUnits(0.08), ftToUnits(0.02), 16);
  const overflow = new THREE.Mesh(overflowGeom, chromeMat);
  overflow.rotation.x = Math.PI / 2;
  overflow.position.set(0, tubHeight * 0.75, l / 2 - wallThick * 1.2);
  group.add(overflow);

  // === FAUCET ASSEMBLY ===
  // Wall-mount style at the foot end (positive Z)
  const faucetZ = l / 2 - wallThick * 0.5;
  const faucetY = tubHeight + ftToUnits(0.3);

  // Faucet escutcheon plate (decorative wall plate)
  const escutcheonGeom = new THREE.BoxGeometry(ftToUnits(0.8), ftToUnits(0.25), ftToUnits(0.03));
  const escutcheon = new THREE.Mesh(escutcheonGeom, chromeMat);
  escutcheon.position.set(0, faucetY, faucetZ);
  group.add(escutcheon);

  // Spout - curved gooseneck style
  const spoutBaseGeom = new THREE.CylinderGeometry(ftToUnits(0.035), ftToUnits(0.04), ftToUnits(0.08), 12);
  const spoutBase = new THREE.Mesh(spoutBaseGeom, chromeMat);
  spoutBase.position.set(0, faucetY, faucetZ - ftToUnits(0.04));
  group.add(spoutBase);

  // Spout neck (angled down toward tub)
  const spoutNeckGeom = new THREE.CylinderGeometry(ftToUnits(0.025), ftToUnits(0.03), ftToUnits(0.3), 10);
  const spoutNeck = new THREE.Mesh(spoutNeckGeom, chromeMat);
  spoutNeck.rotation.x = Math.PI / 3; // Angle down
  spoutNeck.position.set(0, faucetY - ftToUnits(0.08), faucetZ - ftToUnits(0.18));
  group.add(spoutNeck);

  // Spout mouth
  const spoutMouthGeom = new THREE.SphereGeometry(ftToUnits(0.035), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const spoutMouth = new THREE.Mesh(spoutMouthGeom, chromeMat);
  spoutMouth.rotation.x = Math.PI;
  spoutMouth.position.set(0, faucetY - ftToUnits(0.2), faucetZ - ftToUnits(0.32));
  group.add(spoutMouth);

  // Hot handle (left)
  createFaucetHandle(group, chromeMat, -ftToUnits(0.28), faucetY, faucetZ);
  
  // Cold handle (right)
  createFaucetHandle(group, chromeMat, ftToUnits(0.28), faucetY, faucetZ);

  return group;
}

/**
 * Helper to create a rounded rectangle shape for extrusion
 */
function createRoundedRectShape(width: number, length: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hl = length / 2;
  const r = Math.min(radius, hw, hl);

  shape.moveTo(-hw + r, -hl);
  shape.lineTo(hw - r, -hl);
  shape.quadraticCurveTo(hw, -hl, hw, -hl + r);
  shape.lineTo(hw, hl - r);
  shape.quadraticCurveTo(hw, hl, hw - r, hl);
  shape.lineTo(-hw + r, hl);
  shape.quadraticCurveTo(-hw, hl, -hw, hl - r);
  shape.lineTo(-hw, -hl + r);
  shape.quadraticCurveTo(-hw, -hl, -hw + r, -hl);

  return shape;
}

/**
 * Helper to create a faucet handle (cross-style)
 */
function createFaucetHandle(
  group: THREE.Group,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
): void {
  // Handle base/stem
  const stemGeom = new THREE.CylinderGeometry(ftToUnits(0.025), ftToUnits(0.03), ftToUnits(0.06), 10);
  const stem = new THREE.Mesh(stemGeom, material);
  stem.position.set(x, y, z - ftToUnits(0.03));
  group.add(stem);

  // Cross handle
  const crossArmGeom = new THREE.CylinderGeometry(ftToUnits(0.012), ftToUnits(0.012), ftToUnits(0.12), 8);
  
  const arm1 = new THREE.Mesh(crossArmGeom, material);
  arm1.rotation.z = Math.PI / 2;
  arm1.position.set(x, y + ftToUnits(0.05), z - ftToUnits(0.03));
  group.add(arm1);

  const arm2 = new THREE.Mesh(crossArmGeom, material);
  arm2.rotation.x = Math.PI / 2;
  arm2.position.set(x, y + ftToUnits(0.05), z - ftToUnits(0.03));
  group.add(arm2);

  // Center cap
  const capGeom = new THREE.SphereGeometry(ftToUnits(0.02), 8, 8);
  const cap = new THREE.Mesh(capGeom, material);
  cap.position.set(x, y + ftToUnits(0.05), z - ftToUnits(0.03));
  group.add(cap);
}

