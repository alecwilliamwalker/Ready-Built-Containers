/**
 * Unified Model Cache for GLTF/GLB models
 * Single source of truth for 3D model loading and caching
 */

import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

export type ModelConfig = {
  modelUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  offset?: { x: number; y: number; z: number };
};

type CacheEntry = {
  model: THREE.Group;
  lastAccessed: number;
};

type LoadingPromise = Promise<THREE.Group>;

/**
 * Singleton model cache with proper lifecycle management
 */
class ModelCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private loadingPromises: Map<string, LoadingPromise> = new Map();
  private loader: GLTFLoader;
  private maxCacheSize: number;
  private maxAge: number; // ms

  constructor(maxCacheSize = 50, maxAgeMs = 5 * 60 * 1000) {
    this.loader = new GLTFLoader();
    this.maxCacheSize = maxCacheSize;
    this.maxAge = maxAgeMs;
  }

  /**
   * Load a model from URL, using cache if available
   * Returns a CLONE of the cached model to avoid shared state issues
   */
  async load(url: string): Promise<THREE.Group> {
    // Check if already cached
    const cached = this.cache.get(url);
    if (cached) {
      cached.lastAccessed = Date.now();
      return this.cloneModel(cached.model);
    }

    // Check if currently loading
    const existingPromise = this.loadingPromises.get(url);
    if (existingPromise) {
      const model = await existingPromise;
      return this.cloneModel(model);
    }

    // Start new load
    const loadPromise = this.loadModel(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const model = await loadPromise;
      
      // Cache the model
      this.cache.set(url, {
        model,
        lastAccessed: Date.now(),
      });

      // Cleanup if cache too large
      this.evictOldEntries();

      return this.cloneModel(model);
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Load a model with configuration applied
   */
  async loadWithConfig(url: string, config: ModelConfig): Promise<THREE.Group> {
    const model = await this.load(url);
    this.applyConfig(model, config);
    return model;
  }

  /**
   * Apply configuration transforms to a model
   */
  applyConfig(model: THREE.Group, config: ModelConfig): void {
    if (config.scale !== undefined) {
      model.scale.setScalar(config.scale);
    }

    if (config.rotation) {
      model.rotation.set(
        config.rotation.x,
        config.rotation.y,
        config.rotation.z
      );
    }

    if (config.offset) {
      model.position.set(
        config.offset.x,
        config.offset.y,
        config.offset.z
      );
    }
  }

  /**
   * Check if a model is cached
   */
  has(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Check if a model is currently loading
   */
  isLoading(url: string): boolean {
    return this.loadingPromises.has(url);
  }

  /**
   * Preload multiple models in parallel
   */
  async preload(urls: string[]): Promise<void> {
    await Promise.all(urls.map(url => this.load(url).catch(() => null)));
  }

  /**
   * Clear the entire cache and dispose all models
   */
  clear(): void {
    this.cache.forEach((entry) => {
      this.disposeModel(entry.model);
    });
    this.cache.clear();
  }

  /**
   * Remove a specific model from cache
   */
  remove(url: string): void {
    const entry = this.cache.get(url);
    if (entry) {
      this.disposeModel(entry.model);
      this.cache.delete(url);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[]; loadingCount: number } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      loadingCount: this.loadingPromises.size,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async loadModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          resolve(model);
        },
        undefined,
        (error) => {
          console.error(`[ModelCache] Failed to load model: ${url}`, error);
          reject(error);
        }
      );
    });
  }

  private cloneModel(model: THREE.Group): THREE.Group {
    const clone = model.clone();
    
    // Deep clone materials to avoid shared state
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m => m.clone());
        } else {
          child.material = child.material.clone();
        }
      }
    });

    return clone;
  }

  private disposeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            this.disposeMaterial(mat);
          });
        } else if (child.material) {
          this.disposeMaterial(child.material);
        }
      }
    });
  }

  private disposeMaterial(material: THREE.Material): void {
    material.dispose();
    
    // Dispose textures if present
    const mat = material as THREE.MeshStandardMaterial;
    mat.map?.dispose();
    mat.normalMap?.dispose();
    mat.roughnessMap?.dispose();
    mat.metalnessMap?.dispose();
    mat.aoMap?.dispose();
    mat.emissiveMap?.dispose();
  }

  private evictOldEntries(): void {
    if (this.cache.size <= this.maxCacheSize) return;

    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove old entries until we're under the limit
    for (const [url, entry] of entries) {
      if (this.cache.size <= this.maxCacheSize) break;
      
      // Also check if entry is too old
      if (now - entry.lastAccessed > this.maxAge || this.cache.size > this.maxCacheSize) {
        this.remove(url);
      }
    }
  }
}

// Export singleton instance
export const modelCache = new ModelCacheManager();

// Also export the class for testing/custom instances
export { ModelCacheManager };

