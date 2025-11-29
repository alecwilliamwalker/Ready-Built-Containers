/**
 * Laundry Fixtures - Washer, Dryer
 */

import * as THREE from "three";
import { ftToUnits } from "../constants";
import { createMaterial } from "./materials";

/**
 * Create a dryer - front-loading appliance with drum door and control panel
 */
export function createDryerGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3.2); // Standard dryer height ~38 inches

  // Materials
  const bodyMat = createMaterial(0xF0F0F0, { // White appliance body
    metalness: 0.2,
    roughness: 0.4,
  });
  const doorRingMat = createMaterial(0xE0E0E0, {
    metalness: 0.4,
    roughness: 0.3,
  });
  const glassMat = createMaterial(0x1A1A3A, { // Dark tinted glass
    transparent: true,
    opacity: 0.7,
    metalness: 0.1,
    roughness: 0.1,
  });
  const drumMat = createMaterial(0x888888, { // Stainless drum interior
    metalness: 0.6,
    roughness: 0.4,
  });
  const controlMat = createMaterial(0x2A2A2A, { roughness: 0.8 });
  const accentMat = createMaterial(0x404040, { metalness: 0.5 });
  const dialMat = createMaterial(0xC0C0C0, { metalness: 0.7, roughness: 0.2 });

  // Main body - slightly rounded box
  const bodyGeom = new THREE.BoxGeometry(w, h * 0.92, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h * 0.46, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Control panel at top
  const panelHeight = h * 0.08;
  const panelGeom = new THREE.BoxGeometry(w, panelHeight, l);
  const panel = new THREE.Mesh(panelGeom, controlMat);
  panel.position.set(0, h - panelHeight / 2, 0);
  panel.castShadow = true;
  group.add(panel);

  // Control dial (large rotary knob)
  const dialRadius = Math.min(w, l) * 0.12;
  const dialGeom = new THREE.CylinderGeometry(dialRadius, dialRadius * 0.9, ftToUnits(0.08), 24);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(-w * 0.25, h - panelHeight / 2, l / 2 + ftToUnits(0.04));
  group.add(dial);

  // Dial center indicator
  const dialCenterGeom = new THREE.CylinderGeometry(dialRadius * 0.15, dialRadius * 0.15, ftToUnits(0.1), 12);
  const dialCenter = new THREE.Mesh(dialCenterGeom, accentMat);
  dialCenter.rotation.x = Math.PI / 2;
  dialCenter.position.set(-w * 0.25, h - panelHeight / 2, l / 2 + ftToUnits(0.06));
  group.add(dialCenter);

  // Start button
  const buttonRadius = Math.min(w, l) * 0.06;
  const buttonGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, ftToUnits(0.04), 16);
  const buttonMat = createMaterial(0x22AA22, { metalness: 0.3, roughness: 0.5 }); // Green start button
  const startButton = new THREE.Mesh(buttonGeom, buttonMat);
  startButton.rotation.x = Math.PI / 2;
  startButton.position.set(w * 0.25, h - panelHeight / 2, l / 2 + ftToUnits(0.03));
  group.add(startButton);

  // Secondary button (settings)
  const smallButtonGeom = new THREE.CylinderGeometry(buttonRadius * 0.6, buttonRadius * 0.6, ftToUnits(0.03), 12);
  const settingsButton = new THREE.Mesh(smallButtonGeom, dialMat);
  settingsButton.rotation.x = Math.PI / 2;
  settingsButton.position.set(w * 0.1, h - panelHeight / 2, l / 2 + ftToUnits(0.025));
  group.add(settingsButton);

  // Front door - circular drum door
  const doorCenterY = h * 0.48;
  const doorRadius = Math.min(w, l) * 0.38;

  // Door outer ring (chrome/silver frame)
  const doorRingGeom = new THREE.TorusGeometry(doorRadius, doorRadius * 0.12, 16, 32);
  const doorRing = new THREE.Mesh(doorRingGeom, doorRingMat);
  doorRing.rotation.x = Math.PI / 2;
  doorRing.position.set(0, doorCenterY, l / 2 + ftToUnits(0.02));
  group.add(doorRing);

  // Door glass (dark tinted, showing drum interior)
  const glassGeom = new THREE.CircleGeometry(doorRadius * 0.88, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.rotation.x = 0;
  glass.rotation.y = 0;
  glass.position.set(0, doorCenterY, l / 2 + ftToUnits(0.025));
  group.add(glass);

  // Drum interior visible through glass (recessed cylinder)
  const drumGeom = new THREE.CylinderGeometry(doorRadius * 0.75, doorRadius * 0.75, l * 0.6, 24, 1, true);
  const drum = new THREE.Mesh(drumGeom, drumMat);
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0, doorCenterY, 0);
  group.add(drum);

  // Drum lifters (baffles inside drum)
  const baffleGeom = new THREE.BoxGeometry(doorRadius * 0.1, doorRadius * 1.4, ftToUnits(0.08));
  for (let i = 0; i < 3; i++) {
    const baffle = new THREE.Mesh(baffleGeom, drumMat);
    const angle = (i * Math.PI * 2) / 3;
    baffle.position.set(
      0,
      doorCenterY,
      l * 0.1
    );
    baffle.rotation.z = angle;
    baffle.rotation.x = Math.PI / 2;
    // Position baffles at the drum surface
    baffle.position.x = Math.cos(angle) * doorRadius * 0.55;
    baffle.position.y = doorCenterY + Math.sin(angle) * doorRadius * 0.55;
    group.add(baffle);
  }

  // Door handle (horizontal bar on right side of door)
  const handleLength = doorRadius * 0.6;
  const handleGeom = new THREE.CylinderGeometry(ftToUnits(0.04), ftToUnits(0.04), handleLength, 12);
  const handleMat = createMaterial(0xA8A8A8, { metalness: 0.7, roughness: 0.2 });
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(doorRadius * 0.6, doorCenterY, l / 2 + ftToUnits(0.08));
  group.add(handle);

  // Handle end caps
  const capGeom = new THREE.SphereGeometry(ftToUnits(0.05), 12, 12);
  const cap1 = new THREE.Mesh(capGeom, handleMat);
  cap1.position.set(doorRadius * 0.6 + handleLength / 2, doorCenterY, l / 2 + ftToUnits(0.08));
  group.add(cap1);
  const cap2 = new THREE.Mesh(capGeom, handleMat);
  cap2.position.set(doorRadius * 0.6 - handleLength / 2, doorCenterY, l / 2 + ftToUnits(0.08));
  group.add(cap2);

  // Feet (4 leveling feet at corners)
  const footRadius = ftToUnits(0.06);
  const footHeight = ftToUnits(0.08);
  const footGeom = new THREE.CylinderGeometry(footRadius, footRadius * 0.8, footHeight, 12);
  const footMat = createMaterial(0x1A1A1A, { roughness: 0.9 });
  const footPositions = [
    { x: -w * 0.4, z: -l * 0.4 },
    { x: w * 0.4, z: -l * 0.4 },
    { x: -w * 0.4, z: l * 0.4 },
    { x: w * 0.4, z: l * 0.4 },
  ];
  footPositions.forEach(pos => {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(pos.x, footHeight / 2, pos.z);
    group.add(foot);
  });

  // Brand badge (small rectangle on control panel)
  const badgeGeom = new THREE.BoxGeometry(w * 0.2, panelHeight * 0.4, ftToUnits(0.01));
  const badgeMat = createMaterial(0x1565C0, { metalness: 0.6, roughness: 0.3 }); // Blue brand color
  const badge = new THREE.Mesh(badgeGeom, badgeMat);
  badge.position.set(0, h - panelHeight / 2, l / 2 + ftToUnits(0.01));
  group.add(badge);

  // Exhaust vent on back (subtle detail)
  const ventGeom = new THREE.BoxGeometry(w * 0.25, h * 0.15, ftToUnits(0.05));
  const ventMat = createMaterial(0x3A3A3A, { roughness: 0.8 });
  const vent = new THREE.Mesh(ventGeom, ventMat);
  vent.position.set(0, h * 0.15, -l / 2 - ftToUnits(0.02));
  group.add(vent);

  // Vent grill lines
  const grillMat = createMaterial(0x2A2A2A);
  for (let i = 0; i < 4; i++) {
    const grillGeom = new THREE.BoxGeometry(w * 0.22, ftToUnits(0.02), ftToUnits(0.06));
    const grill = new THREE.Mesh(grillGeom, grillMat);
    grill.position.set(0, h * 0.1 + i * ftToUnits(0.12), -l / 2 - ftToUnits(0.02));
    group.add(grill);
  }

  return group;
}

/**
 * Create a washer - front-loading washing machine with drum door and control panel
 */
export function createWasherGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3.2); // Standard washer height

  // Materials
  const bodyMat = createMaterial(0xF0F0F0, {
    metalness: 0.2,
    roughness: 0.4,
  });
  const doorRingMat = createMaterial(0xD0D0D0, {
    metalness: 0.5,
    roughness: 0.25,
  });
  const glassMat = createMaterial(0x4A90A4, { // Blue-tinted glass (water inside)
    transparent: true,
    opacity: 0.5,
    metalness: 0.1,
    roughness: 0.1,
  });
  const drumMat = createMaterial(0x909090, {
    metalness: 0.7,
    roughness: 0.3,
  });
  const controlMat = createMaterial(0x2A2A2A, { roughness: 0.8 });
  const dialMat = createMaterial(0xB8B8B8, { metalness: 0.6, roughness: 0.2 });

  // Main body
  const bodyGeom = new THREE.BoxGeometry(w, h * 0.9, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h * 0.45, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Control panel at top
  const panelHeight = h * 0.1;
  const panelGeom = new THREE.BoxGeometry(w, panelHeight, l);
  const panel = new THREE.Mesh(panelGeom, controlMat);
  panel.position.set(0, h - panelHeight / 2, 0);
  panel.castShadow = true;
  group.add(panel);

  // Control dial (cycle selector)
  const dialRadius = Math.min(w, l) * 0.1;
  const dialGeom = new THREE.CylinderGeometry(dialRadius, dialRadius * 0.85, ftToUnits(0.06), 24);
  const dial = new THREE.Mesh(dialGeom, dialMat);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(-w * 0.3, h - panelHeight / 2, l / 2 + ftToUnits(0.03));
  group.add(dial);

  // Temperature dial
  const tempDialGeom = new THREE.CylinderGeometry(dialRadius * 0.7, dialRadius * 0.6, ftToUnits(0.05), 20);
  const tempDial = new THREE.Mesh(tempDialGeom, dialMat);
  tempDial.rotation.x = Math.PI / 2;
  tempDial.position.set(-w * 0.05, h - panelHeight / 2, l / 2 + ftToUnits(0.025));
  group.add(tempDial);

  // Start/pause button
  const buttonRadius = Math.min(w, l) * 0.05;
  const buttonGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, ftToUnits(0.03), 16);
  const buttonMat = createMaterial(0x2288DD, { metalness: 0.3, roughness: 0.5 }); // Blue button
  const startButton = new THREE.Mesh(buttonGeom, buttonMat);
  startButton.rotation.x = Math.PI / 2;
  startButton.position.set(w * 0.3, h - panelHeight / 2, l / 2 + ftToUnits(0.02));
  group.add(startButton);

  // Front door - circular drum door
  const doorCenterY = h * 0.45;
  const doorRadius = Math.min(w, l) * 0.4;

  // Door outer ring
  const doorRingGeom = new THREE.TorusGeometry(doorRadius, doorRadius * 0.1, 16, 32);
  const doorRing = new THREE.Mesh(doorRingGeom, doorRingMat);
  doorRing.rotation.x = Math.PI / 2;
  doorRing.position.set(0, doorCenterY, l / 2 + ftToUnits(0.02));
  group.add(doorRing);

  // Door glass
  const glassGeom = new THREE.CircleGeometry(doorRadius * 0.9, 32);
  const glass = new THREE.Mesh(glassGeom, glassMat);
  glass.position.set(0, doorCenterY, l / 2 + ftToUnits(0.03));
  group.add(glass);

  // Drum interior
  const drumGeom = new THREE.CylinderGeometry(doorRadius * 0.75, doorRadius * 0.75, l * 0.5, 24, 1, true);
  const drum = new THREE.Mesh(drumGeom, drumMat);
  drum.rotation.x = Math.PI / 2;
  drum.position.set(0, doorCenterY, 0);
  group.add(drum);

  // Door handle
  const handleLength = doorRadius * 0.5;
  const handleGeom = new THREE.BoxGeometry(ftToUnits(0.08), handleLength, ftToUnits(0.06));
  const handleMat = createMaterial(0x909090, { metalness: 0.6, roughness: 0.3 });
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(doorRadius * 0.7, doorCenterY, l / 2 + ftToUnits(0.06));
  group.add(handle);

  // Detergent drawer at top left
  const drawerGeom = new THREE.BoxGeometry(w * 0.25, h * 0.06, ftToUnits(0.15));
  const drawer = new THREE.Mesh(drawerGeom, bodyMat);
  drawer.position.set(-w * 0.3, h * 0.88, l / 2 + ftToUnits(0.08));
  group.add(drawer);

  // Feet
  const footRadius = ftToUnits(0.05);
  const footHeight = ftToUnits(0.06);
  const footGeom = new THREE.CylinderGeometry(footRadius, footRadius * 0.8, footHeight, 12);
  const footMat = createMaterial(0x1A1A1A, { roughness: 0.9 });
  const footPositions = [
    { x: -w * 0.4, z: -l * 0.4 },
    { x: w * 0.4, z: -l * 0.4 },
    { x: -w * 0.4, z: l * 0.4 },
    { x: w * 0.4, z: l * 0.4 },
  ];
  footPositions.forEach(pos => {
    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(pos.x, footHeight / 2, pos.z);
    group.add(foot);
  });

  return group;
}


