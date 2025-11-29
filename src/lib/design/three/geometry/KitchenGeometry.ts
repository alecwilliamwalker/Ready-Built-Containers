/**
 * Kitchen/Galley Fixtures - Refrigerator, Range, Sink, Cabinets, Dishwasher
 */

import * as THREE from "three";
import { ftToUnits } from "../constants";
import { FIXTURE_MATERIALS, createMaterial } from "./materials";

/**
 * Create a refrigerator - tall box with door line
 */
export function createRefrigeratorGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(6); // Standard fridge height

  const bodyMat = createMaterial(FIXTURE_MATERIALS.APPLIANCE_DARK, {
    metalness: 0.3,
    roughness: 0.6,
  });
  const handleMat = createMaterial(0xA0A0A0, { metalness: 0.8, roughness: 0.2 });

  // Main body
  const bodyGeom = new THREE.BoxGeometry(w, h, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Door seam line (freezer/fridge division)
  const seamGeom = new THREE.BoxGeometry(w * 0.95, 0.01, 0.01);
  const seamMat = createMaterial(0x1A1A1A);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.position.set(0, h * 0.7, l / 2 + 0.01);
  group.add(seam);

  // Handle (vertical bar)
  const handleGeom = new THREE.BoxGeometry(0.02, h * 0.3, 0.03);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(w * 0.4, h * 0.5, l / 2 + 0.02);
  group.add(handle);

  return group;
}

/**
 * Create a range/stove - box with burners
 */
export function createRangeGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3); // Counter height

  const bodyMat = createMaterial(FIXTURE_MATERIALS.APPLIANCE_STAINLESS, {
    metalness: 0.5,
    roughness: 0.4,
  });
  const burnerMat = createMaterial(0x1A1A1A, { roughness: 0.9 });
  const grateMat = createMaterial(0x2A2A2A, { metalness: 0.7 });

  // Main body
  const bodyGeom = new THREE.BoxGeometry(w, h, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Cooktop surface
  const topGeom = new THREE.BoxGeometry(w * 0.95, 0.02, l * 0.7);
  const topMat = createMaterial(0x1A1A1A, { roughness: 0.8 });
  const top = new THREE.Mesh(topGeom, topMat);
  top.position.set(0, h + 0.01, l * 0.1);
  group.add(top);

  // 4 Burners
  const burnerRadius = Math.min(w, l) * 0.15;
  const burnerPositions = [
    { x: -w * 0.22, z: l * 0.22 },
    { x: w * 0.22, z: l * 0.22 },
    { x: -w * 0.22, z: -l * 0.08 },
    { x: w * 0.22, z: -l * 0.08 },
  ];

  burnerPositions.forEach(pos => {
    // Burner ring
    const burnerGeom = new THREE.TorusGeometry(burnerRadius, 0.015, 8, 24);
    const burner = new THREE.Mesh(burnerGeom, burnerMat);
    burner.rotation.x = Math.PI / 2;
    burner.position.set(pos.x, h + 0.03, pos.z);
    group.add(burner);

    // Grate
    const grateGeom = new THREE.TorusGeometry(burnerRadius * 0.8, 0.008, 4, 4);
    const grate = new THREE.Mesh(grateGeom, grateMat);
    grate.rotation.x = Math.PI / 2;
    grate.position.set(pos.x, h + 0.05, pos.z);
    group.add(grate);
  });

  // Control panel (back strip)
  const panelGeom = new THREE.BoxGeometry(w * 0.9, ftToUnits(0.5), 0.05);
  const panel = new THREE.Mesh(panelGeom, bodyMat);
  panel.position.set(0, h + ftToUnits(0.25), -l * 0.4);
  group.add(panel);

  return group;
}

/**
 * Create a sink base cabinet - cabinet with countertop and sink
 */
export function createSinkCabinetGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3); // Counter height
  const counterThickness = ftToUnits(0.1);

  const cabinetMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);
  const counterMat = createMaterial(FIXTURE_MATERIALS.COUNTERTOP, { roughness: 0.4 });
  const sinkMat = createMaterial(FIXTURE_MATERIALS.APPLIANCE_STAINLESS, {
    metalness: 0.8,
    roughness: 0.2,
  });

  // Cabinet
  const cabinetGeom = new THREE.BoxGeometry(w, h - counterThickness, l * 0.9);
  const cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
  cabinet.position.set(0, (h - counterThickness) / 2, -l * 0.05);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  // Countertop
  const counterGeom = new THREE.BoxGeometry(w, counterThickness, l);
  const counter = new THREE.Mesh(counterGeom, counterMat);
  counter.position.set(0, h - counterThickness / 2, 0);
  counter.castShadow = true;
  group.add(counter);

  // Sink basin (rectangular stainless)
  const sinkW = w * 0.6;
  const sinkL = l * 0.5;
  const sinkD = ftToUnits(0.5);
  const sinkGeom = new THREE.BoxGeometry(sinkW, sinkD, sinkL);
  const sink = new THREE.Mesh(sinkGeom, sinkMat);
  sink.position.set(0, h - sinkD / 2 - counterThickness, l * 0.1);
  group.add(sink);

  // Faucet
  const faucetMat = createMaterial(0xC0C0C0, { metalness: 0.9, roughness: 0.1 });
  const faucetGeom = new THREE.CylinderGeometry(0.015, 0.02, ftToUnits(0.6), 8);
  const faucet = new THREE.Mesh(faucetGeom, faucetMat);
  faucet.position.set(0, h + ftToUnits(0.3), -l * 0.3);
  group.add(faucet);

  return group;
}

/**
 * Create a base cabinet run - simple cabinet box
 */
export function createBaseCabinetGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(3); // Counter height
  const counterThickness = ftToUnits(0.1);

  const cabinetMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);
  const counterMat = createMaterial(FIXTURE_MATERIALS.COUNTERTOP, { roughness: 0.4 });

  // Cabinet
  const cabinetGeom = new THREE.BoxGeometry(w, h - counterThickness, l * 0.95);
  const cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
  cabinet.position.set(0, (h - counterThickness) / 2, 0);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  // Door seam line (flush with front)
  const seamGeom = new THREE.BoxGeometry(0.01, h * 0.7, 0.01);
  const seamMat = createMaterial(0x5A3A1A);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.position.set(0, h * 0.4, l / 2 - 0.005);
  group.add(seam);

  // Countertop (no overhang - stays within footprint)
  const counterGeom = new THREE.BoxGeometry(w, counterThickness, l);
  const counter = new THREE.Mesh(counterGeom, counterMat);
  counter.position.set(0, h - counterThickness / 2, 0);
  counter.castShadow = true;
  group.add(counter);

  // Handle (flush with front face)
  const handleMat = createMaterial(0x8A8A8A, { metalness: 0.8 });
  const handleGeom = new THREE.BoxGeometry(w * 0.15, 0.02, 0.02);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(0, h * 0.55, l / 2 - 0.01);
  group.add(handle);

  return group;
}

/**
 * Create an upper cabinet - wall-mounted cabinet
 */
export function createUpperCabinetGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(2.5); // Upper cabinet height
  const mountHeight = ftToUnits(4.5); // Height from floor to bottom of cabinet

  const cabinetMat = createMaterial(FIXTURE_MATERIALS.WOOD_CABINET);

  // Cabinet box
  const cabinetGeom = new THREE.BoxGeometry(w, h, l);
  const cabinet = new THREE.Mesh(cabinetGeom, cabinetMat);
  cabinet.position.set(0, mountHeight + h / 2, 0);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  group.add(cabinet);

  // Door seam (flush with front)
  const seamGeom = new THREE.BoxGeometry(0.01, h * 0.8, 0.01);
  const seamMat = createMaterial(0x5A3A1A);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.position.set(0, mountHeight + h / 2, l / 2 - 0.005);
  group.add(seam);

  // Handle (flush with front face)
  const handleMat = createMaterial(0x8A8A8A, { metalness: 0.8 });
  const handleGeom = new THREE.BoxGeometry(w * 0.15, 0.02, 0.02);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(0, mountHeight + h * 0.3, l / 2 - 0.01);
  group.add(handle);

  return group;
}

/**
 * Create a dishwasher - under-counter appliance with control panel
 */
export function createDishwasherGeometry(
  widthFt: number,
  lengthFt: number,
  _heightFt: number
): THREE.Group {
  const group = new THREE.Group();

  const w = ftToUnits(widthFt);
  const l = ftToUnits(lengthFt);
  const h = ftToUnits(2.8); // Under counter height

  // Materials
  const bodyMat = createMaterial(0x404040, { // Dark stainless
    metalness: 0.6,
    roughness: 0.35,
  });
  const handleMat = createMaterial(0xB0B0B0, {
    metalness: 0.8,
    roughness: 0.2,
  });
  const controlMat = createMaterial(0x1A1A1A, {
    metalness: 0.2,
    roughness: 0.6,
  });

  // Main body
  const bodyGeom = new THREE.BoxGeometry(w, h, l);
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(0, h / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Control panel strip at top front
  const panelHeight = h * 0.08;
  const panelGeom = new THREE.BoxGeometry(w * 0.98, panelHeight, 0.02);
  const panel = new THREE.Mesh(panelGeom, controlMat);
  panel.position.set(0, h - panelHeight / 2, l / 2 + 0.01);
  group.add(panel);

  // Control buttons/indicators
  const buttonCount = 4;
  const buttonSpacing = w * 0.18;
  const buttonGeom = new THREE.CircleGeometry(w * 0.02, 12);
  const buttonMat = createMaterial(0x3B82F6);
  
  for (let i = 0; i < buttonCount; i++) {
    const btn = new THREE.Mesh(buttonGeom, buttonMat);
    btn.rotation.y = Math.PI;
    btn.rotation.x = Math.PI;
    const xPos = (i - (buttonCount - 1) / 2) * buttonSpacing;
    btn.position.set(xPos, h - panelHeight * 0.5, l / 2 + 0.02);
    group.add(btn);
  }

  // Door handle (horizontal bar)
  const handleWidth = w * 0.85;
  const handleGeom = new THREE.BoxGeometry(handleWidth, 0.02, 0.03);
  const handle = new THREE.Mesh(handleGeom, handleMat);
  handle.position.set(0, h * 0.75, l / 2 + 0.025);
  group.add(handle);

  // Handle mounting brackets
  const bracketGeom = new THREE.BoxGeometry(0.02, 0.04, 0.02);
  const bracketL = new THREE.Mesh(bracketGeom, handleMat);
  bracketL.position.set(-handleWidth / 2 + 0.02, h * 0.75, l / 2 + 0.015);
  group.add(bracketL);
  
  const bracketR = new THREE.Mesh(bracketGeom, handleMat);
  bracketR.position.set(handleWidth / 2 - 0.02, h * 0.75, l / 2 + 0.015);
  group.add(bracketR);

  // Door seam line
  const seamGeom = new THREE.BoxGeometry(w * 0.95, 0.005, 0.005);
  const seamMat = createMaterial(0x2A2A2A);
  const seam = new THREE.Mesh(seamGeom, seamMat);
  seam.position.set(0, h * 0.1, l / 2 + 0.01);
  group.add(seam);

  return group;
}

