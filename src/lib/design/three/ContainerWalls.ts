/**
 * ContainerWalls - Renders solid container walls with windows
 * Creates 3 solid walls (back, left, right) with the front open for viewing
 */

import * as THREE from "three";
import { ENVIRONMENT_COLORS, ftToUnits } from "./constants";
import type { ShellConfig, FixtureConfig, ModuleCatalogItem } from "@/types/design";

export type WallSide = "front" | "back" | "left" | "right";

export type WindowOpening = {
  xFt: number;      // Position along wall
  yFt: number;      // Height from floor
  widthFt: number;
  heightFt: number;
};

/**
 * ContainerWallsRenderer manages the solid container walls
 */
export class ContainerWallsRenderer {
  private wallGroup: THREE.Group;
  private walls: Map<WallSide, THREE.Mesh> = new Map();
  private windowFrames: THREE.Group;
  private openSides: Set<WallSide> = new Set(["front"]);
  private floor: THREE.Mesh | null = null;
  
  constructor(wallGroup: THREE.Group) {
    this.wallGroup = wallGroup;
    this.windowFrames = new THREE.Group();
    this.windowFrames.name = "WindowFrames";
    this.wallGroup.add(this.windowFrames);
  }
  
  /**
   * Render container walls
   * @param openSides - Can be a single side or array of sides to leave open
   *                    Default is ["front", "right"] for good camera visibility
   */
  render(
    shell: ShellConfig,
    fixtures: FixtureConfig[],
    catalog: Record<string, ModuleCatalogItem>,
    openSides: WallSide | WallSide[] = ["front", "right"]
  ): void {
    this.clear();
    
    // Convert to Set for easy lookup
    this.openSides = new Set(Array.isArray(openSides) ? openSides : [openSides]);
    
    const lengthUnits = ftToUnits(shell.lengthFt);
    const widthUnits = ftToUnits(shell.widthFt);
    const heightUnits = ftToUnits(shell.heightFt);
    const floorY = -heightUnits / 2;
    
    // Create wood floor
    this.floor = this.createFloor(lengthUnits, widthUnits, floorY);
    this.wallGroup.add(this.floor);
    
    // Find window/door fixtures
    const windows = this.findWindowOpenings(fixtures, catalog, shell);
    
    // Create walls and window frames
    const sides: WallSide[] = ["front", "back", "left", "right"];
    
    for (const side of sides) {
      const sideWindows = windows.filter(w => w.side === side);
      
      // Only create solid wall if not an open side
      if (!this.openSides.has(side)) {
        const wall = this.createWall(side, lengthUnits, widthUnits, heightUnits, floorY, sideWindows);
        this.walls.set(side, wall);
        this.wallGroup.add(wall);
      }
      
      // Always render window frames (even on open walls)
      for (const win of sideWindows) {
        const frame = this.createWindowFrame(side, win, lengthUnits, widthUnits, heightUnits, floorY);
        this.windowFrames.add(frame);
      }
    }
  }
  
  /**
   * Clear all walls
   */
  clear(): void {
    // Clear floor
    if (this.floor) {
      this.wallGroup.remove(this.floor);
      this.floor.geometry.dispose();
      (this.floor.material as THREE.Material).dispose();
      this.floor = null;
    }
    
    this.walls.forEach((wall) => {
      this.wallGroup.remove(wall);
      wall.geometry.dispose();
      if (Array.isArray(wall.material)) {
        wall.material.forEach(m => m.dispose());
      } else {
        (wall.material as THREE.Material).dispose();
      }
    });
    this.walls.clear();
    
    // Clear window frames
    this.windowFrames.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          (child.material as THREE.Material)?.dispose();
        }
      }
    });
    this.windowFrames.clear();
  }
  
  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clear();
  }
  
  /**
   * Find door openings from fixtures (for wall cutouts)
   * Note: Windows are now rendered as floating fixtures and are not attached to walls
   */
  private findWindowOpenings(
    _fixtures: FixtureConfig[],
    _catalog: Record<string, ModuleCatalogItem>,
    _shell: ShellConfig
  ): Array<WindowOpening & { side: WallSide }> {
    // Windows are now floating fixtures - they no longer auto-attach to walls
    // This function now returns empty array since windows render their own geometry
    // Door openings could be added here in the future if needed
    return [];
  }
  
  /**
   * Create a wall with optional window cutouts
   */
  private createWall(
    side: WallSide,
    lengthUnits: number,
    widthUnits: number,
    heightUnits: number,
    floorY: number,
    windows: WindowOpening[]
  ): THREE.Mesh {
    const wallThickness = 0.1;
    
    // Determine wall dimensions based on side
    let wallWidth: number;
    let wallDepth: number;
    let position: THREE.Vector3;
    let rotation: number = 0;
    
    switch (side) {
      case "front":
        wallWidth = lengthUnits;
        wallDepth = wallThickness;
        position = new THREE.Vector3(0, floorY + heightUnits / 2, widthUnits / 2);
        break;
      case "back":
        wallWidth = lengthUnits;
        wallDepth = wallThickness;
        position = new THREE.Vector3(0, floorY + heightUnits / 2, -widthUnits / 2);
        break;
      case "left":
        wallWidth = widthUnits;
        wallDepth = wallThickness;
        position = new THREE.Vector3(-lengthUnits / 2, floorY + heightUnits / 2, 0);
        rotation = Math.PI / 2;
        break;
      case "right":
        wallWidth = widthUnits;
        wallDepth = wallThickness;
        position = new THREE.Vector3(lengthUnits / 2, floorY + heightUnits / 2, 0);
        rotation = Math.PI / 2;
        break;
    }
    
    // Create wall geometry (simple box for now, could add window cutouts via CSG later)
    const geometry = new THREE.BoxGeometry(wallWidth, heightUnits, wallDepth);
    
    // Create corrugated metal material for exterior
    const exteriorMaterial = new THREE.MeshStandardMaterial({
      color: ENVIRONMENT_COLORS.CONTAINER_EXTERIOR,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.FrontSide,
    });
    
    // Create interior drywall material
    // Use FrontSide so interior faces are visible when camera faces the normal direction (from inside)
    const interiorMaterial = new THREE.MeshStandardMaterial({
      color: ENVIRONMENT_COLORS.CONTAINER_INTERIOR,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.FrontSide,
    });
    
    // Determine material array based on wall side
    // After rotation/positioning, the interior-facing surface varies by wall:
    // - Front wall (no rotation): local -Z face points inward
    // - Back wall (no rotation): local +Z face points inward
    // - Left wall (90° rotation): local +Z face points inward after rotation
    // - Right wall (90° rotation): local -Z face points inward after rotation
    const materials: THREE.Material[] = (side === "back" || side === "left")
      ? [
          exteriorMaterial, // right
          exteriorMaterial, // left
          exteriorMaterial, // top
          exteriorMaterial, // bottom
          interiorMaterial, // front (+Z) - interior facing for back/left walls
          exteriorMaterial, // back (-Z)
        ]
      : [
          exteriorMaterial, // right
          exteriorMaterial, // left
          exteriorMaterial, // top
          exteriorMaterial, // bottom
          exteriorMaterial, // front (+Z)
          interiorMaterial, // back (-Z) - interior facing for front/right walls
        ];
    
    const wall = new THREE.Mesh(geometry, materials);
    wall.position.copy(position);
    wall.rotation.y = rotation;
    wall.castShadow = true;
    wall.receiveShadow = true;
    wall.name = `Wall_${side}`;
    
    return wall;
  }
  
  /**
   * Create a wood floor for the container interior
   */
  private createFloor(
    lengthUnits: number,
    widthUnits: number,
    floorY: number
  ): THREE.Mesh {
    // Create floor geometry as a thin box
    // BoxGeometry(width, height, depth) = (X, Y, Z)
    const floorThickness = 0.05;
    const geometry = new THREE.BoxGeometry(lengthUnits, floorThickness, widthUnits);
    
    // Wood floor material - warm oak color with plank-like appearance
    const material = new THREE.MeshStandardMaterial({
      color: 0xB8956C, // Warm oak wood color
      roughness: 0.7,
      metalness: 0.0,
    });
    
    const floor = new THREE.Mesh(geometry, material);
    // Position at floor level - environment ground has a hole here so no z-fighting
    floor.position.set(0, floorY + floorThickness / 2, 0);
    floor.receiveShadow = true;
    floor.name = "ContainerFloor";
    
    return floor;
  }
  
  /**
   * Create a window frame with glass
   */
  private createWindowFrame(
    side: WallSide,
    opening: WindowOpening,
    lengthUnits: number,
    widthUnits: number,
    heightUnits: number,
    floorY: number
  ): THREE.Group {
    const frame = new THREE.Group();
    frame.name = `WindowFrame_${side}`;
    
    const frameWidth = ftToUnits(opening.widthFt);
    const frameHeight = ftToUnits(opening.heightFt);
    const frameDepth = 0.15;
    const frameThickness = 0.05;
    
    // Calculate position based on wall side
    let x: number, y: number, z: number;
    let rotationY = 0;
    
    const posAlongWall = ftToUnits(opening.xFt);
    const posHeight = floorY + ftToUnits(opening.yFt) + frameHeight / 2;
    
    switch (side) {
      case "front":
        x = -lengthUnits / 2 + posAlongWall + frameWidth / 2;
        y = posHeight;
        z = widthUnits / 2;
        break;
      case "back":
        x = -lengthUnits / 2 + posAlongWall + frameWidth / 2;
        y = posHeight;
        z = -widthUnits / 2;
        break;
      case "left":
        x = -lengthUnits / 2;
        y = posHeight;
        z = -widthUnits / 2 + posAlongWall + frameWidth / 2;
        rotationY = Math.PI / 2;
        break;
      case "right":
        x = lengthUnits / 2;
        y = posHeight;
        z = -widthUnits / 2 + posAlongWall + frameWidth / 2;
        rotationY = Math.PI / 2;
        break;
    }
    
    frame.position.set(x, y, z);
    frame.rotation.y = rotationY;
    
    // Frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: ENVIRONMENT_COLORS.WINDOW_FRAME,
      roughness: 0.5,
      metalness: 0.0,
    });
    
    // Glass material
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: ENVIRONMENT_COLORS.WINDOW_GLASS,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    
    // Create frame pieces (4 sides)
    // Top
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, frameThickness, frameDepth),
      frameMaterial
    );
    topFrame.position.y = frameHeight / 2 - frameThickness / 2;
    frame.add(topFrame);
    
    // Bottom
    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth, frameThickness, frameDepth),
      frameMaterial
    );
    bottomFrame.position.y = -frameHeight / 2 + frameThickness / 2;
    frame.add(bottomFrame);
    
    // Left
    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, frameDepth),
      frameMaterial
    );
    leftFrame.position.x = -frameWidth / 2 + frameThickness / 2;
    frame.add(leftFrame);
    
    // Right
    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, frameHeight, frameDepth),
      frameMaterial
    );
    rightFrame.position.x = frameWidth / 2 - frameThickness / 2;
    frame.add(rightFrame);
    
    // Glass pane
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(frameWidth - frameThickness * 2, frameHeight - frameThickness * 2),
      glassMaterial
    );
    frame.add(glass);
    
    return frame;
  }
  
  /**
   * Set which side is open (for camera viewing)
   */
  setOpenSide(side: WallSide): void {
    if (side !== this.openSide) {
      // Would need to re-render walls
      // For now, this requires calling render() again
    }
  }
}

