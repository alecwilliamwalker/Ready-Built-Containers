/**
 * useFixtureSync - React hook for syncing fixtures with FixtureRenderer
 */

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { FixtureConfig, ModuleCatalogItem } from "@/types/design";
import { FixtureRenderer, FixtureRenderConfig } from "../FixtureRenderer";

export type UseFixtureSyncOptions = {
  moduleGroup: THREE.Group | null;
  fixtures: FixtureConfig[];
  catalog: Record<string, ModuleCatalogItem>;
  selectedIds: string[];
  config: FixtureRenderConfig;
  onLog?: (msg: string) => void;
};

export type UseFixtureSyncReturn = {
  fixtureRenderer: FixtureRenderer | null;
  getFixtureObject: (id: string) => THREE.Group | undefined;
};

/**
 * Hook to sync fixtures with Three.js scene using FixtureRenderer
 */
export function useFixtureSync(options: UseFixtureSyncOptions): UseFixtureSyncReturn {
  const { moduleGroup, fixtures, catalog, selectedIds, config, onLog } = options;
  const fixtureRendererRef = useRef<FixtureRenderer | null>(null);

  // Initialize FixtureRenderer when moduleGroup becomes available
  useEffect(() => {
    if (!moduleGroup) {
      fixtureRendererRef.current = null;
      return;
    }

    const renderer = new FixtureRenderer(moduleGroup, config);
    fixtureRendererRef.current = renderer;

    return () => {
      renderer.dispose();
      fixtureRendererRef.current = null;
    };
  }, [moduleGroup]); // Only recreate when moduleGroup changes

  // Update config when it changes
  useEffect(() => {
    fixtureRendererRef.current?.updateConfig(config);
  }, [config.shellLengthFt, config.shellWidthFt, config.shellHeightFt]);

  // Sync fixtures when they change
  useEffect(() => {
    if (!fixtureRendererRef.current) return;

    fixtureRendererRef.current.sync(fixtures, catalog, selectedIds, onLog);
  }, [fixtures, catalog, selectedIds, onLog]);

  // Get fixture object helper
  const getFixtureObject = useCallback((id: string): THREE.Group | undefined => {
    return fixtureRendererRef.current?.getFixtureObject(id);
  }, []);

  return {
    fixtureRenderer: fixtureRendererRef.current,
    getFixtureObject,
  };
}

