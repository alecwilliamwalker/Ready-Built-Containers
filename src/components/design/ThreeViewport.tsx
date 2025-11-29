"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import type { DesignConfig, ModuleCatalogItem, FixtureConfig } from "@/types/design";
import {
  SceneManager,
  CameraController,
  FixtureRenderer,
  FloorPlaneDragController,
  CameraView,
  COLORS,
  ftToUnits,
  unitsToFt,
  getFixtureHeightFt,
  getFixtureColor,
} from "@/lib/design/three";
import { PositionInputPanel } from "./PositionInputPanel";

// Debug mode - only show debug UI in development
const DEBUG_MODE = process.env.NODE_ENV === "development";

export type ThreeViewportProps = {
  design: DesignConfig;
  catalog: Record<string, ModuleCatalogItem>;
  selectedIds?: string[];
  pendingPlacement?: ModuleCatalogItem | null;
  pendingPlacementRotation?: 0 | 90 | 180 | 270;
  onPlaceFixture?: (catalogKey: string, coords: { xFt: number; yFt: number }) => void;
  onSelectFixture?: (fixtureId: string) => void;
  onUpdateFixture?: (id: string, updates: { xFt?: number; yFt?: number; rotationDeg?: 0 | 90 | 180 | 270 }) => void;
};

// Movement increment in feet for arrow key controls (matches snap grid)
const ARROW_MOVE_INCREMENT_FT = 0.25;

export function ThreeViewport({
  design,
  catalog,
  selectedIds = [],
  pendingPlacement,
  pendingPlacementRotation = 0,
  onPlaceFixture,
  onSelectFixture,
  onUpdateFixture,
}: ThreeViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Core Three.js managers
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const fixtureRendererRef = useRef<FixtureRenderer | null>(null);
  const dragControllerRef = useRef<FloorPlaneDragController | null>(null);

  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [currentView, setCurrentView] = useState<CameraView>("iso");
  const [isLocked, setIsLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showPositionPanel, setShowPositionPanel] = useState(true);

  // Debug state (only used in dev mode)
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [rendererStats, setRendererStats] = useState({ calls: 0, triangles: 0, points: 0 });
  const lastStatsUpdate = useRef(0);

  // Placement mode refs - using refs so event handlers in useEffect can access current values
  const pendingPlacementRef = useRef<ModuleCatalogItem | null>(null);
  const onPlaceFixtureRef = useRef<((catalogKey: string, coords: { xFt: number; yFt: number }) => void) | undefined>(undefined);
  const onUpdateFixtureRef = useRef<typeof onUpdateFixture>(undefined);
  const ghostMeshRef = useRef<THREE.Mesh | null>(null);
  const floorPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  // Design fixtures ref for checking locked state in event handlers
  const designFixturesRef = useRef(design.fixtures);

  // Memoized config
  const shellConfig = useMemo(() => ({
    lengthFt: design.shell.lengthFt,
    widthFt: design.shell.widthFt,
    heightFt: design.shell.heightFt,
  }), [design.shell.lengthFt, design.shell.widthFt, design.shell.heightFt]);

  const fixtureConfig = useMemo(() => ({
    shellLengthFt: design.shell.lengthFt,
    shellWidthFt: design.shell.widthFt,
    shellHeightFt: design.shell.heightFt,
  }), [design.shell.lengthFt, design.shell.widthFt, design.shell.heightFt]);

  // Logging helper
  const addLog = useCallback((msg: string) => {
    if (!DEBUG_MODE) return;
    console.log(msg);
    setLogs(prev => [...prev.slice(-50), msg]);
  }, []);

  // Keep callback refs in sync with props so event handlers can access current values
  useEffect(() => {
    pendingPlacementRef.current = pendingPlacement ?? null;
    onPlaceFixtureRef.current = onPlaceFixture;
    onUpdateFixtureRef.current = onUpdateFixture;
    designFixturesRef.current = design.fixtures;
  }, [pendingPlacement, onPlaceFixture, onUpdateFixture, design.fixtures]);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    addLog(`[ThreeViewport] Init shell(ft) L=${shellConfig.lengthFt} W=${shellConfig.widthFt} H=${shellConfig.heightFt}`);

    // Create scene manager
    const sceneManager = new SceneManager({
      shell: shellConfig,
      showGrid,
      enableShadows: true,
    });

    // Create camera controller (without TransformControls - we use floor drag now)
    const cameraController = new CameraController(
      sceneManager.camera,
      containerRef.current,
      sceneManager.scene,
      {
        shellLengthFt: shellConfig.lengthFt,
        enableTransformControls: false, // Disabled - using floor plane drag instead
      }
    );

    // Setup camera callbacks
    cameraController.setCallbacks({
      onPointerLock: () => {
        setIsLocked(true);
        addLog("[ThreeViewport] Pointer lock engaged");
      },
      onPointerUnlock: () => {
        setIsLocked(false);
        setCurrentView("iso");
      },
    });

    // Create fixture renderer
    const fixtureRenderer = new FixtureRenderer(sceneManager.moduleGroup, fixtureConfig);

    // Mount and start
    sceneManager.mount(containerRef.current, {
      onRender: () => {
        cameraController.update();

        // Throttled stats update (every 500ms)
        if (DEBUG_MODE && showDebug) {
          const now = Date.now();
          if (now - lastStatsUpdate.current > 500) {
            lastStatsUpdate.current = now;
            setRendererStats(sceneManager.getRendererStats());
          }
        }
      },
    });
    sceneManager.start();

    // Setup raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Helper to find best fixture from intersections (prefer non-walls over walls)
    const findBestIntersection = (intersects: THREE.Intersection[]): THREE.Object3D | null => {
      let wallTarget: THREE.Object3D | null = null;
      
      for (const intersect of intersects) {
        let target = intersect.object;
        while (target.parent && target.parent !== sceneManager.moduleGroup) {
          target = target.parent;
        }
        
        if (target.userData.fixtureId) {
          // If not a wall, select it immediately
          if (!target.userData.isWall) {
            return target;
          }
          // Remember first wall as fallback
          if (!wallTarget) {
            wallTarget = target;
          }
        }
      }
      
      return wallTarget; // Return wall if no other fixture found
    };

    // Set floor plane at correct Y level (floor is at -heightUnits/2)
    const heightUnits = ftToUnits(shellConfig.heightFt);
    const floorY = -heightUnits / 2;
    floorPlaneRef.current.set(new THREE.Vector3(0, 1, 0), -floorY);

    // Hover detection handler
    const handlePointerMove = (event: PointerEvent) => {
      if (cameraController.isLocked()) {
        fixtureRenderer.setHovered(null);
        return;
      }

      const rect = sceneManager.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneManager.camera);

      // Handle placement mode ghost preview
      if (pendingPlacementRef.current) {
        // Raycast to floor plane to get placement position
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlaneRef.current, intersectPoint)) {
          // Convert from 3D units to 2D feet coordinates
          // 3D origin is at center, 2D origin is bottom-left
          const xFt = unitsToFt(intersectPoint.x) + shellConfig.lengthFt / 2;
          const yFt = unitsToFt(intersectPoint.z) + shellConfig.widthFt / 2;
          
          // Snap to 0.25ft grid (allows placing 0.5ft-deep fixtures flush against walls)
          const snappedXFt = Math.round(xFt * 4) / 4;
          const snappedYFt = Math.round(yFt * 4) / 4;
          
          // Update ghost mesh position (convert back to 3D coordinates)
          if (ghostMeshRef.current) {
            const x3d = ftToUnits(snappedXFt) - ftToUnits(shellConfig.lengthFt) / 2;
            const z3d = ftToUnits(snappedYFt) - ftToUnits(shellConfig.widthFt) / 2;
            ghostMeshRef.current.position.setX(x3d);
            ghostMeshRef.current.position.setZ(z3d);
          }
        }
        sceneManager.renderer.domElement.style.cursor = "crosshair";
        return;
      }

      const intersects = raycaster.intersectObjects(sceneManager.moduleGroup.children, true);

      const target = findBestIntersection(intersects);
      
      if (target && target.userData.fixtureId) {
        fixtureRenderer.setHovered(target.userData.fixtureId);
        sceneManager.renderer.domElement.style.cursor = "pointer";
      } else {
        fixtureRenderer.setHovered(null);
        sceneManager.renderer.domElement.style.cursor = "";
      }
    };

    // Selection handler (click without drag)
    const handlePointerDown = (event: PointerEvent) => {
      if (cameraController.isLocked()) return;
      if (event.button !== 0) return; // Only left click

      const rect = sceneManager.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, sceneManager.camera);

      // Handle placement mode click
      if (pendingPlacementRef.current && onPlaceFixtureRef.current) {
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(floorPlaneRef.current, intersectPoint)) {
          // Convert from 3D units to 2D feet coordinates
          const xFt = unitsToFt(intersectPoint.x) + shellConfig.lengthFt / 2;
          const yFt = unitsToFt(intersectPoint.z) + shellConfig.widthFt / 2;
          
          // Snap to 0.25ft grid (allows placing 0.5ft-deep fixtures flush against walls)
          const snappedXFt = Math.round(xFt * 4) / 4;
          const snappedYFt = Math.round(yFt * 4) / 4;
          
          addLog(`[ThreeViewport] Placing fixture at (${snappedXFt.toFixed(2)}, ${snappedYFt.toFixed(2)}) ft`);
          onPlaceFixtureRef.current(pendingPlacementRef.current.key, { xFt: snappedXFt, yFt: snappedYFt });
        }
        return;
      }

      const intersects = raycaster.intersectObjects(sceneManager.moduleGroup.children, true);

      const target = findBestIntersection(intersects);

      if (target && target.userData.fixtureId && onSelectFixture) {
        // Check if fixture is locked before selecting
        const fixture = designFixturesRef.current.find(f => f.id === target.userData.fixtureId);
        if (fixture?.locked) {
          // Don't allow selecting locked fixtures
          addLog(`[ThreeViewport] Selection blocked - fixture is locked: ${fixture.id}`);
          return;
        }
        onSelectFixture(target.userData.fixtureId);
      } else {
        onSelectFixture?.("");
      }
    };

    // Create floor plane drag controller
    const dragController = new FloorPlaneDragController(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      sceneManager.moduleGroup,
      sceneManager.scene,
      {
        lengthFt: shellConfig.lengthFt,
        widthFt: shellConfig.widthFt,
        heightFt: shellConfig.heightFt,
      }
    );

    // Setup drag callbacks
    dragController.setCallbacks({
      canDrag: (fixtureId) => {
        // Check if fixture is locked - use ref to get current fixtures
        const fixture = designFixturesRef.current.find(f => f.id === fixtureId);
        if (fixture?.locked) {
          addLog(`[ThreeViewport] Drag blocked - fixture is locked: ${fixtureId}`);
          return false;
        }
        return true;
      },
      onDragStart: (fixtureId) => {
        setIsDragging(true);
        cameraController.orbitControls.enabled = false;
        addLog(`[ThreeViewport] Drag started: ${fixtureId}`);
      },
      onDragMove: (fixtureId, pos) => {
        // Live preview is handled by the controller
      },
      onDragEnd: (fixtureId, pos) => {
        setIsDragging(false);
        cameraController.orbitControls.enabled = true;
        addLog(`[ThreeViewport] Drag ended: ${fixtureId} at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);

        // Update fixture position - use ref to get current callback
        if (onUpdateFixtureRef.current) {
          onUpdateFixtureRef.current(fixtureId, { xFt: pos.x, yFt: pos.y });
        }
      },
    });

    sceneManager.renderer.domElement.addEventListener("pointermove", handlePointerMove);
    sceneManager.renderer.domElement.addEventListener("pointerdown", handlePointerDown);

    // Store refs
    sceneManagerRef.current = sceneManager;
    cameraControllerRef.current = cameraController;
    fixtureRendererRef.current = fixtureRenderer;
    dragControllerRef.current = dragController;

    // Cleanup
    return () => {
      sceneManager.renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      sceneManager.renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      dragController.dispose();
      fixtureRenderer.dispose();
      cameraController.dispose();
      sceneManager.dispose();

      sceneManagerRef.current = null;
      cameraControllerRef.current = null;
      fixtureRendererRef.current = null;
      dragControllerRef.current = null;
    };
  }, [shellConfig]); // Re-init if shell changes

  // Get selected fixture for position panel
  const selectedFixture = useMemo(() => {
    if (selectedIds.length !== 1) return null;
    return design.fixtures.find(f => f.id === selectedIds[0]) || null;
  }, [selectedIds, design.fixtures]);

  // Update grid visibility
  useEffect(() => {
    sceneManagerRef.current?.setGridVisible(showGrid);
  }, [showGrid]);

  // Keyboard shortcuts for 3D view (arrow keys)
  // Note: Undo/Redo are handled by the parent DesignStudio component
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Arrow key movement for selected fixtures
      // Skip if no fixture selected, no update handler, or in first-person mode
      if (selectedIds.length === 0 || !onUpdateFixture || isLocked) return;

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      // Prevent default scrolling behavior
      e.preventDefault();

      // Calculate movement delta based on current view
      let deltaX = 0;
      let deltaY = 0;
      const increment = ARROW_MOVE_INCREMENT_FT;

      switch (currentView) {
        case 'top':
          // Plan view: looking down from above
          // ArrowLeft/Right = X axis (container length)
          // ArrowUp/Down = Y axis (container width)
          if (e.key === 'ArrowLeft') deltaX = -increment;
          if (e.key === 'ArrowRight') deltaX = increment;
          if (e.key === 'ArrowUp') deltaY = -increment;
          if (e.key === 'ArrowDown') deltaY = increment;
          break;

        case 'front':
          // Front elevation: looking at the front of container (from +Z toward -Z)
          // ArrowLeft/Right = X axis (container length)
          // ArrowUp/Down = Y axis (container width - moving toward/away from viewer)
          if (e.key === 'ArrowLeft') deltaX = -increment;
          if (e.key === 'ArrowRight') deltaX = increment;
          if (e.key === 'ArrowUp') deltaY = -increment; // Away from viewer
          if (e.key === 'ArrowDown') deltaY = increment; // Toward viewer
          break;

        case 'right':
          // Right elevation: looking from the right side (from +X toward -X)
          // ArrowLeft/Right = Y axis (container width)
          // ArrowUp/Down = X axis (container length - moving toward/away from viewer)
          if (e.key === 'ArrowLeft') deltaY = increment;
          if (e.key === 'ArrowRight') deltaY = -increment;
          if (e.key === 'ArrowUp') deltaX = increment; // Away from viewer
          if (e.key === 'ArrowDown') deltaX = -increment; // Toward viewer
          break;

        case 'iso':
        default:
          // Isometric view: diagonal perspective
          // Use similar mapping to top view for intuitive control
          if (e.key === 'ArrowLeft') deltaX = -increment;
          if (e.key === 'ArrowRight') deltaX = increment;
          if (e.key === 'ArrowUp') deltaY = -increment;
          if (e.key === 'ArrowDown') deltaY = increment;
          break;
      }

      // Skip if no movement
      if (deltaX === 0 && deltaY === 0) return;

      // Update each selected fixture
      selectedIds.forEach(fixtureId => {
        const fixture = design.fixtures.find(f => f.id === fixtureId);
        if (!fixture || fixture.locked) return;

        // Calculate new position with bounds checking
        const newXFt = Math.max(0, Math.min(design.shell.lengthFt, fixture.xFt + deltaX));
        const newYFt = Math.max(0, Math.min(design.shell.widthFt, fixture.yFt + deltaY));

        // Only update if position actually changed
        if (newXFt !== fixture.xFt || newYFt !== fixture.yFt) {
          onUpdateFixture(fixtureId, { xFt: newXFt, yFt: newYFt });
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, onUpdateFixture, currentView, isLocked, design.fixtures, design.shell.lengthFt, design.shell.widthFt]);

  // Sync zone walls (includes bathroom enclosure based on fixtures)
  useEffect(() => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) return;

    addLog(`[ThreeViewport] Updating zone walls for ${design.zones?.length ?? 0} zones`);
    sceneManager.updateZoneWalls(design.zones ?? []);
  }, [design.zones, addLog]);

  // Update container walls (for window/door openings)
  useEffect(() => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) return;

    addLog(`[ThreeViewport] Updating container walls`);
    // Open front and right sides for good camera visibility (camera is at front-right corner)
    sceneManager.updateContainerWalls(design.fixtures, catalog, ["front", "right"]);
  }, [design.fixtures, catalog, addLog]);

  // Sync fixtures
  useEffect(() => {
    const fixtureRenderer = fixtureRendererRef.current;
    const dragController = dragControllerRef.current;
    if (!fixtureRenderer) return;

    // Skip if currently dragging (prevents position reset during drag)
    if (dragController?.isDragging()) return;

    addLog(`[ThreeViewport] Syncing ${design.fixtures.length} fixtures`);
    fixtureRenderer.sync(design.fixtures, catalog, selectedIds, addLog);
  }, [design.fixtures, catalog, selectedIds, addLog]);

  // Manage ghost mesh for placement preview
  useEffect(() => {
    const sceneManager = sceneManagerRef.current;
    if (!sceneManager) return;

    // Remove existing ghost mesh if any
    if (ghostMeshRef.current) {
      sceneManager.scene.remove(ghostMeshRef.current);
      ghostMeshRef.current.geometry.dispose();
      if (Array.isArray(ghostMeshRef.current.material)) {
        ghostMeshRef.current.material.forEach(m => m.dispose());
      } else {
        (ghostMeshRef.current.material as THREE.Material).dispose();
      }
      ghostMeshRef.current = null;
    }

    // Create new ghost mesh if we have a pending placement
    if (pendingPlacement) {
      const footprint = pendingPlacement.footprintFt;
      const lengthFt = footprint.length; // Length in feet (X in 3D)
      const widthFt = footprint.width;   // Width in feet (Z in 3D)
      const heightFt = getFixtureHeightFt(pendingPlacement.category);

      // Convert to Three.js units
      const lengthUnits = ftToUnits(lengthFt);
      const widthUnits = ftToUnits(widthFt);
      const heightUnits = ftToUnits(heightFt);
      const shellHeightUnits = ftToUnits(design.shell.heightFt);
      
      // Get category color
      const fixtureColor = getFixtureColor(pendingPlacement.category);

      const geometry = new THREE.BoxGeometry(lengthUnits, heightUnits, widthUnits);
      const material = new THREE.MeshBasicMaterial({
        color: fixtureColor,
        transparent: true,
        opacity: 0.5,
        wireframe: false,
      });
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x22d3ee, // Cyan wireframe for visibility
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      
      // Create mesh
      const ghost = new THREE.Mesh(geometry, material);
      
      // Position at floor level (Y = -shellHeight/2) + half fixture height to sit on floor
      // Start at center of shell (X=0, Z=0 in 3D coords = center of container)
      const floorY = -shellHeightUnits / 2;
      ghost.position.set(0, floorY + heightUnits / 2, 0);
      ghost.userData.isGhost = true;
      
      // Apply rotation (convert degrees to radians, rotate around Y axis)
      ghost.rotation.y = (pendingPlacementRotation * Math.PI) / 180;

      // Add wireframe overlay
      const wireframeGeometry = new THREE.BoxGeometry(lengthUnits, heightUnits, widthUnits);
      const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      ghost.add(wireframeMesh);

      sceneManager.scene.add(ghost);
      ghostMeshRef.current = ghost;

      addLog(`[ThreeViewport] Created ghost mesh for ${pendingPlacement.label} (${lengthFt}'x${widthFt}'x${heightFt}')`);
    }

    return () => {
      // Cleanup on unmount or when pendingPlacement changes
    };
  }, [pendingPlacement, pendingPlacementRotation, design.shell.lengthFt, design.shell.widthFt, design.shell.heightFt, addLog]);

  // Camera view handler
  const setCameraView = useCallback((view: CameraView) => {
    cameraControllerRef.current?.setView(view);
    setCurrentView(view);
  }, []);

  // Snapshot handler
  const handleSnapshot = useCallback(() => {
    const dataUrl = sceneManagerRef.current?.getSnapshot();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "design-3d-view.png";
    link.click();
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* First Person Instructions */}
      {isLocked && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-black/50 text-white px-4 py-2 rounded text-sm backdrop-blur">
            WASD to move • Mouse to look • ESC to exit
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute right-4 top-4 space-y-2 pointer-events-none">
        <div className="rounded-lg border border-white/10 bg-slate-900/90 p-2 backdrop-blur-sm pointer-events-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
            Camera
          </p>
          <div className="grid grid-cols-2 gap-1">
            {(["iso", "top", "front", "right", "first-person"] as CameraView[]).map((view) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${currentView === view
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
              >
                {view === "first-person" ? "Walk" : view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className="w-full rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 pointer-events-auto"
        >
          {showGrid ? "Hide" : "Show"} Grid
        </button>

        <button
          onClick={() => setShowPositionPanel(!showPositionPanel)}
          className="w-full rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 pointer-events-auto"
        >
          {showPositionPanel ? "Hide" : "Show"} Position
        </button>

        <button
          onClick={handleSnapshot}
          className="w-full rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 pointer-events-auto"
        >
          Snapshot
        </button>

        {DEBUG_MODE && (
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="w-full rounded-lg border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 pointer-events-auto"
          >
            {showDebug ? "Hide" : "Show"} Debug
          </button>
        )}
      </div>

      {/* Position Input Panel (left side) */}
      {showPositionPanel && (
        <div className="absolute left-4 top-4 w-56 pointer-events-auto">
          <PositionInputPanel
            fixture={selectedFixture}
            shellBounds={{ lengthFt: design.shell.lengthFt, widthFt: design.shell.widthFt }}
            onUpdatePosition={onUpdateFixture || (() => { })}
          />
        </div>
      )}

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-slate-900/90 px-4 py-2 backdrop-blur-sm">
        <p className="text-xs font-mono text-white/60">
          <span className="text-white/80">Fixtures:</span> {design.fixtures.length}
          {selectedIds.length > 0 && (
            <>
              <span className="ml-3">
                <span className="text-cyan-400">Selected:</span> {selectedIds.length}
              </span>
              <span className="ml-3 text-white/40">• Drag to move • Arrow keys for fine control</span>
            </>
          )}
          {isDragging && (
            <span className="ml-3 text-yellow-400">Dragging...</span>
          )}
        </p>
      </div>

      {/* Debug Panel (Development Only) */}
      {DEBUG_MODE && showDebug && (
        <DebugPanel
          logs={logs}
          rendererStats={rendererStats}
          onClearLogs={() => setLogs([])}
          sceneManager={sceneManagerRef.current}
          addLog={addLog}
        />
      )}
    </div>
  );
}

// ============================================================================
// Debug Panel Component (Development Only)
// ============================================================================

type DebugPanelProps = {
  logs: string[];
  rendererStats: { calls: number; triangles: number; points: number };
  onClearLogs: () => void;
  sceneManager: SceneManager | null;
  addLog: (msg: string) => void;
};

function DebugPanel({ logs, rendererStats, onClearLogs, sceneManager, addLog }: DebugPanelProps) {
  const [debugOverrideMaterial, setDebugOverrideMaterial] = useState(false);
  const [debugFrustumCulling, setDebugFrustumCulling] = useState(true);
  const [debugIndividualBounds, setDebugIndividualBounds] = useState(false);

  // Apply debug overrides
  useEffect(() => {
    if (!sceneManager) return;

    sceneManager.scene.traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh) {
        obj.frustumCulled = debugFrustumCulling;

        if (debugOverrideMaterial) {
          if (!obj.userData.originalMaterial) {
            obj.userData.originalMaterial = obj.material;
          }
          if (!obj.userData.debugMat) {
            obj.userData.debugMat = new THREE.MeshBasicMaterial({
              color: COLORS.DEBUG_WIREFRAME,
              wireframe: true,
              depthTest: false,
              transparent: true,
              opacity: 0.5,
            });
          }
          obj.material = obj.userData.debugMat;
        } else if (obj.userData.originalMaterial) {
          obj.material = obj.userData.originalMaterial;
        }
      }
    });

    // Update individual bounds helpers
    const debugGroup = sceneManager.debugGroup;

    // Clear old helpers
    const oldHelpers = debugGroup.children.filter((c: THREE.Object3D) => c.userData.isIndividualHelper);
    oldHelpers.forEach((h: THREE.Object3D) => {
      debugGroup.remove(h);
      if (h instanceof THREE.BoxHelper) {
        h.dispose();
      }
    });

    if (debugIndividualBounds) {
      sceneManager.moduleGroup.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          const helper = new THREE.BoxHelper(child, COLORS.DEBUG_BOUNDS_INDIVIDUAL);
          helper.userData.isIndividualHelper = true;
          debugGroup.add(helper);
        }
      });
    }
  }, [sceneManager, debugOverrideMaterial, debugFrustumCulling, debugIndividualBounds]);

  return (
    <div className="absolute top-4 left-4 max-h-[90%] w-96 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm shadow-2xl z-50">
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Debug Console</h3>
        <button onClick={onClearLogs} className="text-xs text-cyan-400 hover:text-cyan-300">Clear</button>
      </div>

      {/* Renderer Stats */}
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 bg-white/5 p-2 text-[10px] font-mono text-white/70">
        <div className="text-center">
          <div className="text-white/40">Draw Calls</div>
          <div className="text-cyan-400">{rendererStats.calls}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40">Triangles</div>
          <div className="text-cyan-400">{rendererStats.triangles}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40">Points</div>
          <div className="text-cyan-400">{rendererStats.points}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-white/10 p-2 space-y-2">
        <div className="text-[10px] font-bold uppercase text-white/40">Diagnostics</div>

        <label className="flex items-center gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            checked={debugOverrideMaterial}
            onChange={e => setDebugOverrideMaterial(e.target.checked)}
          />
          Force X-Ray Material
        </label>

        <label className="flex items-center gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            checked={!debugFrustumCulling}
            onChange={e => setDebugFrustumCulling(!e.target.checked)}
          />
          Disable Frustum Culling
        </label>

        <label className="flex items-center gap-2 text-xs text-white/80">
          <input
            type="checkbox"
            checked={debugIndividualBounds}
            onChange={e => setDebugIndividualBounds(e.target.checked)}
          />
          Show All Bounding Boxes
        </label>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={() => {
              if (!sceneManager) return;
              sceneManager.scene.traverse((o: THREE.Object3D) => {
                addLog(`[Layer] ${o.type} ${o.name || 'unnamed'}: visible=${o.visible}`);
              });
            }}
            className="bg-white/10 hover:bg-white/20 text-xs py-1 rounded text-white/80"
          >
            Log Layers
          </button>
          <button
            onClick={() => {
              if (!sceneManager) return;
              sceneManager.scene.traverse((o: THREE.Object3D) => {
                o.visible = true;
              });
              addLog("Forced all objects visible=true");
            }}
            className="bg-white/10 hover:bg-white/20 text-xs py-1 rounded text-white/80"
          >
            Force Visible
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] text-white/70 max-h-[300px]">
        {logs.length === 0 ? (
          <div className="text-white/30 italic">No logs yet...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
              <span className="mr-2 text-white/30">{i + 1}</span>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
