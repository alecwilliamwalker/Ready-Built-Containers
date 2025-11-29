/**
 * 3D Model Loader utilities for GLTF/GLB files
 * 
 * @deprecated This file is being replaced by ModelCache in '@/lib/design/three'.
 * All functions in this file now delegate to the new unified ModelCache.
 * 
 * For new code, import directly from '@/lib/design/three':
 * ```
 * import { modelCache } from '@/lib/design/three';
 * ```
 */

import * as THREE from "three";
import { modelCache, ModelConfig } from "./three";

export type FixtureModelConfig = ModelConfig;

/**
 * @deprecated Use modelCache.loadWithConfig() from '@/lib/design/three' instead
 */
export async function loadFixtureModel(
  catalogKey: string,
  config: FixtureModelConfig
): Promise<THREE.Group> {
  // If no model URL provided, return placeholder geometry
  if (!config.modelUrl) {
    return createPlaceholderModel(config);
  }

  try {
    return await modelCache.loadWithConfig(config.modelUrl, config);
  } catch (error) {
    console.error(`Failed to load model for ${catalogKey}:`, error);
    return createPlaceholderModel(config);
  }
}

/**
 * Create a placeholder box geometry when no model is available
 */
function createPlaceholderModel(config: FixtureModelConfig): THREE.Group {
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.7,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (config.scale) {
    mesh.scale.setScalar(config.scale);
  }

  group.add(mesh);
  return group;
}

/**
 * @deprecated Use modelCache.preload() from '@/lib/design/three' instead
 */
export async function preloadCommonModels(catalogKeys: string[]): Promise<void> {
  // This function is a no-op as the new modelCache handles preloading differently
  // (by URL rather than catalog key)
  return Promise.resolve();
}

/**
 * @deprecated Use modelCache.clear() from '@/lib/design/three' instead
 */
export function clearModelCache(): void {
  modelCache.clear();
}

/**
 * @deprecated Use modelCache.getStats() from '@/lib/design/three' instead
 */
export function getModelCacheInfo(): {
  size: number;
  keys: string[];
} {
  const stats = modelCache.getStats();
  return {
    size: stats.size,
    keys: stats.keys,
  };
}
