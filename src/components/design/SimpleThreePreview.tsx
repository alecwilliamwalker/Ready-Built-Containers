"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import type { DesignConfig, ModuleCatalogItem } from "@/types/design";
import { Button } from "@/components/ui/Button";
import { rectFromFixture } from "@/lib/design/geometry";
import {
  ftToUnits,
  COLORS,
  MATERIAL_SETTINGS,
  getFixtureColor,
  LIGHTING,
} from "@/lib/design/three";

export type SimpleThreePreviewProps = {
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  selectedIds?: string[];
  height?: number;
};

/**
 * SimpleThreePreview - A lightweight read-only 3D preview
 * Uses shared constants but simpler implementation than full ThreeViewport
 */
export function SimpleThreePreview({
  design,
  catalog,
  selectedIds = [],
  height = 220,
}: SimpleThreePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moduleGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [snapshotReady, setSnapshotReady] = useState(false);

  // Memoize shell dimensions
  const shellDimensions = useMemo(() => ({
    lengthFt: design.shell.lengthFt,
    widthFt: design.shell.widthFt,
    heightFt: design.shell.heightFt,
  }), [design.shell.lengthFt, design.shell.widthFt, design.shell.heightFt]);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const actualHeight = height;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f1ea);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / actualHeight, 0.1, 1000);
    const lengthUnits = ftToUnits(shellDimensions.lengthFt);
    camera.position.set(lengthUnits * 0.6, 10, 26);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, actualHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, LIGHTING.AMBIENT_INTENSITY + 0.2);
    scene.add(ambientLight);

    const directional = new THREE.DirectionalLight(0xffffff, LIGHTING.DIRECTIONAL_INTENSITY);
    directional.position.set(4, 10, 12);
    scene.add(directional);

    // Shell wireframe
    const shellGeometry = new THREE.BoxGeometry(
      ftToUnits(shellDimensions.lengthFt),
      ftToUnits(shellDimensions.heightFt),
      ftToUnits(shellDimensions.widthFt)
    );
    const shellEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(shellGeometry),
      new THREE.LineBasicMaterial({ color: 0x314c3a })
    );
    scene.add(shellEdges);

    // Module group for fixtures
    const moduleGroup = new THREE.Group();
    scene.add(moduleGroup);

    // Store refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    moduleGroupRef.current = moduleGroup;
    setSnapshotReady(true);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const newWidth = entry.contentRect.width;
      if (newWidth === 0) return;

      renderer.setSize(newWidth, actualHeight);
      camera.aspect = newWidth / actualHeight;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      resizeObserver.disconnect();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Dispose shell
      shellGeometry.dispose();
      (shellEdges.material as THREE.Material).dispose();

      // Dispose module group contents
      moduleGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            (child.material as THREE.Material)?.dispose();
          }
        }
      });

      renderer.dispose();

      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      moduleGroupRef.current = null;
    };
  }, [shellDimensions, height]);

  // Update fixtures
  useEffect(() => {
    const moduleGroup = moduleGroupRef.current;
    if (!moduleGroup) return;

    // Clear existing fixtures
    while (moduleGroup.children.length > 0) {
      const child = moduleGroup.children[0];
      moduleGroup.remove(child);

      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          (child.material as THREE.Material)?.dispose();
        }
      }
    }

    const lengthUnits = ftToUnits(shellDimensions.lengthFt);
    const widthUnits = ftToUnits(shellDimensions.widthFt);

    // Render fixtures
    design.fixtures.forEach((fixture) => {
      const catalogItem = catalog[fixture.catalogKey];
      if (!catalogItem) return;

      const rect = rectFromFixture(fixture, catalogItem);
      const unitLength = ftToUnits(rect.width);
      const unitWidth = ftToUnits(rect.height);
      const isSelected = selectedIds.includes(fixture.id);

      // Get color from shared constants
      const color = getFixtureColor(catalogItem.category);

      const geometry = new THREE.BoxGeometry(unitLength, 2, unitWidth * 0.9);
      const material = new THREE.MeshStandardMaterial({
        color: isSelected ? COLORS.SELECTION_HIGHLIGHT : color,
        transparent: true,
        opacity: isSelected ? MATERIAL_SETTINGS.FIXTURE_SELECTED_OPACITY : 0.8,
        emissive: isSelected ? COLORS.SELECTION_EMISSIVE : 0x000000,
        emissiveIntensity: isSelected ? 0.3 : 0,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Position in 3D space
      const xPos = -lengthUnits / 2 + ftToUnits(rect.x + rect.width / 2);
      const zPos = -widthUnits / 2 + ftToUnits(rect.y + rect.height / 2);

      mesh.position.set(xPos, -1, zPos);
      moduleGroup.add(mesh);
    });
  }, [design.fixtures, catalog, shellDimensions, selectedIds]);

  // Snapshot handler
  const handleSnapshot = () => {
    if (!rendererRef.current) return;

    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "readybuilt-design.png";
    link.click();
  };

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="w-full overflow-hidden rounded-xl border border-surface-muted/40"
        style={{ height: `${height}px` }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!snapshotReady}
        onClick={handleSnapshot}
        className="w-full"
      >
        {snapshotReady ? "Download snapshot" : "Loading..."}
      </Button>
    </div>
  );
}
