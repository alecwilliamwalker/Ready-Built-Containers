/**
 * Three.js utilities for fixture rendering
 * 
 * @deprecated This file is being replaced by the modular three/ directory.
 * Import from '@/lib/design/three' instead for new code.
 * 
 * This file is maintained for backwards compatibility with existing imports.
 */

import * as THREE from "three";
import type { ModuleCatalogItem, FixtureConfig } from "@/types/design";
import { rectFromFixture } from "@/lib/design/geometry";
import {
  modelCache,
  ftToUnits,
  getFixtureColor,
  getFixtureHeightFt,
  COLORS,
  MATERIAL_SETTINGS,
  FT_TO_UNITS,
} from "./three";

// Re-export FT_TO_UNITS for backwards compatibility
export { FT_TO_UNITS };

/**
 * @deprecated Use modelCache.load() from '@/lib/design/three' instead
 */
export function getCachedModel(url: string): Promise<THREE.Group> {
  return modelCache.load(url);
}

/**
 * Create a fallback mesh when no model is available
 */
export function createFallbackMesh(
  widthUnits: number,
  depthUnits: number,
  heightUnits: number,
  isSelected: boolean,
  color: number
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(widthUnits, heightUnits, depthUnits * 0.9);
  const material = new THREE.MeshBasicMaterial({
    color: isSelected ? COLORS.SELECTION_HIGHLIGHT : color,
    transparent: true,
    opacity: isSelected ? MATERIAL_SETTINGS.FIXTURE_SELECTED_OPACITY : MATERIAL_SETTINGS.FIXTURE_OPACITY,
    side: THREE.DoubleSide,
    wireframe: false,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Position mesh so its bottom is at local y=0
  mesh.position.y = heightUnits / 2;

  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Create a 3D representation of a fixture
 * 
 * @deprecated Consider using FixtureRenderer from '@/lib/design/three' for better
 * lifecycle management and diffing support.
 */
export function createFixtureObject(
  fixture: FixtureConfig,
  catalogItem: ModuleCatalogItem,
  isSelected: boolean,
  onLoad?: () => void,
  onLog?: (msg: string) => void
): THREE.Group {
  const log = (msg: string) => {
    if (onLog) onLog(msg);
  };

  const group = new THREE.Group();

  // Calculate dimensions (unrotated for 3D object geometry)
  const overrides = (fixture.properties as { lengthOverrideFt?: number; widthOverrideFt?: number }) ?? {};

  const footprintLength =
    typeof overrides.lengthOverrideFt === "number"
      ? Math.max(overrides.lengthOverrideFt, 0.5)
      : catalogItem.footprintFt.length;
  const footprintWidth =
    typeof overrides.widthOverrideFt === "number"
      ? Math.max(overrides.widthOverrideFt, 0.5)
      : catalogItem.footprintFt.width;

  // Map to 3D: Width -> X, Length -> Z
  const unitWidth = ftToUnits(footprintWidth);
  const unitLength = ftToUnits(footprintLength);
  const unitHeight = ftToUnits(getFixtureHeightFt(catalogItem.category));
  const color = getFixtureColor(catalogItem.category);

  log(`[createFixtureObject] Creating ${fixture.catalogKey} (Cat: ${catalogItem.category}) - Size: ${unitWidth.toFixed(2)}x${unitHeight.toFixed(2)}x${unitLength.toFixed(2)}`);

  // Add metadata for interaction
  group.userData = {
    fixtureId: fixture.id,
    isFixture: true,
    originalColor: color,
  };

  // If model URL exists, try to load it
  if (catalogItem.modelUrl) {
    log(`[createFixtureObject] Loading model from ${catalogItem.modelUrl}`);

    // Add temporary placeholder
    const placeholder = createFallbackMesh(unitWidth, unitLength, unitHeight, isSelected, color);
    group.add(placeholder);

    modelCache
      .loadWithConfig(catalogItem.modelUrl, {
        scale: catalogItem.modelScale,
        rotation: catalogItem.modelRotation,
        offset: catalogItem.modelOffset,
      })
      .then((model) => {
        log(`[createFixtureObject] Model loaded for ${fixture.id}`);

        // Remove placeholder
        group.remove(placeholder);
        placeholder.geometry.dispose();
        (placeholder.material as THREE.Material).dispose();

        // Apply selection effect to model materials
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (isSelected && 'emissive' in (mesh.material as THREE.MeshStandardMaterial)) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.emissive.setHex(COLORS.SELECTION_EMISSIVE);
              mat.emissiveIntensity = MATERIAL_SETTINGS.SELECTION_EMISSIVE_INTENSITY;
            }
          }
        });

        group.add(model);
        if (onLoad) onLoad();
      })
      .catch((err) => {
        console.error(`[createFixtureObject] Failed to load model for ${fixture.id}:`, err);
        if (onLoad) onLoad();
      });
  } else {
    // Fallback immediately
    const mesh = createFallbackMesh(unitWidth, unitLength, unitHeight, isSelected, color);
    group.add(mesh);
  }

  return group;
}
