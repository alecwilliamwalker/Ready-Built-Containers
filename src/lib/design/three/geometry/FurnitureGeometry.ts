/**
 * Furniture Fixtures - Island, Table, Bed, Bunk Bed, Sofa, Desk, Bench, Coat Rack
 */

import * as THREE from "three";
import { ftToUnits } from "../constants";
import { FIXTURE_MATERIALS, createMaterial } from "./materials";

/**
 * Create a kitchen island
 */
export function createIslandGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3); // Counter height
  const counterThickness = ftToUnits(0.15);

  const cabinetMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);
  const counterMat = createMaterial(FIXTURE_MATERIALS.COUNTERTOP, { roughness: 0.3 });

  // Island base
  const baseGeom = new THREE.BoxGeometry(w, h - counterThickness, l);
  const base = new THREE.Mesh(baseGeom, cabinetMat);
  base.position.set(0, (h - counterThickness) / 2, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Countertop (slightly larger overhang)
  const counterGeom = new THREE.BoxGeometry(w * 1.1, counterThickness, l * 1.1);
  const counter = new THREE.Mesh(counterGeom, counterMat);
  counter.position.set(0, h - counterThickness / 2, 0);
  counter.castShadow = true;
  group.add(counter);

  return group;
}

/**
 * Create a dining table - tabletop on legs
 */
export function createTableGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(2.5); // Table height
  const topThickness = ftToUnits(0.1);
  const legRadius = ftToUnits(0.1);

  const woodMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);

  // Tabletop
  const topGeom = new THREE.BoxGeometry(w, topThickness, l);
  const top = new THREE.Mesh(topGeom, woodMat);
  top.position.set(0, h - topThickness / 2, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // 4 Legs
  const legHeight = h - topThickness;
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 8);
  const legPositions = [
    { x: -w * 0.4, z: -l * 0.4 },
    { x: w * 0.4, z: -l * 0.4 },
    { x: -w * 0.4, z: l * 0.4 },
    { x: w * 0.4, z: l * 0.4 },
  ];

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeom, woodMat);
    leg.position.set(pos.x, legHeight / 2, pos.z);
    leg.castShadow = true;
    group.add(leg);
  });

  return group;
}

/**
 * Create a bed - frame + mattress + headboard + pillows
 */
export function createBedGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const frameHeight = ftToUnits(0.8);
  const mattressHeight = ftToUnits(0.6);
  const headboardHeight = ftToUnits(2.5);

  const frameMat = createMaterial(FIXTURE_MATERIALS.BED_FRAME, { metalness: 0.3 });
  const mattressMat = createMaterial(FIXTURE_MATERIALS.MATTRESS, { roughness: 0.9 });
  const pillowMat = createMaterial(FIXTURE_MATERIALS.PILLOW, { roughness: 0.95 });

  // Bed frame
  const frameGeom = new THREE.BoxGeometry(w, frameHeight, l);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.set(0, frameHeight / 2, 0);
  frame.castShadow = true;
  frame.receiveShadow = true;
  group.add(frame);

  // Mattress
  const mattressGeom = new THREE.BoxGeometry(w * 0.95, mattressHeight, l * 0.95);
  const mattress = new THREE.Mesh(mattressGeom, mattressMat);
  mattress.position.set(0, frameHeight + mattressHeight / 2, 0);
  mattress.castShadow = true;
  group.add(mattress);

  // Headboard
  const headboardGeom = new THREE.BoxGeometry(w, headboardHeight, ftToUnits(0.15));
  const headboard = new THREE.Mesh(headboardGeom, frameMat);
  headboard.position.set(0, headboardHeight / 2, -l / 2 + ftToUnits(0.075));
  headboard.castShadow = true;
  group.add(headboard);

  // Pillows (2 pillows)
  const pillowW = w * 0.35;
  const pillowH = ftToUnits(0.2);
  const pillowL = ftToUnits(0.8);
  const pillowGeom = new THREE.BoxGeometry(pillowW, pillowH, pillowL);

  const pillow1 = new THREE.Mesh(pillowGeom, pillowMat);
  pillow1.position.set(-w * 0.22, frameHeight + mattressHeight + pillowH / 2, -l * 0.35);
  pillow1.castShadow = true;
  group.add(pillow1);

  const pillow2 = new THREE.Mesh(pillowGeom, pillowMat);
  pillow2.position.set(w * 0.22, frameHeight + mattressHeight + pillowH / 2, -l * 0.35);
  pillow2.castShadow = true;
  group.add(pillow2);

  return group;
}

/**
 * Create a bunk bed - two stacked bed frames with ladder, posts, and safety rails
 * Features: sturdy corner posts, two mattresses with bedding, integrated ladder, upper safety rails
 */
export function createBunkBedGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);   // Width of the bed (3.5ft = twin)
  const l = ftToUnits(lengthFt);  // Length of the bed (6.5ft)
  
  // Dimensions
  const postRadius = ftToUnits(0.12);        // Sturdy round posts
  const postHeight = ftToUnits(6);           // Total height ~6ft
  const lowerFrameHeight = ftToUnits(1.2);   // Lower bed frame height
  const upperFrameHeight = ftToUnits(4.5);   // Upper bed frame height from floor
  const frameThickness = ftToUnits(0.3);     // Thickness of frame rails
  const mattressHeight = ftToUnits(0.5);     // Mattress thickness
  const railHeight = ftToUnits(0.8);         // Safety rail height above upper mattress
  const ladderWidth = ftToUnits(0.5);        // Ladder width
  const ladderRungSpacing = ftToUnits(0.85); // Spacing between ladder rungs

  // Materials
  const metalFrameMat = createMaterial(0x2C2C2C, { 
    metalness: 0.7, 
    roughness: 0.3 
  });
  const metalPostMat = createMaterial(0x1A1A1A, { 
    metalness: 0.8, 
    roughness: 0.25 
  });
  const mattressMat = createMaterial(FIXTURE_MATERIALS.MATTRESS, { roughness: 0.9 });
  const pillowMat = createMaterial(FIXTURE_MATERIALS.PILLOW, { roughness: 0.95 });
  const blanketMat = createMaterial(0x4A5568, { roughness: 0.85 }); // Dark blue-gray blanket
  const blanketMat2 = createMaterial(0x5D4E37, { roughness: 0.85 }); // Brown blanket for variety

  // === CORNER POSTS (4 sturdy metal posts) ===
  const postGeom = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
  const postPositions = [
    { x: -w / 2 + postRadius * 1.5, z: -l / 2 + postRadius * 1.5 }, // Back left
    { x: w / 2 - postRadius * 1.5, z: -l / 2 + postRadius * 1.5 },  // Back right
    { x: -w / 2 + postRadius * 1.5, z: l / 2 - postRadius * 1.5 },  // Front left
    { x: w / 2 - postRadius * 1.5, z: l / 2 - postRadius * 1.5 },   // Front right
  ];
  
  postPositions.forEach(pos => {
    const post = new THREE.Mesh(postGeom, metalPostMat);
    post.position.set(pos.x, postHeight / 2, pos.z);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
    
    // Add decorative cap on top of post
    const capGeom = new THREE.SphereGeometry(postRadius * 1.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeom, metalPostMat);
    cap.position.set(pos.x, postHeight, pos.z);
    cap.castShadow = true;
    group.add(cap);
  });

  // === LOWER BED FRAME ===
  // Side rails (long sides)
  const sideRailGeom = new THREE.BoxGeometry(frameThickness * 0.6, frameThickness, l - postRadius * 4);
  const lowerLeftRail = new THREE.Mesh(sideRailGeom, metalFrameMat);
  lowerLeftRail.position.set(-w / 2 + postRadius * 1.5, lowerFrameHeight, 0);
  lowerLeftRail.castShadow = true;
  group.add(lowerLeftRail);
  
  const lowerRightRail = new THREE.Mesh(sideRailGeom, metalFrameMat);
  lowerRightRail.position.set(w / 2 - postRadius * 1.5, lowerFrameHeight, 0);
  lowerRightRail.castShadow = true;
  group.add(lowerRightRail);
  
  // End rails (short sides)
  const endRailGeom = new THREE.BoxGeometry(w - postRadius * 4, frameThickness, frameThickness * 0.6);
  const lowerBackRail = new THREE.Mesh(endRailGeom, metalFrameMat);
  lowerBackRail.position.set(0, lowerFrameHeight, -l / 2 + postRadius * 1.5);
  lowerBackRail.castShadow = true;
  group.add(lowerBackRail);
  
  const lowerFrontRail = new THREE.Mesh(endRailGeom, metalFrameMat);
  lowerFrontRail.position.set(0, lowerFrameHeight, l / 2 - postRadius * 1.5);
  lowerFrontRail.castShadow = true;
  group.add(lowerFrontRail);

  // Lower bed slats (support)
  const slatGeom = new THREE.BoxGeometry(w - postRadius * 6, ftToUnits(0.08), ftToUnits(0.25));
  const slatCount = 6;
  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(slatGeom, metalFrameMat);
    const zPos = -l * 0.35 + (i * (l * 0.7) / (slatCount - 1));
    slat.position.set(0, lowerFrameHeight - frameThickness / 2 + ftToUnits(0.04), zPos);
    group.add(slat);
  }

  // === UPPER BED FRAME ===
  const upperLeftRail = new THREE.Mesh(sideRailGeom, metalFrameMat);
  upperLeftRail.position.set(-w / 2 + postRadius * 1.5, upperFrameHeight, 0);
  upperLeftRail.castShadow = true;
  group.add(upperLeftRail);
  
  const upperRightRail = new THREE.Mesh(sideRailGeom, metalFrameMat);
  upperRightRail.position.set(w / 2 - postRadius * 1.5, upperFrameHeight, 0);
  upperRightRail.castShadow = true;
  group.add(upperRightRail);
  
  const upperBackRail = new THREE.Mesh(endRailGeom, metalFrameMat);
  upperBackRail.position.set(0, upperFrameHeight, -l / 2 + postRadius * 1.5);
  upperBackRail.castShadow = true;
  group.add(upperBackRail);
  
  const upperFrontRail = new THREE.Mesh(endRailGeom, metalFrameMat);
  upperFrontRail.position.set(0, upperFrameHeight, l / 2 - postRadius * 1.5);
  upperFrontRail.castShadow = true;
  group.add(upperFrontRail);

  // Upper bed slats
  for (let i = 0; i < slatCount; i++) {
    const slat = new THREE.Mesh(slatGeom, metalFrameMat);
    const zPos = -l * 0.35 + (i * (l * 0.7) / (slatCount - 1));
    slat.position.set(0, upperFrameHeight - frameThickness / 2 + ftToUnits(0.04), zPos);
    group.add(slat);
  }

  // === SAFETY RAILS FOR UPPER BUNK ===
  const safetyRailGeom = new THREE.CylinderGeometry(postRadius * 0.5, postRadius * 0.5, l * 0.75, 12);
  
  // Left side safety rail (full length)
  const leftSafetyRail = new THREE.Mesh(safetyRailGeom, metalFrameMat);
  leftSafetyRail.rotation.x = Math.PI / 2;
  leftSafetyRail.position.set(-w / 2 + postRadius * 1.5, upperFrameHeight + mattressHeight + railHeight * 0.6, 0);
  leftSafetyRail.castShadow = true;
  group.add(leftSafetyRail);
  
  // Right side safety rail (with gap for ladder access)
  const rightBackSafetyGeom = new THREE.CylinderGeometry(postRadius * 0.5, postRadius * 0.5, l * 0.4, 12);
  const rightBackSafety = new THREE.Mesh(rightBackSafetyGeom, metalFrameMat);
  rightBackSafety.rotation.x = Math.PI / 2;
  rightBackSafety.position.set(w / 2 - postRadius * 1.5, upperFrameHeight + mattressHeight + railHeight * 0.6, -l * 0.25);
  rightBackSafety.castShadow = true;
  group.add(rightBackSafety);

  // Front safety rail
  const frontSafetyGeom = new THREE.CylinderGeometry(postRadius * 0.5, postRadius * 0.5, w - postRadius * 5, 12);
  const frontSafetyRail = new THREE.Mesh(frontSafetyGeom, metalFrameMat);
  frontSafetyRail.rotation.z = Math.PI / 2;
  frontSafetyRail.position.set(0, upperFrameHeight + mattressHeight + railHeight * 0.6, l / 2 - postRadius * 1.5);
  frontSafetyRail.castShadow = true;
  group.add(frontSafetyRail);

  // Back safety rail (shorter, integrated with headboard)
  const backSafetyRail = new THREE.Mesh(frontSafetyGeom, metalFrameMat);
  backSafetyRail.rotation.z = Math.PI / 2;
  backSafetyRail.position.set(0, upperFrameHeight + mattressHeight + railHeight * 0.6, -l / 2 + postRadius * 1.5);
  backSafetyRail.castShadow = true;
  group.add(backSafetyRail);

  // Safety rail vertical supports
  const supportGeom = new THREE.CylinderGeometry(postRadius * 0.4, postRadius * 0.4, railHeight, 8);
  const supportPositions = [
    { x: -w / 2 + postRadius * 1.5, z: l * 0.2 },
    { x: -w / 2 + postRadius * 1.5, z: -l * 0.2 },
  ];
  supportPositions.forEach(pos => {
    const support = new THREE.Mesh(supportGeom, metalFrameMat);
    support.position.set(pos.x, upperFrameHeight + mattressHeight + railHeight / 2, pos.z);
    support.castShadow = true;
    group.add(support);
  });

  // === LADDER (on right side, near front) ===
  const ladderHeight = upperFrameHeight - lowerFrameHeight + mattressHeight;
  const ladderAngle = Math.PI / 12; // Slight angle outward
  
  const ladderGroup = new THREE.Group();
  
  // Ladder side rails
  const ladderRailGeom = new THREE.BoxGeometry(ftToUnits(0.08), ladderHeight, ftToUnits(0.15));
  const ladderRailMat = createMaterial(0x3A3A3A, { metalness: 0.7, roughness: 0.3 });
  
  const leftLadderRail = new THREE.Mesh(ladderRailGeom, ladderRailMat);
  leftLadderRail.position.set(-ladderWidth / 2, ladderHeight / 2, 0);
  leftLadderRail.castShadow = true;
  ladderGroup.add(leftLadderRail);
  
  const rightLadderRail = new THREE.Mesh(ladderRailGeom, ladderRailMat);
  rightLadderRail.position.set(ladderWidth / 2, ladderHeight / 2, 0);
  rightLadderRail.castShadow = true;
  ladderGroup.add(rightLadderRail);
  
  // Ladder rungs
  const rungGeom = new THREE.CylinderGeometry(ftToUnits(0.04), ftToUnits(0.04), ladderWidth, 12);
  const rungMat = createMaterial(0x4A4A4A, { metalness: 0.6, roughness: 0.4 });
  const rungCount = Math.floor(ladderHeight / ladderRungSpacing);
  
  for (let i = 1; i <= rungCount; i++) {
    const rung = new THREE.Mesh(rungGeom, rungMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, i * ladderRungSpacing, 0);
    rung.castShadow = true;
    ladderGroup.add(rung);
  }
  
  // Position ladder at front-right, inside footprint bounds
  ladderGroup.position.set(w / 2 - ladderWidth / 2, lowerFrameHeight, l * 0.3);
  ladderGroup.rotation.x = -ladderAngle;
  group.add(ladderGroup);

  // === LOWER MATTRESS ===
  const mattressW = w - postRadius * 5;
  const mattressL = l - postRadius * 5;
  const mattressGeom = new THREE.BoxGeometry(mattressW, mattressHeight, mattressL);
  
  const lowerMattress = new THREE.Mesh(mattressGeom, mattressMat);
  lowerMattress.position.set(0, lowerFrameHeight + mattressHeight / 2, 0);
  lowerMattress.castShadow = true;
  lowerMattress.receiveShadow = true;
  group.add(lowerMattress);

  // === UPPER MATTRESS ===
  const upperMattress = new THREE.Mesh(mattressGeom, mattressMat);
  upperMattress.position.set(0, upperFrameHeight + mattressHeight / 2, 0);
  upperMattress.castShadow = true;
  upperMattress.receiveShadow = true;
  group.add(upperMattress);

  // === PILLOWS (one per bed) ===
  const pillowW = mattressW * 0.7;
  const pillowH = ftToUnits(0.18);
  const pillowL = ftToUnits(0.7);
  const pillowGeom = new THREE.BoxGeometry(pillowW, pillowH, pillowL);
  
  // Lower pillow
  const lowerPillow = new THREE.Mesh(pillowGeom, pillowMat);
  lowerPillow.position.set(0, lowerFrameHeight + mattressHeight + pillowH / 2, -mattressL * 0.35);
  lowerPillow.castShadow = true;
  group.add(lowerPillow);
  
  // Upper pillow
  const upperPillow = new THREE.Mesh(pillowGeom, pillowMat);
  upperPillow.position.set(0, upperFrameHeight + mattressHeight + pillowH / 2, -mattressL * 0.35);
  upperPillow.castShadow = true;
  group.add(upperPillow);

  // === BLANKETS/BEDDING (folded at foot of each bed) ===
  const blanketW = mattressW * 0.85;
  const blanketH = ftToUnits(0.12);
  const blanketL = mattressL * 0.55;
  const blanketGeom = new THREE.BoxGeometry(blanketW, blanketH, blanketL);
  
  // Lower blanket
  const lowerBlanket = new THREE.Mesh(blanketGeom, blanketMat);
  lowerBlanket.position.set(0, lowerFrameHeight + mattressHeight + blanketH / 2, mattressL * 0.15);
  lowerBlanket.castShadow = true;
  group.add(lowerBlanket);
  
  // Upper blanket (different color)
  const upperBlanket = new THREE.Mesh(blanketGeom, blanketMat2);
  upperBlanket.position.set(0, upperFrameHeight + mattressHeight + blanketH / 2, mattressL * 0.15);
  upperBlanket.castShadow = true;
  group.add(upperBlanket);

  // === HEADBOARD PANEL (optional decorative back panel) ===
  const headboardGeom = new THREE.BoxGeometry(w - postRadius * 3, ftToUnits(2), ftToUnits(0.08));
  const headboardMat = createMaterial(0x3A3A3A, { metalness: 0.5, roughness: 0.4 });
  const headboard = new THREE.Mesh(headboardGeom, headboardMat);
  headboard.position.set(0, upperFrameHeight - ftToUnits(1), -l / 2 + postRadius * 2);
  headboard.castShadow = true;
  group.add(headboard);

  return group;
}

/**
 * Create a sofa - seat + backrest + armrests
 */
export function createSofaGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const seatHeight = ftToUnits(1.5);
  const backHeight = ftToUnits(1.5);
  const armWidth = ftToUnits(0.5);

  const cushionMat = createMaterial(FIXTURE_MATERIALS.MATTRESS, { roughness: 0.9 });

  // Seat cushion
  const seatGeom = new THREE.BoxGeometry(w - armWidth * 2, seatHeight * 0.4, l * 0.8);
  const seat = new THREE.Mesh(seatGeom, cushionMat);
  seat.position.set(0, seatHeight * 0.6, l * 0.05);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // Seat base
  const baseGeom = new THREE.BoxGeometry(w, seatHeight * 0.5, l);
  const baseMat = createMaterial(FIXTURE_MATERIALS.BED_FRAME);
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.set(0, seatHeight * 0.25, 0);
  base.castShadow = true;
  group.add(base);

  // Backrest
  const backGeom = new THREE.BoxGeometry(w - armWidth * 2, backHeight, l * 0.25);
  const back = new THREE.Mesh(backGeom, cushionMat);
  back.position.set(0, seatHeight + backHeight / 2, -l * 0.35);
  back.castShadow = true;
  group.add(back);

  // Left armrest
  const armGeom = new THREE.BoxGeometry(armWidth, seatHeight + backHeight * 0.5, l);
  const leftArm = new THREE.Mesh(armGeom, cushionMat);
  leftArm.position.set(-w / 2 + armWidth / 2, (seatHeight + backHeight * 0.5) / 2, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  // Right armrest
  const rightArm = new THREE.Mesh(armGeom, cushionMat);
  rightArm.position.set(w / 2 - armWidth / 2, (seatHeight + backHeight * 0.5) / 2, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  return group;
}

/**
 * Create a recliner - padded seat with high backrest, armrests, and footrest
 */
export function createReclinerGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const seatHeight = ftToUnits(1.5);
  const backHeight = ftToUnits(2);
  const armWidth = ftToUnits(0.4);
  const armHeight = ftToUnits(2);
  const footrestHeight = ftToUnits(0.4);

  const cushionMat = createMaterial(FIXTURE_MATERIALS.MATTRESS, { roughness: 0.9 });
  const frameMat = createMaterial(FIXTURE_MATERIALS.BED_FRAME);

  // Seat base (wooden/metal frame)
  const baseGeom = new THREE.BoxGeometry(w, seatHeight * 0.5, l * 0.85);
  const base = new THREE.Mesh(baseGeom, frameMat);
  base.position.set(0, seatHeight * 0.25, -l * 0.075);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Seat cushion (thick and padded)
  const seatGeom = new THREE.BoxGeometry(w - armWidth * 2, seatHeight * 0.5, l * 0.6);
  const seat = new THREE.Mesh(seatGeom, cushionMat);
  seat.position.set(0, seatHeight * 0.75, l * 0.05);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // Backrest (high and slightly reclined)
  const backGeom = new THREE.BoxGeometry(w - armWidth * 2, backHeight, l * 0.35);
  const back = new THREE.Mesh(backGeom, cushionMat);
  back.position.set(0, seatHeight + backHeight / 2, -l * 0.3);
  back.rotation.x = -0.15; // Slight recline angle
  back.castShadow = true;
  group.add(back);

  // Headrest (padded top of backrest)
  const headrestGeom = new THREE.BoxGeometry(w * 0.5, ftToUnits(0.6), l * 0.25);
  const headrest = new THREE.Mesh(headrestGeom, cushionMat);
  headrest.position.set(0, seatHeight + backHeight + ftToUnits(0.2), -l * 0.35);
  headrest.rotation.x = -0.2;
  headrest.castShadow = true;
  group.add(headrest);

  // Left armrest
  const armGeom = new THREE.BoxGeometry(armWidth, armHeight, l * 0.8);
  const leftArm = new THREE.Mesh(armGeom, cushionMat);
  leftArm.position.set(-w / 2 + armWidth / 2, armHeight / 2, 0);
  leftArm.castShadow = true;
  group.add(leftArm);

  // Right armrest
  const rightArm = new THREE.Mesh(armGeom, cushionMat);
  rightArm.position.set(w / 2 - armWidth / 2, armHeight / 2, 0);
  rightArm.castShadow = true;
  group.add(rightArm);

  // Footrest (folded/retracted position under seat)
  const footrestGeom = new THREE.BoxGeometry(w - armWidth * 2, footrestHeight, l * 0.3);
  const footrest = new THREE.Mesh(footrestGeom, frameMat);
  footrest.position.set(0, footrestHeight / 2, l * 0.45);
  footrest.castShadow = true;
  group.add(footrest);

  // Footrest cushion
  const footrestCushionGeom = new THREE.BoxGeometry(w - armWidth * 2.5, ftToUnits(0.15), l * 0.25);
  const footrestCushion = new THREE.Mesh(footrestCushionGeom, cushionMat);
  footrestCushion.position.set(0, footrestHeight + ftToUnits(0.075), l * 0.45);
  footrestCushion.castShadow = true;
  group.add(footrestCushion);

  // Recline lever (small cylinder on the side)
  const leverGeom = new THREE.CylinderGeometry(ftToUnits(0.05), ftToUnits(0.05), ftToUnits(0.3), 8);
  const leverMat = createMaterial(0x4A4A4A, { metalness: 0.6, roughness: 0.4 });
  const lever = new THREE.Mesh(leverGeom, leverMat);
  lever.rotation.z = Math.PI / 2;
  lever.position.set(-w / 2 + ftToUnits(0.1), seatHeight * 0.4, l * 0.2);
  lever.castShadow = true;
  group.add(lever);

  return group;
}

/**
 * Create a desk - simple table with legs
 */
export function createDeskGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(2.5); // Desk height
  const topThickness = ftToUnits(0.08);

  const woodMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);

  // Desktop
  const topGeom = new THREE.BoxGeometry(w, topThickness, l);
  const top = new THREE.Mesh(topGeom, woodMat);
  top.position.set(0, h - topThickness / 2, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Side panels (instead of legs for this style)
  const panelThickness = ftToUnits(0.1);
  const panelGeom = new THREE.BoxGeometry(panelThickness, h - topThickness, l * 0.9);

  const leftPanel = new THREE.Mesh(panelGeom, woodMat);
  leftPanel.position.set(-w / 2 + panelThickness / 2, (h - topThickness) / 2, 0);
  leftPanel.castShadow = true;
  group.add(leftPanel);

  const rightPanel = new THREE.Mesh(panelGeom, woodMat);
  rightPanel.position.set(w / 2 - panelThickness / 2, (h - topThickness) / 2, 0);
  rightPanel.castShadow = true;
  group.add(rightPanel);

  return group;
}

/**
 * Create a dresser - chest of drawers with multiple drawer fronts
 */
export function createDresserGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3); // Dresser height ~36 inches

  const bodyMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);
  const handleMat = createMaterial(0x8A8A8A, { metalness: 0.8, roughness: 0.3 });
  const seamMat = createMaterial(0x5A3A1A);

  // Main body
  const bodyGeom = new THREE.BoxGeometry(w, h, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Drawer fronts (4 rows of drawers)
  const drawerCount = 4;
  const drawerHeight = h * 0.22;
  const drawerGap = h * 0.02;

  for (let i = 0; i < drawerCount; i++) {
    const drawerY = drawerGap + drawerHeight / 2 + i * (drawerHeight + drawerGap);

    // Drawer seam (horizontal line above drawer)
    const seamGeom = new THREE.BoxGeometry(w * 0.95, 0.005, 0.005);
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.position.set(0, drawerY + drawerHeight / 2 + drawerGap / 2, l / 2 - 0.005);
    group.add(seam);

    // Drawer handles (two per drawer, flush with front)
    const handleGeom = new THREE.BoxGeometry(w * 0.08, 0.02, 0.015);
    const handleL = new THREE.Mesh(handleGeom, handleMat);
    handleL.position.set(-w * 0.2, drawerY, l / 2 - 0.008);
    group.add(handleL);

    const handleR = new THREE.Mesh(handleGeom, handleMat);
    handleR.position.set(w * 0.2, drawerY, l / 2 - 0.008);
    group.add(handleR);
  }

  // Top surface (slightly recessed)
  const topGeom = new THREE.BoxGeometry(w * 0.98, ftToUnits(0.05), l * 0.98);
  const topMat = createMaterial(FIXTURE_MATERIALS.COUNTERTOP, { roughness: 0.5 });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.set(0, h - ftToUnits(0.025), 0);
  top.castShadow = true;
  group.add(top);

  return group;
}

/**
 * Create a bench - simple box
 */
export function createBenchGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(1.5); // Bench height

  const woodMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);

  // Bench top/seat
  const seatGeom = new THREE.BoxGeometry(w, ftToUnits(0.15), l);
  const seat = new THREE.Mesh(seatGeom, woodMat);
  seat.position.set(0, h - ftToUnits(0.075), 0);
  seat.castShadow = true;
  seat.receiveShadow = true;
  group.add(seat);

  // Storage box underneath
  const storageGeom = new THREE.BoxGeometry(w * 0.95, h - ftToUnits(0.2), l * 0.9);
  const storage = new THREE.Mesh(storageGeom, woodMat);
  storage.position.set(0, (h - ftToUnits(0.2)) / 2, 0);
  storage.castShadow = true;
  group.add(storage);

  return group;
}

/**
 * Create a wall-mounted coat rack with shelf and hooks
 * Features: wooden backboard, top shelf, multiple double-prong hooks
 * All geometry stays within footprint bounds for proper wall placement
 * 
 * Coordinate mapping: widthFt -> X (depth from wall), lengthFt -> Z (along wall)
 */
export function createCoatRackGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  // Dimensions - coat rack is wall-mounted
  // widthFt = footprint width -> X axis (depth from wall, 0.5ft typical)
  // lengthFt = footprint length -> Z axis (along wall, 1.5ft typical)
  const rackDepth = ftToUnits(widthFt);    // Depth from wall -> X axis
  const rackLength = ftToUnits(lengthFt);  // Length along wall -> Z axis
  const backboardHeight = ftToUnits(0.5);  // Backboard height (6")
  const backboardThickness = ftToUnits(0.06); // 3/4" thick board
  // Shelf extends from wall (along X axis), must stay within rackDepth bounds
  const shelfExtent = Math.min(ftToUnits(0.35), rackDepth * 0.9);  // Max 90% of depth
  const shelfThickness = ftToUnits(0.05);  // Shelf thickness
  const mountHeight = ftToUnits(5);        // Mount height from floor (~5ft)

  // Materials
  const woodMat = createMaterial(0x8B5A2B, { roughness: 0.7, metalness: 0.0 }); // Rich walnut
  const metalMat = createMaterial(0x2F2F2F, { roughness: 0.3, metalness: 0.8 }); // Dark brushed metal
  const metalAccent = createMaterial(0x4A4A4A, { roughness: 0.25, metalness: 0.85 }); // Lighter metal

  // === BACKBOARD ===
  // Main wooden panel that mounts to the wall
  // BoxGeometry(X, Y, Z) = (depth/thickness, height, length along wall)
  const backboardGeom = new THREE.BoxGeometry(backboardThickness, backboardHeight, rackLength);
  const backboard = new THREE.Mesh(backboardGeom, woodMat);
  backboard.position.set(-rackDepth / 2 + backboardThickness / 2, mountHeight, 0);
  backboard.castShadow = true;
  backboard.receiveShadow = true;
  group.add(backboard);

  // Decorative routed edge on top of backboard (stays within footprint)
  const topTrimGeom = new THREE.BoxGeometry(backboardThickness, ftToUnits(0.03), rackLength * 0.98);
  const topTrim = new THREE.Mesh(topTrimGeom, woodMat);
  topTrim.position.set(-rackDepth / 2 + backboardThickness / 2, mountHeight + backboardHeight / 2 + ftToUnits(0.015), 0);
  topTrim.castShadow = true;
  group.add(topTrim);

  // === TOP SHELF ===
  // Small shelf above the hooks for hats, gloves, etc.
  // Shelf extends along X (from wall), spans Z (along wall)
  const shelfGeom = new THREE.BoxGeometry(shelfExtent, shelfThickness, rackLength);
  const shelf = new THREE.Mesh(shelfGeom, woodMat);
  shelf.position.set(-rackDepth / 2 + shelfExtent / 2, mountHeight + backboardHeight / 2 + ftToUnits(0.05), 0);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  group.add(shelf);

  // Shelf front edge (rounded profile) - runs along Z axis
  const edgeGeom = new THREE.CylinderGeometry(shelfThickness / 2, shelfThickness / 2, rackLength, 8);
  const shelfEdge = new THREE.Mesh(edgeGeom, woodMat);
  shelfEdge.rotation.x = Math.PI / 2;  // Rotate to align with Z axis
  shelfEdge.position.set(-rackDepth / 2 + shelfExtent - shelfThickness / 2, mountHeight + backboardHeight / 2 + ftToUnits(0.05), 0);
  shelfEdge.castShadow = true;
  group.add(shelfEdge);

  // Shelf support brackets (decorative metal brackets)
  const bracketPositions = [-rackLength * 0.35, rackLength * 0.35];  // Along Z axis
  bracketPositions.forEach(zPos => {
    // Vertical part of bracket
    const bracketVertGeom = new THREE.BoxGeometry(ftToUnits(0.02), ftToUnits(0.12), ftToUnits(0.02));
    const bracketVert = new THREE.Mesh(bracketVertGeom, metalAccent);
    bracketVert.position.set(-rackDepth / 2 + backboardThickness + ftToUnits(0.01), mountHeight + backboardHeight / 2 - ftToUnits(0.03), zPos);
    group.add(bracketVert);

    // Horizontal part of bracket - extends along X
    const bracketHorizGeom = new THREE.BoxGeometry(shelfExtent * 0.6, ftToUnits(0.02), ftToUnits(0.02));
    const bracketHoriz = new THREE.Mesh(bracketHorizGeom, metalAccent);
    bracketHoriz.position.set(-rackDepth / 2 + shelfExtent * 0.35, mountHeight + backboardHeight / 2 - ftToUnits(0.08), zPos);
    group.add(bracketHoriz);
  });

  // === COAT HOOKS ===
  // Create 4 double-prong hooks evenly spaced along the backboard (along Z axis)
  const hookCount = 4;
  const hookSpacing = rackLength / (hookCount + 1);
  const hookY = mountHeight - ftToUnits(0.05); // Position hooks below center of backboard
  const hookX = -rackDepth / 2 + backboardThickness;  // Just in front of backboard
  const maxHookExtent = rackDepth / 2 - backboardThickness; // Available depth for hooks

  for (let i = 1; i <= hookCount; i++) {
    const hookZ = -rackLength / 2 + hookSpacing * i;
    createCoatHookSwapped(group, metalMat, metalAccent, hookX, hookY, hookZ, maxHookExtent);
  }

  // End caps removed - they extended beyond footprint bounds
  // The backboard itself provides a clean finished look

  return group;
}

/**
 * Helper to create a compact coat hook (stays within footprint bounds)
 */
function createCoatHook(
  group: THREE.Group,
  metalMat: THREE.Material,
  accentMat: THREE.Material,
  x: number,
  y: number,
  z: number,
  maxDepth: number // Maximum depth from z to front of hook
): void {
  // Scale hook to fit within maxDepth
  const scale = Math.min(1, maxDepth / ftToUnits(0.25));
  
  // Hook base plate (mounts to backboard)
  const basePlateGeom = new THREE.CylinderGeometry(ftToUnits(0.03) * scale, ftToUnits(0.035) * scale, ftToUnits(0.01), 12);
  const basePlate = new THREE.Mesh(basePlateGeom, accentMat);
  basePlate.rotation.x = Math.PI / 2;
  basePlate.position.set(x, y, z + ftToUnits(0.005));
  group.add(basePlate);

  // Hook stem (extends from wall) - shortened
  const stemLength = ftToUnits(0.08) * scale;
  const stemGeom = new THREE.CylinderGeometry(ftToUnits(0.015) * scale, ftToUnits(0.02) * scale, stemLength, 10);
  const stem = new THREE.Mesh(stemGeom, metalMat);
  stem.rotation.x = Math.PI / 2;
  stem.position.set(x, y, z + stemLength / 2 + ftToUnits(0.01));
  stem.castShadow = true;
  group.add(stem);

  // Single curved hook prong (simplified)
  const prongLength = ftToUnits(0.06) * scale;
  const prongGeom = new THREE.CylinderGeometry(ftToUnits(0.01) * scale, ftToUnits(0.012) * scale, prongLength, 8);
  const prong = new THREE.Mesh(prongGeom, metalMat);
  prong.rotation.x = Math.PI / 6; // Angle downward
  prong.position.set(x, y - ftToUnits(0.02) * scale, z + stemLength + ftToUnits(0.02) * scale);
  prong.castShadow = true;
  group.add(prong);

  // Prong tip (ball end)
  const tipGeom = new THREE.SphereGeometry(ftToUnits(0.012) * scale, 8, 8);
  const tip = new THREE.Mesh(tipGeom, metalMat);
  tip.position.set(x, y - ftToUnits(0.045) * scale, z + stemLength + ftToUnits(0.05) * scale);
  group.add(tip);
}

/**
 * Coat hook version that extends along +X axis (for wall on -X side)
 * Used when coat rack geometry has been corrected to have depth along X
 */
function createCoatHookSwapped(
  group: THREE.Group,
  metalMat: THREE.Material,
  accentMat: THREE.Material,
  x: number,  // Position at backboard
  y: number,
  z: number,
  maxExtent: number // Maximum extent in +X direction
): void {
  // Scale hook to fit within maxExtent
  const scale = Math.min(1, maxExtent / ftToUnits(0.25));
  
  // Hook base plate (mounts to backboard)
  const basePlateGeom = new THREE.CylinderGeometry(ftToUnits(0.03) * scale, ftToUnits(0.035) * scale, ftToUnits(0.01), 12);
  const basePlate = new THREE.Mesh(basePlateGeom, accentMat);
  basePlate.rotation.z = Math.PI / 2;  // Face along X axis
  basePlate.position.set(x + ftToUnits(0.005), y, z);
  group.add(basePlate);

  // Hook stem (extends from wall along +X)
  const stemLength = ftToUnits(0.08) * scale;
  const stemGeom = new THREE.CylinderGeometry(ftToUnits(0.015) * scale, ftToUnits(0.02) * scale, stemLength, 10);
  const stem = new THREE.Mesh(stemGeom, metalMat);
  stem.rotation.z = Math.PI / 2;  // Align along X axis
  stem.position.set(x + stemLength / 2 + ftToUnits(0.01), y, z);
  stem.castShadow = true;
  group.add(stem);

  // Single curved hook prong (simplified)
  const prongLength = ftToUnits(0.06) * scale;
  const prongGeom = new THREE.CylinderGeometry(ftToUnits(0.01) * scale, ftToUnits(0.012) * scale, prongLength, 8);
  const prong = new THREE.Mesh(prongGeom, metalMat);
  prong.rotation.z = Math.PI / 6; // Angle downward
  prong.position.set(x + stemLength + ftToUnits(0.02) * scale, y - ftToUnits(0.02) * scale, z);
  prong.castShadow = true;
  group.add(prong);

  // Prong tip (ball end)
  const tipGeom = new THREE.SphereGeometry(ftToUnits(0.012) * scale, 8, 8);
  const tip = new THREE.Mesh(tipGeom, metalMat);
  tip.position.set(x + stemLength + ftToUnits(0.05) * scale, y - ftToUnits(0.045) * scale, z);
  group.add(tip);
}

/**
 * Create a floor-standing storage cubby system
 * Features: 3x3 grid of open cubbies for shoes, bags, gear storage
 */
export function createStorageCubbiesGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  // Dimensions - cubby unit is floor-standing
  const unitWidth = ftToUnits(widthFt);   // Width (1.5ft typical)
  const unitDepth = ftToUnits(lengthFt);  // Depth (1.5ft typical)
  const unitHeight = ftToUnits(4.5);      // Total height (~4.5ft)
  const panelThickness = ftToUnits(0.06); // Panel thickness (~3/4")
  const baseHeight = ftToUnits(0.15);     // Raised base/plinth

  // Grid configuration
  const cols = 3;
  const rows = 3;
  const cubbyWidth = (unitWidth - panelThickness * (cols + 1)) / cols;
  const cubbyHeight = (unitHeight - baseHeight - panelThickness * (rows + 1)) / rows;
  const cubbyDepth = unitDepth - panelThickness;

  // Materials
  const woodMat = createMaterial(0x8B7355, { roughness: 0.75, metalness: 0.0 }); // Light oak
  const innerMat = createMaterial(0x9E8B73, { roughness: 0.8, metalness: 0.0 }); // Slightly lighter inside

  // === BASE/PLINTH ===
  const baseGeom = new THREE.BoxGeometry(unitWidth, baseHeight, unitDepth);
  const base = new THREE.Mesh(baseGeom, woodMat);
  base.position.set(0, baseHeight / 2, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // === OUTER FRAME ===
  // Top panel
  const topGeom = new THREE.BoxGeometry(unitWidth, panelThickness, unitDepth);
  const top = new THREE.Mesh(topGeom, woodMat);
  top.position.set(0, unitHeight - panelThickness / 2, 0);
  top.castShadow = true;
  top.receiveShadow = true;
  group.add(top);

  // Left side panel
  const sideGeom = new THREE.BoxGeometry(panelThickness, unitHeight - baseHeight, unitDepth);
  const leftSide = new THREE.Mesh(sideGeom, woodMat);
  leftSide.position.set(-unitWidth / 2 + panelThickness / 2, baseHeight + (unitHeight - baseHeight) / 2, 0);
  leftSide.castShadow = true;
  leftSide.receiveShadow = true;
  group.add(leftSide);

  // Right side panel
  const rightSide = new THREE.Mesh(sideGeom, woodMat);
  rightSide.position.set(unitWidth / 2 - panelThickness / 2, baseHeight + (unitHeight - baseHeight) / 2, 0);
  rightSide.castShadow = true;
  rightSide.receiveShadow = true;
  group.add(rightSide);

  // Back panel (thinner)
  const backGeom = new THREE.BoxGeometry(unitWidth - panelThickness * 2, unitHeight - baseHeight - panelThickness, panelThickness * 0.5);
  const back = new THREE.Mesh(backGeom, innerMat);
  back.position.set(0, baseHeight + (unitHeight - baseHeight - panelThickness) / 2 + panelThickness / 2, -unitDepth / 2 + panelThickness * 0.25);
  back.receiveShadow = true;
  group.add(back);

  // === VERTICAL DIVIDERS ===
  const vertDividerGeom = new THREE.BoxGeometry(panelThickness, unitHeight - baseHeight - panelThickness, cubbyDepth);
  for (let col = 1; col < cols; col++) {
    const xPos = -unitWidth / 2 + panelThickness + col * (cubbyWidth + panelThickness) - panelThickness / 2;
    const divider = new THREE.Mesh(vertDividerGeom, woodMat);
    divider.position.set(xPos, baseHeight + (unitHeight - baseHeight - panelThickness) / 2 + panelThickness / 2, panelThickness / 2);
    divider.castShadow = true;
    divider.receiveShadow = true;
    group.add(divider);
  }

  // === HORIZONTAL SHELVES ===
  const shelfGeom = new THREE.BoxGeometry(unitWidth - panelThickness * 2, panelThickness, cubbyDepth);
  for (let row = 1; row < rows; row++) {
    const yPos = baseHeight + panelThickness + row * (cubbyHeight + panelThickness) - panelThickness / 2;
    const shelf = new THREE.Mesh(shelfGeom, woodMat);
    shelf.position.set(0, yPos, panelThickness / 2);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    group.add(shelf);
  }

  // === BOTTOM SHELF (inside) ===
  const bottomShelfGeom = new THREE.BoxGeometry(unitWidth - panelThickness * 2, panelThickness, cubbyDepth);
  const bottomShelf = new THREE.Mesh(bottomShelfGeom, woodMat);
  bottomShelf.position.set(0, baseHeight + panelThickness / 2, panelThickness / 2);
  bottomShelf.receiveShadow = true;
  group.add(bottomShelf);

  // === DECORATIVE TOP EDGE ===
  const topEdgeGeom = new THREE.BoxGeometry(unitWidth + ftToUnits(0.04), ftToUnits(0.04), unitDepth + ftToUnits(0.02));
  const topEdge = new THREE.Mesh(topEdgeGeom, woodMat);
  topEdge.position.set(0, unitHeight + ftToUnits(0.02), 0);
  topEdge.castShadow = true;
  group.add(topEdge);

  return group;
}

/**
 * Create a wall-mounted closet organization system
 * Features: upper shelf, hanging rod, lower shelves, side panels
 * 
 * Standard axis convention (matches 2D footprint):
 * - widthFt (footprintFt.width = 2ft) → X axis (depth from wall)
 * - lengthFt (footprintFt.length = 6ft) → Z axis (width along wall = 72")
 * 
 * The closet is mounted on a wall (back at negative X) and opens toward positive X.
 * For a closet on a container side wall, this means it sticks out into the room.
 */
export function createClosetSystemGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  // Dimensions - following standard axis convention
  // widthFt = depth from wall (2ft typical) → X axis
  // lengthFt = width along wall (6ft = 72") → Z axis
  const closetDepth = ftToUnits(widthFt);   // 2ft depth sticking out from wall -> X axis
  const closetWidth = ftToUnits(lengthFt);  // 6ft width along wall (72") -> Z axis
  const closetHeight = ftToUnits(7);        // Total height -> Y axis
  const panelThickness = ftToUnits(0.06);   // Panel thickness (~3/4")
  const shelfThickness = ftToUnits(0.08);   // Shelf thickness (~1")
  const rodHeight = ftToUnits(5.5);         // Hanging rod height from floor
  const rodRadius = ftToUnits(0.05);        // Rod radius (~1.25" diameter)

  // Materials
  const woodMat = createMaterial(0xD4C4B0, { roughness: 0.7, metalness: 0.0 }); // Light maple/birch
  const chromeMat = createMaterial(0xC0C0C0, { roughness: 0.15, metalness: 0.9 }); // Chrome rod
  const bracketMat = createMaterial(0x808080, { roughness: 0.3, metalness: 0.7 }); // Metal brackets

  // === BACK PANEL (mounting board against the wall) ===
  // Spans the full width (Z) and height (Y), thin in depth (X)
  // Positioned at the back (negative X edge)
  const backGeom = new THREE.BoxGeometry(panelThickness, closetHeight, closetWidth);
  const backPanel = new THREE.Mesh(backGeom, woodMat);
  backPanel.position.set(-closetDepth / 2 + panelThickness / 2, closetHeight / 2, 0);
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  group.add(backPanel);

  // === SIDE PANELS (left and right ends) ===
  // Span the full depth (X) and height (Y), thin in width (Z)
  // Positioned at the ends (±Z)
  const sideGeom = new THREE.BoxGeometry(closetDepth, closetHeight, panelThickness);
  
  const leftSide = new THREE.Mesh(sideGeom, woodMat);
  leftSide.position.set(0, closetHeight / 2, -closetWidth / 2 + panelThickness / 2);
  leftSide.castShadow = true;
  leftSide.receiveShadow = true;
  group.add(leftSide);

  const rightSide = new THREE.Mesh(sideGeom, woodMat);
  rightSide.position.set(0, closetHeight / 2, closetWidth / 2 - panelThickness / 2);
  rightSide.castShadow = true;
  rightSide.receiveShadow = true;
  group.add(rightSide);

  // === TOP SHELF ===
  // Spans width (Z) and depth (X), thin in height (Y)
  const topShelfGeom = new THREE.BoxGeometry(closetDepth - panelThickness, shelfThickness, closetWidth - panelThickness * 2);
  const topShelf = new THREE.Mesh(topShelfGeom, woodMat);
  topShelf.position.set(panelThickness / 2, closetHeight - shelfThickness / 2, 0);
  topShelf.castShadow = true;
  topShelf.receiveShadow = true;
  group.add(topShelf);

  // === UPPER STORAGE SHELF (above rod) ===
  const upperShelfY = rodHeight + ftToUnits(1.2);
  const upperShelf = new THREE.Mesh(topShelfGeom, woodMat);
  upperShelf.position.set(panelThickness / 2, upperShelfY, 0);
  upperShelf.castShadow = true;
  upperShelf.receiveShadow = true;
  group.add(upperShelf);

  // === HANGING ROD ===
  // Rod runs along the width (Z axis) of the closet - the 6ft/72" dimension
  const rodLength = closetWidth - panelThickness * 4;
  const rodGeom = new THREE.CylinderGeometry(rodRadius, rodRadius, rodLength, 16);
  const rod = new THREE.Mesh(rodGeom, chromeMat);
  rod.rotation.x = Math.PI / 2;  // Rotate to lie along Z axis
  rod.position.set(0, rodHeight, 0);
  rod.castShadow = true;
  group.add(rod);

  // Rod end caps
  const capGeom = new THREE.SphereGeometry(rodRadius * 1.2, 12, 12);
  const leftCap = new THREE.Mesh(capGeom, chromeMat);
  leftCap.position.set(0, rodHeight, -rodLength / 2);
  group.add(leftCap);

  const rightCap = new THREE.Mesh(capGeom, chromeMat);
  rightCap.position.set(0, rodHeight, rodLength / 2);
  group.add(rightCap);

  // === ROD BRACKETS ===
  const bracketCount = 3;
  const bracketSpacing = rodLength / (bracketCount + 1);
  
  for (let i = 1; i <= bracketCount; i++) {
    const zPos = -rodLength / 2 + i * bracketSpacing;
    
    // Bracket arm (extends from back panel toward front)
    const armGeom = new THREE.BoxGeometry(closetDepth / 2, ftToUnits(0.04), ftToUnits(0.04));
    const arm = new THREE.Mesh(armGeom, bracketMat);
    arm.position.set(-closetDepth / 4 + panelThickness, rodHeight + rodRadius + ftToUnits(0.02), zPos);
    arm.castShadow = true;
    group.add(arm);

    // Bracket hook (holds rod)
    const hookGeom = new THREE.TorusGeometry(rodRadius * 1.5, ftToUnits(0.015), 8, 12, Math.PI);
    const hook = new THREE.Mesh(hookGeom, bracketMat);
    hook.rotation.y = Math.PI / 2;
    hook.rotation.z = Math.PI;
    hook.position.set(0, rodHeight + rodRadius * 0.5, zPos);
    group.add(hook);
  }

  // === LOWER SHELVES (below rod) ===
  const lowerShelfCount = 3;
  const lowerShelfSpacing = (rodHeight - ftToUnits(0.5)) / (lowerShelfCount + 1);
  // Narrower shelves that don't extend all the way to front
  const lowerShelfGeom = new THREE.BoxGeometry(closetDepth * 0.6, shelfThickness, closetWidth - panelThickness * 2);

  for (let i = 1; i <= lowerShelfCount; i++) {
    const shelfY = ftToUnits(0.3) + i * lowerShelfSpacing;
    const lowerShelf = new THREE.Mesh(lowerShelfGeom, woodMat);
    // Position toward back (negative X)
    lowerShelf.position.set(-closetDepth * 0.15 + panelThickness, shelfY, 0);
    lowerShelf.castShadow = true;
    lowerShelf.receiveShadow = true;
    group.add(lowerShelf);
  }

  // === SHELF SUPPORT BRACKETS ===
  // Add small L-brackets under each lower shelf
  const lBracketGeom = new THREE.BoxGeometry(ftToUnits(0.02), ftToUnits(0.08), ftToUnits(0.02));
  
  for (let i = 1; i <= lowerShelfCount; i++) {
    const shelfY = ftToUnits(0.3) + i * lowerShelfSpacing;
    
    // Left bracket (negative Z end)
    const leftBracket = new THREE.Mesh(lBracketGeom, bracketMat);
    leftBracket.position.set(-closetDepth * 0.15 + panelThickness, shelfY - shelfThickness / 2 - ftToUnits(0.04), -closetWidth / 2 + panelThickness + ftToUnits(0.1));
    group.add(leftBracket);

    // Right bracket (positive Z end)
    const rightBracket = new THREE.Mesh(lBracketGeom, bracketMat);
    rightBracket.position.set(-closetDepth * 0.15 + panelThickness, shelfY - shelfThickness / 2 - ftToUnits(0.04), closetWidth / 2 - panelThickness - ftToUnits(0.1));
    group.add(rightBracket);
  }

  // === DECORATIVE TOP CROWN ===
  const crownGeom = new THREE.BoxGeometry(closetDepth + ftToUnits(0.05), ftToUnits(0.06), closetWidth + ftToUnits(0.1));
  const crown = new THREE.Mesh(crownGeom, woodMat);
  crown.position.set(0, closetHeight + ftToUnits(0.03), 0);
  crown.castShadow = true;
  group.add(crown);

  return group;
}

