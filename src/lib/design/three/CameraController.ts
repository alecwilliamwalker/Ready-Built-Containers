/**
 * CameraController - Manages camera views and controls
 * Handles OrbitControls, PointerLockControls, and camera presets
 */

import * as THREE from "three";
import { OrbitControls, PointerLockControls, TransformControls } from "three-stdlib";
import { CAMERA_SETTINGS, ftToUnits } from "./constants";

export type CameraView = "iso" | "top" | "front" | "right" | "first-person";

export type CameraControllerConfig = {
  shellLengthFt: number;
  enableTransformControls?: boolean;
};

export type CameraControllerCallbacks = {
  onPointerLock?: () => void;
  onPointerUnlock?: () => void;
  onTransformDraggingChanged?: (isDragging: boolean) => void;
};

type MoveState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
};

/**
 * CameraController manages all camera-related functionality
 */
export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public orbitControls: OrbitControls;
  public pointerLockControls: PointerLockControls;
  public transformControls: TransformControls | null = null;

  private domElement: HTMLElement;
  private scene: THREE.Scene;
  private config: CameraControllerConfig;
  private callbacks: CameraControllerCallbacks = {};
  private currentView: CameraView = "iso";
  private isPointerLocked = false;
  private moveState: MoveState = { forward: false, backward: false, left: false, right: false };
  private clock: THREE.Clock;

  // Event handler references for cleanup
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundPointerLock: () => void;
  private boundPointerUnlock: () => void;
  private boundTransformDragging: (event: { value: boolean }) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    scene: THREE.Scene,
    config: CameraControllerConfig
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.scene = scene;
    this.config = config;
    this.clock = new THREE.Clock();

    // Create OrbitControls
    this.orbitControls = new OrbitControls(camera, domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = CAMERA_SETTINGS.DAMPING_FACTOR;
    this.orbitControls.minDistance = CAMERA_SETTINGS.MIN_DISTANCE;
    this.orbitControls.maxDistance = CAMERA_SETTINGS.MAX_DISTANCE;
    this.orbitControls.maxPolarAngle = CAMERA_SETTINGS.MAX_POLAR_ANGLE;

    // Create PointerLockControls
    this.pointerLockControls = new PointerLockControls(camera, domElement);

    // Create TransformControls if enabled
    if (config.enableTransformControls) {
      this.transformControls = new TransformControls(camera, domElement);
      scene.add(this.transformControls);
    }

    // Bind event handlers
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundPointerLock = this.handlePointerLock.bind(this);
    this.boundPointerUnlock = this.handlePointerUnlock.bind(this);
    this.boundTransformDragging = this.handleTransformDragging.bind(this);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Set callbacks for camera events
   */
  setCallbacks(callbacks: CameraControllerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Update on each animation frame
   * Call this from your animation loop
   */
  update(): void {
    if (this.isPointerLocked) {
      const delta = this.clock.getDelta();
      const speed = CAMERA_SETTINGS.FIRST_PERSON_SPEED * delta;

      if (this.moveState.forward) this.pointerLockControls.moveForward(speed);
      if (this.moveState.backward) this.pointerLockControls.moveForward(-speed);
      if (this.moveState.right) this.pointerLockControls.moveRight(speed);
      if (this.moveState.left) this.pointerLockControls.moveRight(-speed);
    } else {
      this.orbitControls.update();
    }
  }

  /**
   * Set camera to a preset view
   */
  setView(view: CameraView): void {
    if (view === "first-person") {
      this.enterFirstPerson();
      return;
    }

    // Exit first-person if active
    if (this.isPointerLocked) {
      this.pointerLockControls.unlock();
    }

    const lengthUnits = ftToUnits(this.config.shellLengthFt);
    const distance = lengthUnits * 2;

    switch (view) {
      case "iso":
        this.camera.position.set(distance * 0.75, distance * 0.6, distance * 0.75);
        break;
      case "top":
        // Small offset to avoid gimbal lock
        this.camera.position.set(0, distance, 0.01);
        break;
      case "front":
        this.camera.position.set(0.01, 0, distance);
        break;
      case "right":
        this.camera.position.set(distance, 0, 0.01);
        break;
    }

    // Update controls target and look at
    this.orbitControls.target.set(0, 0, 0);
    this.camera.lookAt(0, 0, 0);
    this.orbitControls.update();
    this.orbitControls.saveState();

    this.currentView = view;
  }

  /**
   * Enter first-person view mode
   */
  enterFirstPerson(): void {
    this.pointerLockControls.lock();
  }

  /**
   * Exit first-person view mode
   */
  exitFirstPerson(): void {
    this.pointerLockControls.unlock();
  }

  /**
   * Get current view mode
   */
  getCurrentView(): CameraView {
    return this.currentView;
  }

  /**
   * Check if pointer is locked (first-person mode)
   */
  isLocked(): boolean {
    return this.isPointerLocked;
  }

  /**
   * Attach TransformControls to an object
   */
  attachTransformControls(object: THREE.Object3D): void {
    this.transformControls?.attach(object);
  }

  /**
   * Detach TransformControls
   */
  detachTransformControls(): void {
    this.transformControls?.detach();
  }

  /**
   * Toggle TransformControls mode between translate and rotate
   */
  toggleTransformMode(): "translate" | "rotate" {
    if (!this.transformControls) return "translate";
    
    const newMode = this.transformControls.getMode() === "translate" ? "rotate" : "translate";
    this.transformControls.setMode(newMode);
    return newMode;
  }

  /**
   * Get current TransformControls mode
   */
  getTransformMode(): "translate" | "rotate" | "scale" {
    return this.transformControls?.getMode() ?? "translate";
  }

  /**
   * Get the currently attached object from TransformControls
   */
  getAttachedObject(): THREE.Object3D | undefined {
    // TransformControls has a private 'object' property but we can access it via typecast
    if (!this.transformControls) return undefined;
    return (this.transformControls as unknown as { object?: THREE.Object3D }).object;
  }

  /**
   * Check if TransformControls is currently dragging
   */
  isTransformDragging(): boolean {
    return this.transformControls?.dragging ?? false;
  }

  /**
   * Update config (e.g., when shell dimensions change)
   */
  updateConfig(config: Partial<CameraControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    // Remove event listeners
    window.removeEventListener("keydown", this.boundKeyDown);
    window.removeEventListener("keyup", this.boundKeyUp);
    this.pointerLockControls.removeEventListener("lock", this.boundPointerLock);
    this.pointerLockControls.removeEventListener("unlock", this.boundPointerUnlock);
    
    if (this.transformControls) {
      this.transformControls.removeEventListener("dragging-changed", this.boundTransformDragging as any);
      this.scene.remove(this.transformControls);
      this.transformControls.dispose();
    }

    // Dispose controls
    this.orbitControls.dispose();
    this.pointerLockControls.dispose();

    // Reset state
    this.callbacks = {};
    this.moveState = { forward: false, backward: false, left: false, right: false };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private setupEventListeners(): void {
    // Keyboard controls for first-person movement
    window.addEventListener("keydown", this.boundKeyDown);
    window.addEventListener("keyup", this.boundKeyUp);

    // Pointer lock events
    this.pointerLockControls.addEventListener("lock", this.boundPointerLock);
    this.pointerLockControls.addEventListener("unlock", this.boundPointerUnlock);

    // Transform controls events
    if (this.transformControls) {
      this.transformControls.addEventListener("dragging-changed", this.boundTransformDragging as any);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isPointerLocked) return;

    switch (e.code) {
      case "KeyW":
        this.moveState.forward = true;
        break;
      case "KeyS":
        this.moveState.backward = true;
        break;
      case "KeyA":
        this.moveState.left = true;
        break;
      case "KeyD":
        this.moveState.right = true;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case "KeyW":
        this.moveState.forward = false;
        break;
      case "KeyS":
        this.moveState.backward = false;
        break;
      case "KeyA":
        this.moveState.left = false;
        break;
      case "KeyD":
        this.moveState.right = false;
        break;
    }
  }

  private handlePointerLock(): void {
    this.isPointerLocked = true;
    this.orbitControls.enabled = false;
    this.currentView = "first-person";
    this.callbacks.onPointerLock?.();
  }

  private handlePointerUnlock(): void {
    this.isPointerLocked = false;
    this.orbitControls.enabled = true;
    // Reset move state
    this.moveState = { forward: false, backward: false, left: false, right: false };
    this.callbacks.onPointerUnlock?.();
  }

  private handleTransformDragging(event: { value: boolean }): void {
    // Disable orbit controls while transforming
    this.orbitControls.enabled = !event.value;
    this.callbacks.onTransformDraggingChanged?.(event.value);
  }
}

