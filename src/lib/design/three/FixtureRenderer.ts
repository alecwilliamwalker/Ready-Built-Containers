/**
 * FixtureRenderer - Manages 3D fixture objects with efficient diffing
 * Only updates changed fixtures instead of full rebuilds
 */

import * as THREE from "three";
import type { FixtureConfig, ModuleCatalogItem } from "@/types/design";
import { rectFromFixture } from "@/lib/design/geometry";
import { modelCache } from "./ModelCache";
import {
  COLORS,
  MATERIAL_SETTINGS,
  ftToUnits,
  getFixtureHeightFt,
  INTERACTION_SETTINGS,
} from "./constants";
import { getFixtureGeometryCreator } from "./geometry";

// Invisible hit box material - used for easier selection
const HIT_BOX_MATERIAL = new THREE.MeshBasicMaterial({
  visible: false,
  side: THREE.DoubleSide,
});

export type FixtureRenderConfig = {
  shellLengthFt: number;
  shellWidthFt: number;
  shellHeightFt: number;
};

type RenderedFixture = {
  id: string;
  object: THREE.Group;
  config: FixtureConfig;
  catalogKey: string;
  isSelected: boolean;
  isHovered: boolean;
  loadingAborted: boolean;
};

/**
 * Computes a hash of fixture state for change detection
 */
function fixtureHash(fixture: FixtureConfig, isSelected: boolean): string {
  const props = fixture.properties as { lengthOverrideFt?: number; widthOverrideFt?: number; material?: string; transparent3D?: boolean } | undefined;
  return `${fixture.xFt}:${fixture.yFt}:${fixture.rotationDeg}:${fixture.catalogKey}:${isSelected}:${props?.lengthOverrideFt ?? ''}:${props?.widthOverrideFt ?? ''}:${props?.material ?? ''}:${props?.transparent3D ?? ''}`;
}

/**
 * FixtureRenderer manages the lifecycle of 3D fixture objects
 */
export class FixtureRenderer {
  private moduleGroup: THREE.Group;
  private renderedFixtures: Map<string, RenderedFixture> = new Map();
  private fixtureHashes: Map<string, string> = new Map();
  private config: FixtureRenderConfig;
  private abortController: AbortController | null = null;
  private hoveredId: string | null = null;

  constructor(moduleGroup: THREE.Group, config: FixtureRenderConfig) {
    this.moduleGroup = moduleGroup;
    this.config = config;
  }

  /**
   * Update config (e.g., when shell dimensions change)
   */
  updateConfig(config: FixtureRenderConfig): void {
    this.config = config;
    // Force full re-render since positions will change
    this.fixtureHashes.clear();
  }

  /**
   * Sync fixtures with provided data, using diff to minimize updates
   */
  sync(
    fixtures: FixtureConfig[],
    catalog: Record<string, ModuleCatalogItem>,
    selectedIds: string[],
    onLog?: (msg: string) => void
  ): void {
    // Cancel any pending model loads
    this.abortController?.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const log = onLog ?? (() => {});
    const currentIds = new Set(fixtures.map(f => f.id));
    const selectedSet = new Set(selectedIds);

    // Remove fixtures that no longer exist
    for (const [id, rendered] of this.renderedFixtures) {
      if (!currentIds.has(id)) {
        log(`[FixtureRenderer] Removing fixture ${id}`);
        rendered.loadingAborted = true;
        this.removeFixture(id);
      }
    }

    // Update or add fixtures
    for (const fixture of fixtures) {
      const catalogItem = catalog[fixture.catalogKey];
      if (!catalogItem) {
        log(`[FixtureRenderer] Missing catalog item for ${fixture.id} (key: ${fixture.catalogKey})`);
        continue;
      }

      const isSelected = selectedSet.has(fixture.id);
      const newHash = fixtureHash(fixture, isSelected);
      const oldHash = this.fixtureHashes.get(fixture.id);

      if (oldHash === newHash) {
        // No change, skip
        continue;
      }

      // Check if we can do a partial update (position/rotation only)
      const existing = this.renderedFixtures.get(fixture.id);
      if (existing && existing.catalogKey === fixture.catalogKey && existing.isSelected === isSelected) {
        // Only position/rotation changed - update in place
        log(`[FixtureRenderer] Updating position for ${fixture.id}`);
        this.updateFixturePosition(existing, fixture, catalogItem);
        this.fixtureHashes.set(fixture.id, newHash);
        continue;
      }

      // Need full recreation
      if (existing) {
        log(`[FixtureRenderer] Replacing fixture ${fixture.id}`);
        existing.loadingAborted = true;
        this.removeFixture(fixture.id);
      } else {
        log(`[FixtureRenderer] Adding fixture ${fixture.id}`);
      }

      this.addFixture(fixture, catalogItem, isSelected, signal, log);
      this.fixtureHashes.set(fixture.id, newHash);
    }
  }

  /**
   * Update selection state for fixtures
   */
  updateSelection(selectedIds: string[]): void {
    const selectedSet = new Set(selectedIds);

    for (const [id, rendered] of this.renderedFixtures) {
      const shouldBeSelected = selectedSet.has(id);
      if (rendered.isSelected !== shouldBeSelected) {
        this.updateFixtureSelectionVisual(rendered.object, shouldBeSelected);
        rendered.isSelected = shouldBeSelected;
        // Update hash
        this.fixtureHashes.set(id, fixtureHash(rendered.config, shouldBeSelected));
      }
    }
  }

  /**
   * Set hover state for a fixture (called on mouse move)
   * Returns true if hover state changed
   */
  setHovered(fixtureId: string | null): boolean {
    if (this.hoveredId === fixtureId) return false;

    // Clear previous hover
    if (this.hoveredId) {
      const prev = this.renderedFixtures.get(this.hoveredId);
      if (prev && !prev.isSelected) {
        this.updateFixtureHoverVisual(prev.object, false);
        prev.isHovered = false;
      }
    }

    // Set new hover
    if (fixtureId) {
      const next = this.renderedFixtures.get(fixtureId);
      if (next && !next.isSelected) {
        this.updateFixtureHoverVisual(next.object, true);
        next.isHovered = true;
      }
    }

    this.hoveredId = fixtureId;
    return true;
  }

  /**
   * Get currently hovered fixture ID
   */
  getHoveredId(): string | null {
    return this.hoveredId;
  }

  /**
   * Get a fixture's 3D object by ID
   */
  getFixtureObject(id: string): THREE.Group | undefined {
    return this.renderedFixtures.get(id)?.object;
  }

  /**
   * Get all fixture objects
   */
  getAllFixtureObjects(): THREE.Group[] {
    return Array.from(this.renderedFixtures.values()).map(r => r.object);
  }

  /**
   * Dispose all fixtures
   */
  dispose(): void {
    this.abortController?.abort();
    this.abortController = null;

    for (const [id] of this.renderedFixtures) {
      this.removeFixture(id);
    }

    this.renderedFixtures.clear();
    this.fixtureHashes.clear();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private addFixture(
    fixture: FixtureConfig,
    catalogItem: ModuleCatalogItem,
    isSelected: boolean,
    signal: AbortSignal,
    log: (msg: string) => void
  ): void {
    const group = this.createFixtureGroup(fixture, catalogItem, isSelected, signal, log);
    
    // Position the group
    this.positionFixture(group, fixture, catalogItem);

    // Add to scene
    this.moduleGroup.add(group);

    // Store reference
    this.renderedFixtures.set(fixture.id, {
      id: fixture.id,
      object: group,
      config: fixture,
      catalogKey: fixture.catalogKey,
      isSelected,
      isHovered: false,
      loadingAborted: false,
    });
  }

  private removeFixture(id: string): void {
    const rendered = this.renderedFixtures.get(id);
    if (!rendered) return;

    // Remove from scene
    this.moduleGroup.remove(rendered.object);

    // Dispose resources
    this.disposeGroup(rendered.object);

    // Remove from tracking
    this.renderedFixtures.delete(id);
    this.fixtureHashes.delete(id);
  }

  private updateFixturePosition(
    rendered: RenderedFixture,
    fixture: FixtureConfig,
    catalogItem: ModuleCatalogItem
  ): void {
    this.positionFixture(rendered.object, fixture, catalogItem);
    rendered.config = fixture;
  }

  private positionFixture(
    object: THREE.Group,
    fixture: FixtureConfig,
    catalogItem: ModuleCatalogItem
  ): void {
    const { shellLengthFt, shellWidthFt, shellHeightFt } = this.config;
    const lengthUnits = ftToUnits(shellLengthFt);
    const widthUnits = ftToUnits(shellWidthFt);
    const heightUnits = ftToUnits(shellHeightFt);

    // Get fixture rectangle (handles rotation for position calculation)
    const rect = rectFromFixture(fixture, catalogItem);

    // Calculate 3D position from 2D plan coordinates
    // 2D origin is bottom-left; 3D origin is center
    const xPos = -lengthUnits / 2 + (rect.x + rect.width / 2) * ftToUnits(1) / ftToUnits(1) * ftToUnits(1);
    const zPos = -widthUnits / 2 + (rect.y + rect.height / 2) * ftToUnits(1) / ftToUnits(1) * ftToUnits(1);
    const yPos = -heightUnits / 2; // Floor level

    // Simplified position calculation
    const xPosFinal = -lengthUnits / 2 + ftToUnits(rect.x + rect.width / 2);
    const zPosFinal = -widthUnits / 2 + ftToUnits(rect.y + rect.height / 2);

    object.position.set(xPosFinal, yPos, zPosFinal);
    object.rotation.y = -THREE.MathUtils.degToRad(fixture.rotationDeg || 0);
  }

  private createFixtureGroup(
    fixture: FixtureConfig,
    catalogItem: ModuleCatalogItem,
    isSelected: boolean,
    signal: AbortSignal,
    log: (msg: string) => void
  ): THREE.Group {
    // Calculate dimensions (unrotated for 3D object)
    const overrides = (fixture.properties as { lengthOverrideFt?: number; widthOverrideFt?: number }) ?? {};
    const footprintLength = typeof overrides.lengthOverrideFt === "number"
      ? Math.max(overrides.lengthOverrideFt, 0.5)
      : catalogItem.footprintFt.length;
    const footprintWidth = typeof overrides.widthOverrideFt === "number"
      ? Math.max(overrides.widthOverrideFt, 0.5)
      : catalogItem.footprintFt.width;

    const group = new THREE.Group();
    group.name = `Fixture_${fixture.id}`;
    group.userData = {
      fixtureId: fixture.id,
      isFixture: true,
      isWall: catalogItem.key.includes('wall'),
      // Store actual footprint for drag clamping (not visual bounding box)
      footprintWidthFt: footprintWidth,
      footprintLengthFt: footprintLength,
      // Store anchor for proper clamping calculation
      footprintAnchor: catalogItem.footprintAnchor,
    };

    // Use shell height for walls and vestibule so they extend floor to ceiling
    const isWall = catalogItem.key.includes('wall') || catalogItem.key.includes('vestibule');
    const isWindow = catalogItem.key.includes('window');
    const heightFt = isWall ? this.config.shellHeightFt : getFixtureHeightFt(catalogItem.category);

    log(`[FixtureRenderer] Creating ${fixture.catalogKey} - Size: ${footprintWidth.toFixed(2)}x${heightFt.toFixed(2)}x${footprintLength.toFixed(2)} ft`);

    // Create an invisible hit box for easier selection
    // This box covers the entire fixture footprint and makes clicking much easier
    const hitBoxWidth = ftToUnits(footprintWidth);
    const hitBoxLength = ftToUnits(footprintLength);
    
    // Windows have their geometry elevated to sill height (4ft) with a 3-4ft tall frame
    // Calculate hitbox height and position accordingly
    const windowSillHeight = 4; // Standard window sill height in feet
    const windowFrameHeight = footprintLength <= 2 ? 3 : 4; // 3ft for 24x36, 4ft for 36x48
    const hitBoxHeight = isWindow ? ftToUnits(windowFrameHeight) : ftToUnits(heightFt);
    const hitBoxYOffset = isWindow ? ftToUnits(windowSillHeight) + hitBoxHeight / 2 : hitBoxHeight / 2;
    
    // Add some padding to make selection even easier
    const hitPadding = ftToUnits(INTERACTION_SETTINGS.HIT_AREA_PADDING_FT);
    const hitBoxGeometry = new THREE.BoxGeometry(
      hitBoxWidth + hitPadding * 2,
      hitBoxHeight,
      hitBoxLength + hitPadding * 2
    );
    const hitBox = new THREE.Mesh(hitBoxGeometry, HIT_BOX_MATERIAL);
    hitBox.position.set(0, hitBoxYOffset, 0);
    hitBox.name = `HitBox_${fixture.id}`;
    hitBox.userData = {
      fixtureId: fixture.id,
      isHitBox: true,
      isWall: catalogItem.key.includes('wall'),
      isWindow: isWindow,
    };
    // Ensure hitbox is always raycast-able
    hitBox.raycast = THREE.Mesh.prototype.raycast;
    group.add(hitBox);

    // Get the appropriate geometry creator for this fixture type
    const geometryCreator = getFixtureGeometryCreator(catalogItem.key);
    
    // Create detailed fixture geometry
    // Pass fixture properties for wall-specific customization
    const fixtureGeometry = geometryCreator(footprintWidth, footprintLength, heightFt, fixture.properties);
    
    // Apply selection styling to all meshes in the geometry
    if (isSelected) {
      this.applySelectionToModel(fixtureGeometry, isSelected);
    }
    
    // Add the geometry to the group
    group.add(fixtureGeometry);

    // If model URL exists, try to load the real model and replace the procedural one
    if (catalogItem.modelUrl) {
      log(`[FixtureRenderer] Loading custom model from ${catalogItem.modelUrl}`);
      
      modelCache
        .loadWithConfig(catalogItem.modelUrl, {
          scale: catalogItem.modelScale,
          rotation: catalogItem.modelRotation,
          offset: catalogItem.modelOffset,
        })
        .then((model) => {
          // Check if load was aborted or fixture was removed
          if (signal.aborted) {
            log(`[FixtureRenderer] Model load aborted for ${fixture.id}`);
            return;
          }

          const rendered = this.renderedFixtures.get(fixture.id);
          if (!rendered || rendered.loadingAborted) {
            log(`[FixtureRenderer] Fixture ${fixture.id} removed before model loaded`);
            return;
          }

          // Remove procedural geometry (but keep the hit box!)
          group.remove(fixtureGeometry);
          this.disposeGroup(fixtureGeometry);

          // Apply selection styling
          this.applySelectionToModel(model, isSelected);

          group.add(model);
          log(`[FixtureRenderer] Custom model loaded for ${fixture.id}`);
        })
        .catch((err) => {
          if (!signal.aborted) {
            console.error(`[FixtureRenderer] Failed to load custom model for ${fixture.id}:`, err);
          }
          // Keep procedural geometry on error
        });
    }

    return group;
  }

  private updateFixtureSelectionVisual(group: THREE.Group, isSelected: boolean): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
        
        if ('emissive' in material) {
          // MeshStandardMaterial
          material.emissive.setHex(isSelected ? COLORS.SELECTION_EMISSIVE : 0x000000);
          material.emissiveIntensity = isSelected ? MATERIAL_SETTINGS.SELECTION_EMISSIVE_INTENSITY : 0;
        } else {
          // MeshBasicMaterial (fallback)
          const userData = group.userData as { originalColor?: number };
          const originalColor = userData.originalColor ?? COLORS.FIXTURE_DEFAULT;
          material.color.setHex(isSelected ? COLORS.SELECTION_HIGHLIGHT : originalColor);
        }

        material.opacity = isSelected 
          ? MATERIAL_SETTINGS.FIXTURE_SELECTED_OPACITY 
          : MATERIAL_SETTINGS.FIXTURE_OPACITY;
      }
    });
  }

  private updateFixtureHoverVisual(group: THREE.Group, isHovered: boolean): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
        
        if ('emissive' in material) {
          // MeshStandardMaterial - green glow for hover
          material.emissive.setHex(isHovered ? COLORS.HOVER_EMISSIVE : 0x000000);
          material.emissiveIntensity = isHovered ? MATERIAL_SETTINGS.HOVER_EMISSIVE_INTENSITY : 0;
        }
      }
    });
  }

  private applySelectionToModel(model: THREE.Group, isSelected: boolean): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        if (isSelected && 'emissive' in (child.material as THREE.MeshStandardMaterial)) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissive.setHex(COLORS.SELECTION_EMISSIVE);
          mat.emissiveIntensity = MATERIAL_SETTINGS.SELECTION_EMISSIVE_INTENSITY;
        }
      }
    });
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.disposeMesh(child);
      }
    });
  }

  private disposeMesh(mesh: THREE.Mesh): void {
    mesh.geometry?.dispose();
    
    // Don't dispose shared hit box material
    if (mesh.material === HIT_BOX_MATERIAL) {
      return;
    }
    
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => m.dispose());
    } else {
      mesh.material?.dispose();
    }
  }
}

