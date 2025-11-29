import type {
  DesignConfig,
  ModuleCatalogItem,
  ValidationIssue,
  ValidationRule,
} from "@/types/design";
import {
  isInsideShell,
  rectFromFixture,
  rectsOverlap,
  zonesContainingRect,
} from "./geometry";

/**
 * Validates a design configuration against a catalog.
 * Returns an array of validation issues (errors and warnings).
 */
export function validateDesign(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
): ValidationIssue[] {
  const rules: ValidationRule[] = [
    ruleBounds,
    ruleOverlap,
    ruleZoneAllowed,
    // Phase 2: ruleUtilities, ruleClearances, etc.
  ];

  return rules.flatMap((rule) => rule(design, catalog));
}

/**
 * Validation rule: All fixtures must be fully inside the shell bounds.
 */
const ruleBounds: ValidationRule = (design, catalog) => {
  const issues: ValidationIssue[] = [];

  for (const fixture of design.fixtures) {
    const cat = catalog[fixture.catalogKey];
    if (!cat) {
      issues.push({
        id: `UNKNOWN_CATALOG_${fixture.id}`,
        fixtureId: fixture.id,
        level: "error",
        code: "UNKNOWN_CATALOG",
        message: `Fixture references unknown catalog key: ${fixture.catalogKey}`,
      });
      continue;
    }

    const rect = rectFromFixture(fixture, cat);
    if (!isInsideShell(design.shell, rect)) {
      issues.push({
        id: `OUT_OF_BOUNDS_${fixture.id}`,
        fixtureId: fixture.id,
        level: "error",
        code: "OUT_OF_BOUNDS",
        message: `${cat.label} extends outside the shell footprint.`,
      });
    }
  }

  return issues;
};

/**
 * Validation rule: Fixtures should not overlap.
 * Note: Buffer/clearance zones are no longer checked.
 * Walls can intersect with walls, and doors can intersect with walls.
 */
const ruleOverlap: ValidationRule = (design, catalog) => {
  const issues: ValidationIssue[] = [];

  for (let i = 0; i < design.fixtures.length; i++) {
    const fixtureA = design.fixtures[i];
    const catA = catalog[fixtureA.catalogKey];
    if (!catA) continue;

    const rectA = rectFromFixture(fixtureA, catA);

    for (let j = i + 1; j < design.fixtures.length; j++) {
      const fixtureB = design.fixtures[j];
      const catB = catalog[fixtureB.catalogKey];
      if (!catB) continue;

      // Ignore collisions between items on different mounts (e.g. Floor vs Wall)
      if (catA.mount !== catB.mount) continue;

      // Check if either fixture is a wall or door
      const keyA = fixtureA.catalogKey.toLowerCase();
      const keyB = fixtureB.catalogKey.toLowerCase();
      const isWallA = keyA.includes('wall');
      const isWallB = keyB.includes('wall');
      const isDoorA = keyA.includes('door');
      const isDoorB = keyB.includes('door');

      // Allow walls to intersect with walls
      if (isWallA && isWallB) continue;

      // Allow doors to intersect with walls (in either direction)
      if ((isDoorA && isWallB) || (isWallA && isDoorB)) continue;

      const rectB = rectFromFixture(fixtureB, catB);

      // Only check body overlap, no clearance zones
      if (rectsOverlap(rectA, rectB)) {
        issues.push({
          id: `OVERLAP_${fixtureA.id}_${fixtureB.id}`,
          fixtureId: fixtureA.id,
          level: "error",
          code: "OVERLAP",
          message: `${catA.label} overlaps with ${catB.label}.`,
        });
        // Also add issue for fixtureB
        issues.push({
          id: `OVERLAP_${fixtureB.id}_${fixtureA.id}`,
          fixtureId: fixtureB.id,
          level: "error",
          code: "OVERLAP",
          message: `${catB.label} overlaps with ${catA.label}.`,
        });
      }
    }
  }

  return issues;
};

/**
 * Validation rule: Fixtures must be placed in allowed zones (if specified).
 */
const ruleZoneAllowed: ValidationRule = (design, catalog) => {
  const issues: ValidationIssue[] = [];

  for (const fixture of design.fixtures) {
    const cat = catalog[fixture.catalogKey];
    if (!cat || !cat.allowedZones || cat.allowedZones.length === 0) {
      // No zone restriction
      continue;
    }

    const rect = rectFromFixture(fixture, cat);
    const containingZones = zonesContainingRect(design.zones, rect);

    // Check if at least one containing zone is in the allowed list
    const hasAllowedZone = containingZones.some((zone) =>
      cat.allowedZones!.includes(zone.id)
    );

    if (!hasAllowedZone && containingZones.length > 0) {
      issues.push({
        id: `ZONE_MISMATCH_${fixture.id}`,
        fixtureId: fixture.id,
        level: "error",
        code: "ZONE_MISMATCH",
        message: `${cat.label} is in a zone that is not allowed. Allowed zones: ${cat.allowedZones.join(", ")}.`,
      });
    } else if (!hasAllowedZone && containingZones.length === 0) {
      issues.push({
        id: `ZONE_REQUIRED_${fixture.id}`,
        fixtureId: fixture.id,
        level: "error",
        code: "ZONE_REQUIRED",
        message: `${cat.label} must be placed in one of these zones: ${cat.allowedZones.join(", ")}.`,
      });
    }
  }

  return issues;
};

