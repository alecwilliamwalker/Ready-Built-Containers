/**
 * FloorPlaneDragController - Enables intuitive floor-plane dragging of fixtures
 * Replaces complex TransformControls gizmo with direct drag-on-floor interaction
 */

import * as THREE from "three";
import {
  COLORS,
  INTERACTION_SETTINGS,
  ftToUnits,
  unitsToFt,
} from "./constants";

export type DragState = {
  isDragging: boolean;
  fixtureId: string | null;
  startPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  offset: THREE.Vector3;
};

export type FloorPlaneDragCallbacks = {
  onDragStart?: (fixtureId: string) => void;
  onDragMove?: (fixtureId: string, positionFt: { x: number; y: number }) => void;
  onDragEnd?: (fixtureId: string, positionFt: { x: number; y: number }) => void;
  canDrag?: (fixtureId: string) => boolean;
};

/**
 * Floor plane drag controller for intuitive fixture positioning
 */
export class FloorPlaneDragController {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private moduleGroup: THREE.Group;
  private floorY: number;
  
  // Drag state
  private dragState: DragState = {
    isDragging: false,
    fixtureId: null,
    startPosition: new THREE.Vector3(),
    currentPosition: new THREE.Vector3(),
    offset: new THREE.Vector3(),
  };
  
  // Shell bounds for clamping
  private shellBounds: { lengthFt: number; widthFt: number };
  
  // Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  
  // Visual helpers
  private snapGridGroup: THREE.Group;
  private snapPoints: THREE.Points | null = null;
  private draggedObject: THREE.Object3D | null = null;
  
  // Current fixture dimensions for clamping (in feet)
  private draggedFixtureSizeFt: { widthFt: number; lengthFt: number } = { widthFt: 0, lengthFt: 0 };
  // Footprint anchor for proper clamping ("center" or "front-left")
  private draggedFixtureAnchor: string = "center";
  
  // Callbacks
  private callbacks: FloorPlaneDragCallbacks = {};
  
  // Snap settings
  private snapEnabled = true;
  private snapIncrementFt: number = INTERACTION_SETTINGS.SNAP_INCREMENT_FT;

  // Bound event handlers
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    moduleGroup: THREE.Group,
    scene: THREE.Scene,
    shellBounds: { lengthFt: number; widthFt: number; heightFt: number }
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.moduleGroup = moduleGroup;
    this.shellBounds = shellBounds;
    
    // Floor is at -heightFt/2 in scene units
    this.floorY = -ftToUnits(shellBounds.heightFt) / 2;
    this.floorPlane.constant = -this.floorY;
    
    // Create snap grid group (hidden by default)
    this.snapGridGroup = new THREE.Group();
    this.snapGridGroup.name = "SnapGrid";
    this.snapGridGroup.visible = false;
    scene.add(this.snapGridGroup);
    
    // Create snap points visualization
    this.createSnapPoints();
    
    // Bind event handlers
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    
    // Add event listeners
    this.domElement.addEventListener("pointerdown", this.boundPointerDown);
    this.domElement.addEventListener("pointermove", this.boundPointerMove);
    this.domElement.addEventListener("pointerup", this.boundPointerUp);
  }

  /**
   * Set callbacks for drag events
   */
  setCallbacks(callbacks: FloorPlaneDragCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Update shell bounds (when container size changes)
   */
  updateBounds(shellBounds: { lengthFt: number; widthFt: number; heightFt: number }): void {
    this.shellBounds = shellBounds;
    this.floorY = -ftToUnits(shellBounds.heightFt) / 2;
    this.floorPlane.constant = -this.floorY;
    
    // Recreate snap points for new bounds
    this.createSnapPoints();
  }

  /**
   * Check if currently dragging
   */
  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  /**
   * Get the currently dragged fixture ID
   */
  getDraggedFixtureId(): string | null {
    return this.dragState.fixtureId;
  }

  /**
   * Enable/disable snap-to-grid
   */
  setSnapEnabled(enabled: boolean): void {
    this.snapEnabled = enabled;
  }

  /**
   * Set snap increment in feet
   */
  setSnapIncrement(ft: number): void {
    this.snapIncrementFt = ft;
    this.createSnapPoints();
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.domElement.removeEventListener("pointerdown", this.boundPointerDown);
    this.domElement.removeEventListener("pointermove", this.boundPointerMove);
    this.domElement.removeEventListener("pointerup", this.boundPointerUp);
    
    // Dispose snap points
    if (this.snapPoints) {
      this.snapPoints.geometry.dispose();
      (this.snapPoints.material as THREE.Material).dispose();
    }
    
    this.snapGridGroup.parent?.remove(this.snapGridGroup);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private createSnapPoints(): void {
    // Remove old points
    if (this.snapPoints) {
      this.snapGridGroup.remove(this.snapPoints);
      this.snapPoints.geometry.dispose();
      (this.snapPoints.material as THREE.Material).dispose();
    }

    const { lengthFt, widthFt } = this.shellBounds;
    const increment = this.snapIncrementFt;
    const positions: number[] = [];

    // Create grid of snap points within shell bounds
    const lengthUnits = ftToUnits(lengthFt);
    const widthUnits = ftToUnits(widthFt);
    const incrementUnits = ftToUnits(increment);

    for (let x = 0; x <= lengthFt; x += increment) {
      for (let z = 0; z <= widthFt; z += increment) {
        // Convert from 2D coords (origin at bottom-left) to 3D coords (origin at center)
        const xPos = -lengthUnits / 2 + ftToUnits(x);
        const zPos = -widthUnits / 2 + ftToUnits(z);
        positions.push(xPos, this.floorY + 0.01, zPos);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: COLORS.SNAP_POINT_COLOR,
      size: INTERACTION_SETTINGS.SNAP_POINT_SIZE,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    this.snapPoints = new THREE.Points(geometry, material);
    this.snapGridGroup.add(this.snapPoints);
  }

  private updateMousePosition(event: PointerEvent): void {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getFloorIntersection(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersection = new THREE.Vector3();
    const result = this.raycaster.ray.intersectPlane(this.floorPlane, intersection);
    return result ? intersection : null;
  }

  private getFixtureAtMouse(): { object: THREE.Object3D; fixtureId: string } | null {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.moduleGroup.children, true);

    // Prefer non-wall fixtures over walls for better selection UX
    let wallTarget: { object: THREE.Object3D; fixtureId: string } | null = null;

    for (const intersect of intersects) {
      // Walk up to find the fixture group
      let target = intersect.object;
      while (target.parent && target.parent !== this.moduleGroup) {
        target = target.parent;
      }

      if (target.userData.fixtureId) {
        // If not a wall, return it immediately
        if (!target.userData.isWall) {
          return { object: target, fixtureId: target.userData.fixtureId };
        }
        // Remember first wall as fallback
        if (!wallTarget) {
          wallTarget = { object: target, fixtureId: target.userData.fixtureId };
        }
      }
    }

    // Return wall if no other fixture found
    return wallTarget;
  }

  private sceneToFloorFt(position: THREE.Vector3): { x: number; y: number } {
    const { lengthFt, widthFt } = this.shellBounds;
    const lengthUnits = ftToUnits(lengthFt);
    const widthUnits = ftToUnits(widthFt);

    // Convert from 3D scene coords to 2D floor coords (feet)
    const xFt = unitsToFt(position.x + lengthUnits / 2);
    const yFt = unitsToFt(position.z + widthUnits / 2);

    return { x: xFt, y: yFt };
  }

  private snapToGrid(valueFt: number): number {
    if (!this.snapEnabled) return valueFt;
    return Math.round(valueFt / this.snapIncrementFt) * this.snapIncrementFt;
  }

  private clampToShell(centerXFt: number, centerYFt: number): { x: number; y: number } {
    const { lengthFt, widthFt } = this.shellBounds;
    const { widthFt: fixtureW, lengthFt: fixtureL } = this.draggedFixtureSizeFt;
    
    // Input is always the CENTER position
    // Clamp the center so that the fixture edges stay within bounds
    const halfX = fixtureW / 2;
    const halfZ = fixtureL / 2;
    
    return {
      x: Math.max(halfX, Math.min(lengthFt - halfX, centerXFt)),
      y: Math.max(halfZ, Math.min(widthFt - halfZ, centerYFt)),
    };
  }

  private handlePointerDown(event: PointerEvent): void {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    this.updateMousePosition(event);
    const hit = this.getFixtureAtMouse();

    if (hit) {
      // Check if fixture can be dragged (e.g., not locked)
      if (this.callbacks.canDrag && !this.callbacks.canDrag(hit.fixtureId)) {
        return;
      }

      const floorPos = this.getFloorIntersection();
      if (!floorPos) return;

      // Calculate offset from click point to object center
      this.dragState.offset.copy(floorPos).sub(hit.object.position);
      this.dragState.offset.y = 0; // Keep on floor plane

      this.dragState.isDragging = true;
      this.dragState.fixtureId = hit.fixtureId;
      this.dragState.startPosition.copy(hit.object.position);
      this.dragState.currentPosition.copy(hit.object.position);
      this.draggedObject = hit.object;

      // Get fixture footprint dimensions and anchor from userData (set by FixtureRenderer)
      // This uses the actual catalog footprint, not the visual bounding box
      const userData = hit.object.userData as { 
        footprintWidthFt?: number; 
        footprintLengthFt?: number;
        footprintAnchor?: string;
      };
      const baseWidth = userData.footprintWidthFt ?? 1;
      const baseLength = userData.footprintLengthFt ?? 1;
      this.draggedFixtureAnchor = userData.footprintAnchor ?? "center";
      
      // Check if fixture is rotated 90 or 270 degrees - if so, swap width/length
      // Rotation is stored in radians, so 90° = π/2, 270° = 3π/2
      const rotationDeg = Math.round(THREE.MathUtils.radToDeg(-hit.object.rotation.y)) % 360;
      const isRotated90or270 = rotationDeg === 90 || rotationDeg === 270 || 
                               rotationDeg === -90 || rotationDeg === -270;
      
      this.draggedFixtureSizeFt = isRotated90or270
        ? { widthFt: baseLength, lengthFt: baseWidth }  // Swap dimensions
        : { widthFt: baseWidth, lengthFt: baseLength }; // Keep as-is

      // Show snap grid
      this.snapGridGroup.visible = true;

      // Change cursor
      this.domElement.style.cursor = "grabbing";

      // Notify callback
      this.callbacks.onDragStart?.(hit.fixtureId);

      // Prevent orbit controls from activating
      event.stopPropagation();
    }
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.dragState.isDragging || !this.draggedObject) return;

    this.updateMousePosition(event);
    const floorPos = this.getFloorIntersection();
    if (!floorPos) return;

    // Calculate new position (accounting for drag offset)
    const newPos = floorPos.clone().sub(this.dragState.offset);
    newPos.y = this.dragState.startPosition.y; // Keep at original Y

    // Convert to feet (this is the CENTER position in feet)
    const centerFt = this.sceneToFloorFt(newPos);
    
    // For non-center anchor fixtures, snap the ANCHOR position (corner), not the center
    // This prevents drift when reducer snaps the anchor again
    const { widthFt, lengthFt } = this.draggedFixtureSizeFt;
    let snappedCenterFt: { x: number; y: number };
    
    if (this.draggedFixtureAnchor === "center") {
      // Center anchor: snap the center directly
      snappedCenterFt = {
        x: this.snapToGrid(centerFt.x),
        y: this.snapToGrid(centerFt.y),
      };
    } else {
      // Front-left/back-left anchor: convert to anchor, snap anchor, convert back to center
      const anchorX = centerFt.x - widthFt / 2;
      const anchorY = centerFt.y - lengthFt / 2;
      const snappedAnchorX = this.snapToGrid(anchorX);
      const snappedAnchorY = this.snapToGrid(anchorY);
      snappedCenterFt = {
        x: snappedAnchorX + widthFt / 2,
        y: snappedAnchorY + lengthFt / 2,
      };
    }
    
    const clampedCenterFt = this.clampToShell(snappedCenterFt.x, snappedCenterFt.y);

    // Convert back to scene coordinates for visual feedback
    const { lengthFt: shellLengthFt, widthFt: shellWidthFt } = this.shellBounds;
    const lengthUnits = ftToUnits(shellLengthFt);
    const widthUnits = ftToUnits(shellWidthFt);

    this.draggedObject.position.x = -lengthUnits / 2 + ftToUnits(clampedCenterFt.x);
    this.draggedObject.position.z = -widthUnits / 2 + ftToUnits(clampedCenterFt.y);

    this.dragState.currentPosition.copy(this.draggedObject.position);

    // Notify callback with CENTER position (editor-reducer will handle anchor conversion)
    this.callbacks.onDragMove?.(this.dragState.fixtureId!, clampedCenterFt);

    event.stopPropagation();
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.dragState.isDragging) return;

    const fixtureId = this.dragState.fixtureId!;
    const centerFt = this.sceneToFloorFt(this.dragState.currentPosition);
    
    // For non-center anchor fixtures, snap the ANCHOR position (corner), not the center
    // This prevents drift when reducer snaps the anchor again
    const { widthFt, lengthFt } = this.draggedFixtureSizeFt;
    let snappedCenterFt: { x: number; y: number };
    
    if (this.draggedFixtureAnchor === "center") {
      // Center anchor: snap the center directly
      snappedCenterFt = {
        x: this.snapToGrid(centerFt.x),
        y: this.snapToGrid(centerFt.y),
      };
    } else {
      // Front-left/back-left anchor: convert to anchor, snap anchor, convert back to center
      const anchorX = centerFt.x - widthFt / 2;
      const anchorY = centerFt.y - lengthFt / 2;
      const snappedAnchorX = this.snapToGrid(anchorX);
      const snappedAnchorY = this.snapToGrid(anchorY);
      snappedCenterFt = {
        x: snappedAnchorX + widthFt / 2,
        y: snappedAnchorY + lengthFt / 2,
      };
    }
    
    const clampedCenterFt = this.clampToShell(snappedCenterFt.x, snappedCenterFt.y);

    // Hide snap grid
    this.snapGridGroup.visible = false;

    // Reset cursor
    this.domElement.style.cursor = "";

    // Reset drag state
    this.dragState.isDragging = false;
    this.dragState.fixtureId = null;
    this.draggedObject = null;

    // Notify callback with CENTER position
    this.callbacks.onDragEnd?.(fixtureId, clampedCenterFt);
  }
}






