/**
 * Shared materials and helper functions for fixture geometry
 */

import * as THREE from "three";

// ============================================================================
// Color Palette (matching cabin reference photos)
// ============================================================================

export const FIXTURE_MATERIALS = {
  // Wood cabinets - warm brown
  WOOD_CABINET: 0x8B5A2B,
  // White porcelain fixtures (toilet, sink)
  WHITE_PORCELAIN: 0xF5F5F5,
  // Countertops - light gray
  COUNTERTOP: 0xD3D3D3,
  // Refrigerator - dark charcoal
  APPLIANCE_DARK: 0x2F2F2F,
  // Stove/Range - stainless
  APPLIANCE_STAINLESS: 0x8A8A8A,
  // Bed frame - dark metal
  BED_FRAME: 0x4A4A4A,
  // Mattress/cushions - cream
  MATTRESS: 0xE8DCC8,
  // Pillows - white
  PILLOW: 0xFAFAFA,
  // Shower base - white
  SHOWER_BASE: 0xE8E8E8,
  // Glass/transparent
  GLASS: 0xADD8E6,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

export function createMaterial(color: number, options?: {
  transparent?: boolean;
  opacity?: number;
  metalness?: number;
  roughness?: number;
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1,
    metalness: options?.metalness ?? 0.1,
    roughness: options?.roughness ?? 0.8,
    side: THREE.DoubleSide,
  });
}


