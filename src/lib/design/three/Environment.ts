/**
 * Environment - Creates immersive forest environment around the container
 * Includes sky dome, ground terrain, and procedural trees
 */

import * as THREE from "three";
import { ENVIRONMENT_COLORS, ENVIRONMENT_SETTINGS, ftToUnits } from "./constants";

/**
 * Creates a gradient sky dome
 */
export function createSkyDome(): THREE.Mesh {
  const radius = ENVIRONMENT_SETTINGS.SKY_RADIUS;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  
  // Create gradient material using vertex colors
  const vertexCount = geometry.attributes.position.count;
  const colors = new Float32Array(vertexCount * 3);
  
  const topColor = new THREE.Color(ENVIRONMENT_COLORS.SKY_TOP);
  const horizonColor = new THREE.Color(ENVIRONMENT_COLORS.SKY_HORIZON);
  const bottomColor = new THREE.Color(ENVIRONMENT_COLORS.SKY_BOTTOM);
  
  for (let i = 0; i < vertexCount; i++) {
    const y = geometry.attributes.position.getY(i);
    const normalizedY = (y + radius) / (2 * radius); // 0 at bottom, 1 at top
    
    let color: THREE.Color;
    if (normalizedY > 0.5) {
      // Top half: blend from horizon to top
      const t = (normalizedY - 0.5) * 2;
      color = horizonColor.clone().lerp(topColor, t);
    } else {
      // Bottom half: blend from bottom to horizon
      const t = normalizedY * 2;
      color = bottomColor.clone().lerp(horizonColor, t);
    }
    
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    side: THREE.BackSide, // Render inside of sphere
    fog: false,
  });
  
  const skyDome = new THREE.Mesh(geometry, material);
  skyDome.name = "SkyDome";
  
  return skyDome;
}

/**
 * Creates the ground plane with grass-like appearance
 * Has a rectangular cutout where the container sits to prevent z-fighting with interior floor
 */
export function createForestGround(shellLengthFt: number, shellWidthFt: number): THREE.Group {
  const group = new THREE.Group();
  group.name = "ForestGround";
  
  const radius = ENVIRONMENT_SETTINGS.GROUND_RADIUS;
  
  // Create a circular shape with a rectangular hole for the container
  const shape = new THREE.Shape();
  
  // Draw outer circle (approximated with segments)
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  // Create rectangular hole for container (slightly larger to ensure no overlap)
  // Add padding to account for walls and slight gaps
  const padding = 0.1; // Small padding to prevent z-fighting (~2.5 inches per side)
  const holeWidth = ftToUnits(shellLengthFt) + padding;
  const holeDepth = ftToUnits(shellWidthFt) + padding;
  
  const hole = new THREE.Path();
  hole.moveTo(-holeWidth / 2, -holeDepth / 2);
  hole.lineTo(holeWidth / 2, -holeDepth / 2);
  hole.lineTo(holeWidth / 2, holeDepth / 2);
  hole.lineTo(-holeWidth / 2, holeDepth / 2);
  hole.lineTo(-holeWidth / 2, -holeDepth / 2);
  shape.holes.push(hole);
  
  // Create geometry from shape
  const groundGeometry = new THREE.ShapeGeometry(shape);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: ENVIRONMENT_COLORS.GRASS_PRIMARY,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide, // Visible from both sides
  });
  
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = "GroundPlane";
  group.add(ground);
  
  // Add some darker grass patches for variation
  const patchCount = ENVIRONMENT_SETTINGS.GRASS_PATCH_COUNT;
  const patchGeometry = new THREE.CircleGeometry(3, 8);
  const patchMaterial = new THREE.MeshStandardMaterial({
    color: ENVIRONMENT_COLORS.GRASS_SECONDARY,
    roughness: 0.95,
    metalness: 0.0,
  });
  
  for (let i = 0; i < patchCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 15 + Math.random() * (radius - 20);
    
    const patch = new THREE.Mesh(patchGeometry, patchMaterial);
    patch.rotation.x = -Math.PI / 2;
    patch.position.set(
      Math.cos(angle) * distance,
      0.01, // Slightly above ground to prevent z-fighting
      Math.sin(angle) * distance
    );
    patch.scale.set(
      0.5 + Math.random() * 1.5,
      0.5 + Math.random() * 1.5,
      1
    );
    patch.receiveShadow = true;
    group.add(patch);
  }
  
  // Add dirt path/area around container
  const dirtGeometry = new THREE.PlaneGeometry(30, 15);
  const dirtMaterial = new THREE.MeshStandardMaterial({
    color: ENVIRONMENT_COLORS.DIRT,
    roughness: 0.95,
    metalness: 0.0,
  });
  const dirtPath = new THREE.Mesh(dirtGeometry, dirtMaterial);
  dirtPath.rotation.x = -Math.PI / 2;
  dirtPath.position.set(0, 0.02, 8); // In front of container
  dirtPath.receiveShadow = true;
  group.add(dirtPath);
  
  return group;
}

/**
 * Creates a single procedural pine tree
 */
function createPineTree(height: number): THREE.Group {
  const tree = new THREE.Group();
  
  // Trunk
  const trunkHeight = height * 0.3;
  const trunkRadius = height * 0.03;
  const trunkGeometry = new THREE.CylinderGeometry(
    trunkRadius * 0.7,
    trunkRadius,
    trunkHeight,
    8
  );
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: ENVIRONMENT_COLORS.TREE_TRUNK,
    roughness: 0.9,
    metalness: 0.0,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  
  // Foliage layers (3 cones stacked)
  const foliageHeight = height * 0.7;
  const layers = 3;
  const layerHeight = foliageHeight / layers;
  
  for (let i = 0; i < layers; i++) {
    const layerRadius = (height * 0.25) * (1 - i * 0.2);
    const coneHeight = layerHeight * 1.3;
    
    const coneGeometry = new THREE.ConeGeometry(layerRadius, coneHeight, 8);
    const coneMaterial = new THREE.MeshStandardMaterial({
      color: i === 1 ? ENVIRONMENT_COLORS.TREE_FOLIAGE_LIGHT : ENVIRONMENT_COLORS.TREE_FOLIAGE,
      roughness: 0.8,
      metalness: 0.0,
    });
    
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = trunkHeight + (i * layerHeight * 0.7) + coneHeight / 2;
    cone.castShadow = true;
    cone.receiveShadow = true;
    tree.add(cone);
  }
  
  return tree;
}

/**
 * Creates a forest of trees around the container
 */
export function createForest(shellLengthFt: number, shellWidthFt: number): THREE.Group {
  const forest = new THREE.Group();
  forest.name = "Forest";
  
  const shellLengthUnits = ftToUnits(shellLengthFt);
  const shellWidthUnits = ftToUnits(shellWidthFt);
  
  // Calculate safe zone around container (don't place trees too close)
  const minDistance = ENVIRONMENT_SETTINGS.TREE_MIN_DISTANCE;
  const maxDistance = ENVIRONMENT_SETTINGS.TREE_MAX_DISTANCE;
  const treeCount = ENVIRONMENT_SETTINGS.TREE_COUNT;
  
  const placedTrees: { x: number; z: number }[] = [];
  const minTreeSpacing = 5; // Minimum distance between trees
  
  for (let i = 0; i < treeCount; i++) {
    let attempts = 0;
    let placed = false;
    
    while (!placed && attempts < 20) {
      attempts++;
      
      // Random angle around container
      const angle = Math.random() * Math.PI * 2;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // Check if too close to container
      const nearContainer = 
        Math.abs(x) < shellLengthUnits / 2 + 5 &&
        Math.abs(z) < shellWidthUnits / 2 + 5;
      
      if (nearContainer) continue;
      
      // Check if too close to another tree
      let tooClose = false;
      for (const other of placedTrees) {
        const dx = x - other.x;
        const dz = z - other.z;
        if (Math.sqrt(dx * dx + dz * dz) < minTreeSpacing) {
          tooClose = true;
          break;
        }
      }
      
      if (tooClose) continue;
      
      // Place tree
      const height = ENVIRONMENT_SETTINGS.TREE_MIN_HEIGHT + 
        Math.random() * (ENVIRONMENT_SETTINGS.TREE_MAX_HEIGHT - ENVIRONMENT_SETTINGS.TREE_MIN_HEIGHT);
      
      const tree = createPineTree(height);
      tree.position.set(x, 0, z);
      tree.rotation.y = Math.random() * Math.PI * 2;
      
      forest.add(tree);
      placedTrees.push({ x, z });
      placed = true;
    }
  }
  
  return forest;
}

/**
 * Environment manager class
 */
export class EnvironmentManager {
  private scene: THREE.Scene;
  private skyDome: THREE.Mesh | null = null;
  private ground: THREE.Group | null = null;
  private forest: THREE.Group | null = null;
  private floorY: number;
  
  constructor(scene: THREE.Scene, floorY: number = 0) {
    this.scene = scene;
    this.floorY = floorY;
  }
  
  /**
   * Initialize the environment
   */
  init(shellLengthFt: number, shellWidthFt: number): void {
    // Create and add sky dome
    this.skyDome = createSkyDome();
    this.scene.add(this.skyDome);
    
    // Create and add ground (with hole for container)
    this.ground = createForestGround(shellLengthFt, shellWidthFt);
    this.ground.position.y = this.floorY;
    this.scene.add(this.ground);
    
    // Create and add forest
    this.forest = createForest(shellLengthFt, shellWidthFt);
    this.forest.position.y = this.floorY;
    this.scene.add(this.forest);
  }
  
  /**
   * Update floor level (when shell height changes)
   */
  updateFloorLevel(floorY: number): void {
    this.floorY = floorY;
    if (this.ground) {
      this.ground.position.y = floorY;
    }
    if (this.forest) {
      this.forest.position.y = floorY;
    }
  }
  
  /**
   * Toggle environment visibility
   */
  setVisible(visible: boolean): void {
    if (this.skyDome) this.skyDome.visible = visible;
    if (this.ground) this.ground.visible = visible;
    if (this.forest) this.forest.visible = visible;
  }
  
  /**
   * Dispose all environment objects
   */
  dispose(): void {
    const disposeObject = (obj: THREE.Object3D) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            (child.material as THREE.Material)?.dispose();
          }
        }
      });
    };
    
    if (this.skyDome) {
      this.scene.remove(this.skyDome);
      disposeObject(this.skyDome);
      this.skyDome = null;
    }
    
    if (this.ground) {
      this.scene.remove(this.ground);
      disposeObject(this.ground);
      this.ground = null;
    }
    
    if (this.forest) {
      this.scene.remove(this.forest);
      disposeObject(this.forest);
      this.forest = null;
    }
  }
}

