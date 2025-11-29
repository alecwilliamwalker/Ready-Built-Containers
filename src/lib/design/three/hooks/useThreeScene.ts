/**
 * useThreeScene - React hook for managing SceneManager lifecycle
 */

import { useEffect, useRef, useCallback } from "react";
import { SceneManager, ShellDimensions, SceneManagerCallbacks } from "../SceneManager";

export type UseThreeSceneOptions = {
  shell: ShellDimensions;
  showGrid?: boolean;
  showHelpers?: boolean;
  enableShadows?: boolean;
  onRender?: () => void;
  onResize?: (width: number, height: number) => void;
};

export type UseThreeSceneReturn = {
  containerRef: React.RefObject<HTMLDivElement>;
  sceneManager: SceneManager | null;
  getSnapshot: (type?: "image/png" | "image/jpeg") => string | null;
};

/**
 * Hook to manage SceneManager lifecycle with a React component
 */
export function useThreeScene(options: UseThreeSceneOptions): UseThreeSceneReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Initialize scene manager
  useEffect(() => {
    if (!containerRef.current) return;

    const sceneManager = new SceneManager({
      shell: options.shell,
      showGrid: options.showGrid ?? true,
      showHelpers: options.showHelpers ?? false,
      enableShadows: options.enableShadows ?? true,
    });

    const callbacks: SceneManagerCallbacks = {
      onRender: () => optionsRef.current.onRender?.(),
      onResize: (w, h) => optionsRef.current.onResize?.(w, h),
    };

    sceneManager.mount(containerRef.current, callbacks);
    sceneManager.start();

    sceneManagerRef.current = sceneManager;

    return () => {
      sceneManager.dispose();
      sceneManagerRef.current = null;
    };
  }, []); // Only run once on mount

  // Update shell dimensions when they change
  useEffect(() => {
    sceneManagerRef.current?.updateShell(options.shell);
  }, [options.shell.lengthFt, options.shell.widthFt, options.shell.heightFt]);

  // Update grid visibility
  useEffect(() => {
    sceneManagerRef.current?.setGridVisible(options.showGrid ?? true);
  }, [options.showGrid]);

  // Update helpers visibility
  useEffect(() => {
    sceneManagerRef.current?.setHelpersVisible(options.showHelpers ?? false);
  }, [options.showHelpers]);

  // Snapshot function
  const getSnapshot = useCallback((type: "image/png" | "image/jpeg" = "image/png"): string | null => {
    return sceneManagerRef.current?.getSnapshot(type) ?? null;
  }, []);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    sceneManager: sceneManagerRef.current,
    getSnapshot,
  };
}

