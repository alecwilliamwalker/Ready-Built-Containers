/**
 * ZoneWallRenderer - DEPRECATED
 * 
 * Interior walls are now placeable fixtures (fixture-wall).
 * Users add and position walls manually through the fixture system.
 * This renderer is kept for API compatibility but does not render anything.
 */

import * as THREE from "three";
import type { ZoneConfig } from "@/types/design";
import { ftToUnits, ZONE_WALL_SETTINGS } from "./constants";

type WallSegment = {
  startX: number;  // In feet
  startY: number;  // In feet (2D Y = 3D Z)
  endX: number;
  endY: number;
  isVertical: boolean;
};

type ZoneBounds = {
  zone: ZoneConfig;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/**
 * ZoneWallRenderer - DEPRECATED
 * Kept for API compatibility. Does not render any walls.
 * Use fixture-wall fixtures instead.
 */
export class ZoneWallRenderer {
  private wallGroup: THREE.Group;
  private wallMeshes: THREE.Mesh[] = [];
  private edgeMeshes: THREE.LineSegments[] = [];

  constructor(wallGroup: THREE.Group) {
    this.wallGroup = wallGroup;
  }

  /**
   * DEPRECATED - No longer renders any walls.
   * Interior walls are now managed as placeable fixtures.
   */
  render(_zones: ZoneConfig[], _shell: { lengthFt: number; widthFt: number; heightFt: number }): void {
    // Clear any existing walls and do nothing else
    // Interior walls are now added as fixtures through the UI
    this.clear();
  }

  /**
   * Clear all walls
   */
  clear(): void {
    this.wallMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.wallGroup.remove(mesh);
    });
    this.wallMeshes = [];

    this.edgeMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.wallGroup.remove(mesh);
    });
    this.edgeMeshes = [];
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    this.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Find shared boundaries between zones.
   * Only creates walls where zones actually touch.
   */
  private findSharedBoundaries(zoneBounds: ZoneBounds[]): WallSegment[] {
    const segments: WallSegment[] = [];
    const tolerance = 0.1;

    // Check each pair of zones for shared edges
    for (let i = 0; i < zoneBounds.length; i++) {
      const zoneA = zoneBounds[i];

      for (let j = i + 1; j < zoneBounds.length; j++) {
        const zoneB = zoneBounds[j];

        // Check if zoneA's right edge touches zoneB's left edge
        if (Math.abs(zoneA.right - zoneB.left) < tolerance) {
          const overlapStart = Math.max(zoneA.top, zoneB.top);
          const overlapEnd = Math.min(zoneA.bottom, zoneB.bottom);
          
          if (overlapEnd > overlapStart) {
            segments.push({
              startX: zoneA.right,
              startY: overlapStart,
              endX: zoneA.right,
              endY: overlapEnd,
              isVertical: true,
            });
          }
        }

        // Check if zoneB's right edge touches zoneA's left edge
        if (Math.abs(zoneB.right - zoneA.left) < tolerance) {
          const overlapStart = Math.max(zoneA.top, zoneB.top);
          const overlapEnd = Math.min(zoneA.bottom, zoneB.bottom);
          
          if (overlapEnd > overlapStart) {
            segments.push({
              startX: zoneA.left,
              startY: overlapStart,
              endX: zoneA.left,
              endY: overlapEnd,
              isVertical: true,
            });
          }
        }

        // Check if zoneA's bottom edge touches zoneB's top edge
        if (Math.abs(zoneA.bottom - zoneB.top) < tolerance) {
          const overlapStart = Math.max(zoneA.left, zoneB.left);
          const overlapEnd = Math.min(zoneA.right, zoneB.right);
          
          if (overlapEnd > overlapStart) {
            segments.push({
              startX: overlapStart,
              startY: zoneA.bottom,
              endX: overlapEnd,
              endY: zoneA.bottom,
              isVertical: false,
            });
          }
        }

        // Check if zoneB's bottom edge touches zoneA's top edge
        if (Math.abs(zoneB.bottom - zoneA.top) < tolerance) {
          const overlapStart = Math.max(zoneA.left, zoneB.left);
          const overlapEnd = Math.min(zoneA.right, zoneB.right);
          
          if (overlapEnd > overlapStart) {
            segments.push({
              startX: overlapStart,
              startY: zoneA.top,
              endX: overlapEnd,
              endY: zoneA.top,
              isVertical: false,
            });
          }
        }
      }
    }

    // Deduplicate
    return this.deduplicateSegments(segments);
  }

  /**
   * Remove duplicate wall segments
   */
  private deduplicateSegments(segments: WallSegment[]): WallSegment[] {
    const unique: WallSegment[] = [];
    const tolerance = 0.1;

    for (const seg of segments) {
      const isDuplicate = unique.some(existing => {
        if (seg.isVertical !== existing.isVertical) return false;

        if (seg.isVertical) {
          return Math.abs(seg.startX - existing.startX) < tolerance &&
            Math.abs(seg.startY - existing.startY) < tolerance &&
            Math.abs(seg.endY - existing.endY) < tolerance;
        } else {
          return Math.abs(seg.startY - existing.startY) < tolerance &&
            Math.abs(seg.startX - existing.startX) < tolerance &&
            Math.abs(seg.endX - existing.endX) < tolerance;
        }
      });

      if (!isDuplicate) {
        unique.push(seg);
      }
    }

    return unique;
  }

  /**
   * Create a wall segment mesh with door gap
   */
  private createWallSegment(segment: WallSegment, shell: { lengthFt: number; widthFt: number; heightFt: number }): void {
    const wallHeight = ftToUnits(ZONE_WALL_SETTINGS.HEIGHT_FT);
    const shellLength = ftToUnits(shell.lengthFt);
    const shellWidth = ftToUnits(shell.widthFt);
    const shellHeight = ftToUnits(shell.heightFt);
    const floorY = -shellHeight / 2;
    const doorGapFt = ZONE_WALL_SETTINGS.DOOR_GAP_FT;

    if (segment.isVertical) {
      const wallLengthFt = Math.abs(segment.endY - segment.startY);
      const wallX = -shellLength / 2 + ftToUnits(segment.startX);
      const baseZ = -shellWidth / 2 + ftToUnits(segment.startY);
      
      if (wallLengthFt > doorGapFt * 1.5) {
        // Create two wall segments with a gap in the middle
        const segmentLengthFt = (wallLengthFt - doorGapFt) / 2;
        const segmentLengthUnits = ftToUnits(segmentLengthFt);
        
        // First segment
        this.createWallMesh(
          ZONE_WALL_SETTINGS.THICKNESS,
          wallHeight,
          segmentLengthUnits,
          wallX,
          floorY + wallHeight / 2,
          baseZ + segmentLengthUnits / 2
        );

        // Second segment
        this.createWallMesh(
          ZONE_WALL_SETTINGS.THICKNESS,
          wallHeight,
          segmentLengthUnits,
          wallX,
          floorY + wallHeight / 2,
          -shellWidth / 2 + ftToUnits(segment.endY) - segmentLengthUnits / 2
        );
      } else {
        // Single wall segment
        this.createWallMesh(
          ZONE_WALL_SETTINGS.THICKNESS,
          wallHeight,
          ftToUnits(wallLengthFt),
          wallX,
          floorY + wallHeight / 2,
          baseZ + ftToUnits(wallLengthFt) / 2
        );
      }
    } else {
      const wallLengthFt = Math.abs(segment.endX - segment.startX);
      const wallZ = -shellWidth / 2 + ftToUnits(segment.startY);
      const baseX = -shellLength / 2 + ftToUnits(segment.startX);
      
      if (wallLengthFt > doorGapFt * 1.5) {
        // Create two wall segments with a gap in the middle
        const segmentLengthFt = (wallLengthFt - doorGapFt) / 2;
        const segmentLengthUnits = ftToUnits(segmentLengthFt);

        // First segment
        this.createWallMesh(
          segmentLengthUnits,
          wallHeight,
          ZONE_WALL_SETTINGS.THICKNESS,
          baseX + segmentLengthUnits / 2,
          floorY + wallHeight / 2,
          wallZ
        );

        // Second segment
        this.createWallMesh(
          segmentLengthUnits,
          wallHeight,
          ZONE_WALL_SETTINGS.THICKNESS,
          -shellLength / 2 + ftToUnits(segment.endX) - segmentLengthUnits / 2,
          floorY + wallHeight / 2,
          wallZ
        );
      } else {
        // Single wall segment
        this.createWallMesh(
          ftToUnits(wallLengthFt),
          wallHeight,
          ZONE_WALL_SETTINGS.THICKNESS,
          baseX + ftToUnits(wallLengthFt) / 2,
          floorY + wallHeight / 2,
          wallZ
        );
      }
    }
  }

  /**
   * Create a wall mesh at the specified position
   */
  private createWallMesh(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: ZONE_WALL_SETTINGS.COLOR,
      transparent: true,
      opacity: ZONE_WALL_SETTINGS.OPACITY,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, wallMaterial);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;

    this.wallGroup.add(mesh);
    this.wallMeshes.push(mesh);

    // Create edge highlight
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: ZONE_WALL_SETTINGS.EDGE_COLOR,
      transparent: true,
      opacity: 0.4,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.position.set(x, y, z);

    this.wallGroup.add(edges);
    this.edgeMeshes.push(edges);
  }
}
