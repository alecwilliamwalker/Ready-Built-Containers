/**
 * SceneManager - Manages Three.js scene lifecycle
 * Encapsulates scene creation, animation loop, and disposal
 */

import * as THREE from "three";
import {
  COLORS,
  CAMERA_SETTINGS,
  LIGHTING,
  SCENE_DIMENSIONS,
  ftToUnits,
} from "./constants";
import { ZoneWallRenderer } from "./ZoneWallRenderer";
import { EnvironmentManager } from "./Environment";
import { ContainerWallsRenderer, WallSide } from "./ContainerWalls";
import type { ZoneConfig, FixtureConfig, ModuleCatalogItem } from "@/types/design";

export type ShellDimensions = {
  lengthFt: number;
  widthFt: number;
  heightFt: number;
};

export type SceneManagerConfig = {
  shell: ShellDimensions;
  showGrid?: boolean;
  showHelpers?: boolean;
  enableShadows?: boolean;
  showEnvironment?: boolean;
  showContainerWalls?: boolean;
};

export type SceneManagerCallbacks = {
  onRender?: () => void;
  onResize?: (width: number, height: number) => void;
};

/**
 * Manages the Three.js scene lifecycle independent of React
 */
export class SceneManager {
  // Core Three.js objects
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Groups for organization
  public moduleGroup: THREE.Group;
  public wallGroup: THREE.Group;
  public helperGroup: THREE.Group;
  public debugGroup: THREE.Group;
  
  // Zone wall renderer
  public zoneWallRenderer: ZoneWallRenderer;
  
  // Environment and container walls
  public environmentManager: EnvironmentManager;
  public containerWallsRenderer: ContainerWallsRenderer;
  public containerWallsGroup: THREE.Group;

  // Scene elements
  private gridHelper: THREE.GridHelper;
  private shellLines: THREE.LineSegments;
  private shellGeometry: THREE.BoxGeometry;
  private debugOrigin: THREE.Mesh;

  // State
  private container: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private config: SceneManagerConfig;
  private callbacks: SceneManagerCallbacks = {};
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: SceneManagerConfig) {
    this.config = config;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.SCENE_BACKGROUND);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_SETTINGS.FOV,
      1, // Will be updated on mount
      CAMERA_SETTINGS.NEAR,
      CAMERA_SETTINGS.FAR
    );
    this.setInitialCameraPosition();

    // Create renderer (will attach to container later)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setClearColor(COLORS.SCENE_BACKGROUND, 1);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    if (config.enableShadows !== false) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Create groups
    this.moduleGroup = new THREE.Group();
    this.moduleGroup.name = "ModuleGroup";
    this.wallGroup = new THREE.Group();
    this.wallGroup.name = "WallGroup";
    this.helperGroup = new THREE.Group();
    this.helperGroup.name = "HelperGroup";
    this.helperGroup.visible = config.showHelpers ?? false;
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = "DebugGroup";
    
    // Create zone wall renderer
    this.zoneWallRenderer = new ZoneWallRenderer(this.wallGroup);
    
    // Create container walls group and renderer
    this.containerWallsGroup = new THREE.Group();
    this.containerWallsGroup.name = "ContainerWalls";
    this.containerWallsRenderer = new ContainerWallsRenderer(this.containerWallsGroup);
    
    // Create environment manager
    const floorY = -ftToUnits(config.shell.heightFt) / 2;
    this.environmentManager = new EnvironmentManager(this.scene, floorY);

    // Setup scene contents
    this.setupLights();
    this.gridHelper = this.createGrid();
    this.shellGeometry = this.createShellGeometry();
    this.shellLines = this.createShellWireframe(this.shellGeometry);
    this.debugOrigin = this.createDebugOrigin();
    this.setupHelpers();
    
    // Initialize environment (sky, ground, trees)
    if (config.showEnvironment !== false) {
      this.environmentManager.init(config.shell.lengthFt, config.shell.widthFt);
    }

    // Add everything to scene
    this.scene.add(this.gridHelper);
    this.scene.add(this.shellLines);
    this.scene.add(this.debugOrigin);
    this.scene.add(this.moduleGroup);
    this.scene.add(this.wallGroup);
    this.scene.add(this.containerWallsGroup);
    this.scene.add(this.helperGroup);
    this.scene.add(this.debugGroup);
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Mount the renderer to a DOM container
   */
  mount(container: HTMLElement, callbacks?: SceneManagerCallbacks): void {
    this.container = container;
    this.callbacks = callbacks ?? {};

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    container.appendChild(this.renderer.domElement);

    // Setup resize observer
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(container);
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Unmount and cleanup
   */
  dispose(): void {
    this.stop();

    // Disconnect resize observer
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Remove canvas from DOM
    if (this.container && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }

    // Dispose scene contents
    this.disposeSceneContents();

    // Dispose renderer
    this.renderer.dispose();

    this.container = null;
    this.callbacks = {};
  }

  /**
   * Force a single render (for screenshots, etc.)
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get canvas data URL for snapshots
   */
  getSnapshot(type: "image/png" | "image/jpeg" = "image/png"): string {
    this.render();
    return this.renderer.domElement.toDataURL(type);
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Update shell dimensions
   */
  updateShell(shell: ShellDimensions): void {
    this.config.shell = shell;

    // Update shell wireframe
    this.scene.remove(this.shellLines);
    this.shellGeometry.dispose();
    this.shellGeometry = this.createShellGeometry();
    this.shellLines = this.createShellWireframe(this.shellGeometry);
    this.scene.add(this.shellLines);

    // Update grid position
    const heightUnits = ftToUnits(shell.heightFt);
    this.gridHelper.position.y = -heightUnits / 2;
    
    // Update environment floor level
    this.environmentManager.updateFloorLevel(-heightUnits / 2);

    // Update camera position
    this.setInitialCameraPosition();
  }

  /**
   * Toggle grid visibility
   */
  setGridVisible(visible: boolean): void {
    this.gridHelper.visible = visible;
  }

  /**
   * Toggle helper overlays visibility
   */
  setHelpersVisible(visible: boolean): void {
    this.helperGroup.visible = visible;
  }

  /**
   * Update zone walls based on zone configuration
   * Creates walls only at zone boundaries where zones share edges
   * NOTE: Interior walls are now placeable fixtures (fixture-wall)
   */
  updateZoneWalls(zones: ZoneConfig[]): void {
    this.zoneWallRenderer.render(zones, this.config.shell);
  }

  /**
   * Toggle zone wall visibility
   */
  setZoneWallsVisible(visible: boolean): void {
    this.wallGroup.visible = visible;
  }

  /**
   * Update container walls based on fixtures (for window/door openings)
   * @param openSides - Sides to leave open for viewing. Default is ["front", "right"] for good camera visibility.
   */
  updateContainerWalls(
    fixtures: FixtureConfig[],
    catalog: Record<string, ModuleCatalogItem>,
    openSides: WallSide | WallSide[] = ["front", "right"]
  ): void {
    this.containerWallsRenderer.render(this.config.shell, fixtures, catalog, openSides);
  }

  /**
   * Toggle container walls visibility
   */
  setContainerWallsVisible(visible: boolean): void {
    this.containerWallsGroup.visible = visible;
  }

  /**
   * Toggle environment visibility (sky, ground, trees)
   */
  setEnvironmentVisible(visible: boolean): void {
    this.environmentManager.setVisible(visible);
  }

  /**
   * Get renderer stats
   */
  getRendererStats(): { calls: number; triangles: number; points: number } {
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      points: this.renderer.info.render.points,
    };
  }

  // ============================================================================
  // Private Setup Methods
  // ============================================================================

  private setInitialCameraPosition(): void {
    const lengthUnits = ftToUnits(this.config.shell.lengthFt);
    const defaultDistance = Math.max(lengthUnits, 15);
    this.camera.position.set(defaultDistance, defaultDistance * 0.8, defaultDistance);
    this.camera.lookAt(0, 0, 0);
  }

  private setupLights(): void {
    // Sun light for outdoor scene
    const sunLight = new THREE.DirectionalLight(0xFFE4B5, 0.4); // Warm sunlight
    sunLight.position.set(100, 150, 50);
    this.scene.add(sunLight);
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, LIGHTING.AMBIENT_INTENSITY);
    this.scene.add(ambientLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, LIGHTING.HEMISPHERE_INTENSITY);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    // Directional light with shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, LIGHTING.DIRECTIONAL_INTENSITY);
    directionalLight.position.set(20, 30, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = LIGHTING.SHADOW_MAP_SIZE;
    directionalLight.shadow.mapSize.height = LIGHTING.SHADOW_MAP_SIZE;
    directionalLight.shadow.camera.left = -LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.right = LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.top = LIGHTING.SHADOW_CAMERA_SIZE;
    directionalLight.shadow.camera.bottom = -LIGHTING.SHADOW_CAMERA_SIZE;
    this.scene.add(directionalLight);
  }

  private createGrid(): THREE.GridHelper {
    const gridHelper = new THREE.GridHelper(
      SCENE_DIMENSIONS.GRID_SIZE,
      SCENE_DIMENSIONS.GRID_DIVISIONS,
      COLORS.GRID_PRIMARY,
      COLORS.GRID_SECONDARY
    );
    gridHelper.position.y = -ftToUnits(this.config.shell.heightFt) / 2;
    gridHelper.visible = this.config.showGrid ?? true;
    return gridHelper;
  }

  private createShellGeometry(): THREE.BoxGeometry {
    return new THREE.BoxGeometry(
      ftToUnits(this.config.shell.lengthFt),
      ftToUnits(this.config.shell.heightFt),
      ftToUnits(this.config.shell.widthFt)
    );
  }

  private createShellWireframe(geometry: THREE.BoxGeometry): THREE.LineSegments {
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ color: COLORS.SHELL_WIREFRAME, linewidth: 2 });
    return new THREE.LineSegments(edges, material);
  }

  private createDebugOrigin(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: COLORS.DEBUG_ORIGIN });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false; // Hidden by default
    return mesh;
  }

  private setupHelpers(): void {
    const { lengthFt, widthFt, heightFt } = this.config.shell;
    const lengthUnits = ftToUnits(lengthFt);
    const widthUnits = ftToUnits(widthFt);
    const heightUnits = ftToUnits(heightFt);

    const helperScale = Math.max(lengthUnits, widthUnits, heightUnits) || 1;

    // Axes helper
    const axesHelper = new THREE.AxesHelper(helperScale);
    this.helperGroup.add(axesHelper);

    // Polar grid
    const polarGrid = new THREE.PolarGridHelper(
      helperScale * 1.2,
      8,
      4,
      64,
      COLORS.HELPER_POLAR_PRIMARY,
      COLORS.HELPER_POLAR_SECONDARY
    );
    this.helperGroup.add(polarGrid);

    // Shell bounds helper
    const shellBounds = new THREE.Box3(
      new THREE.Vector3(-lengthUnits / 2, -heightUnits / 2, -widthUnits / 2),
      new THREE.Vector3(lengthUnits / 2, heightUnits / 2, widthUnits / 2)
    );
    const boundsHelper = new THREE.Box3Helper(shellBounds, new THREE.Color(COLORS.SHELL_BOUNDS));
    this.helperGroup.add(boundsHelper);
  }

  // ============================================================================
  // Animation Loop
  // ============================================================================

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    // Notify callback before render
    this.callbacks.onRender?.();

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  // ============================================================================
  // Resize Handling
  // ============================================================================

  private handleResize = (entries: ResizeObserverEntry[]): void => {
    if (!this.container) return;

    const entry = entries[0];
    if (!entry) return;

    const { width, height } = entry.contentRect;
    if (width === 0 || height === 0) return;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.callbacks.onResize?.(width, height);
  };

  // ============================================================================
  // Cleanup
  // ============================================================================

  private disposeSceneContents(): void {
    // Dispose geometries and materials
    this.shellGeometry.dispose();
    (this.shellLines.material as THREE.Material).dispose();
    (this.debugOrigin.geometry as THREE.BufferGeometry).dispose();
    (this.debugOrigin.material as THREE.Material).dispose();

    // Dispose helper group contents
    this.helperGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          (child.material as THREE.Material)?.dispose();
        }
      }
    });

    // Dispose debug group contents
    this.debugGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          (child.material as THREE.Material)?.dispose();
        }
      }
    });

    // Dispose zone wall renderer
    this.zoneWallRenderer.dispose();
    
    // Dispose container walls renderer
    this.containerWallsRenderer.dispose();
    
    // Dispose environment
    this.environmentManager.dispose();
    
    // Clear groups
    this.moduleGroup.clear();
    this.wallGroup.clear();
    this.containerWallsGroup.clear();
    this.helperGroup.clear();
    this.debugGroup.clear();
  }
}

