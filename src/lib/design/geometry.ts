import type {
  FixtureConfig,
  ModuleCatalogItem,
  RectFt,
  ShellConfig,
  ZoneConfig,
} from "@/types/design";

/**
 * Converts a fixture configuration + catalog item into a rectangle in feet-space.
 * Handles rotation and footprint anchor positioning.
 */
export function rectFromFixture(
  fixture: FixtureConfig,
  catalogItem: ModuleCatalogItem
): RectFt {
  const { footprintFt, footprintAnchor } = catalogItem;
  const { xFt, yFt, rotationDeg } = fixture;
  const overrides =
    (fixture.properties as {
      lengthOverrideFt?: number;
      widthOverrideFt?: number;
    }) ?? {};
  const footprintLength =
    typeof overrides.lengthOverrideFt === "number"
      ? Math.max(overrides.lengthOverrideFt, 0.5)
      : footprintFt.length;
  const footprintWidth =
    typeof overrides.widthOverrideFt === "number"
      ? Math.max(overrides.widthOverrideFt, 0.5)
      : footprintFt.width;

  // Handle rotation: swap dimensions if rotated 90/270
  const isRotated = rotationDeg === 90 || rotationDeg === 270;
  const width = isRotated ? footprintLength : footprintWidth;
  const height = isRotated ? footprintWidth : footprintLength;

  let x = xFt;
  let y = yFt;

  // Adjust position based on anchor point
  switch (footprintAnchor) {
    case "center":
      x = xFt - width / 2;
      y = yFt - height / 2;
      break;
    case "front-left":
      // front-left means (xFt, yFt) is the front-left corner
      // For now, we interpret "front" as positive Y direction
      // No adjustment needed - xFt, yFt is already the corner
      break;
    case "back-left":
      // back-left means (xFt, yFt) is the back-left corner
      // No adjustment needed
      break;
  }

  return { x, y, width, height };
}

/**
 * Rotates clearance values based on the rotation degree.
 * Assumes:
 * - 0 deg: Front=+Y, Right=+X, Back=-Y, Left=-X (matches SVG/Screen coords where Y is down? or Up?)
 *   Actually, based on rectFromFixture comments "front" as positive Y.
 *   If rotation is clockwise:
 *   0: F=+Y, R=+X, B=-Y, L=-X
 *   90: F=+X, R=-Y, B=-X, L=+Y
 *   180: F=-Y, R=-X, B=+Y, L=+X
 *   270: F=-X, R=+Y, B=+X, L=-Y
 */
export function rotateClearance(
  clearance: { front?: number; back?: number; left?: number; right?: number },
  rotationDeg: 0 | 90 | 180 | 270
): { top: number; bottom: number; left: number; right: number } {
  const c = {
    front: clearance.front ?? 0,
    back: clearance.back ?? 0,
    left: clearance.left ?? 0,
    right: clearance.right ?? 0,
  };

  // Map "Front/Back/Left/Right" (relative to object) to "Top/Bottom/Left/Right" (absolute/screen)
  // Assuming 0 deg = Front faces +Y (Bottom), Back faces -Y (Top), Left faces -X (Left), Right faces +X (Right)
  // Note: This mapping depends on how "Front" is defined in the coordinate system.
  // In rectFromFixture, "front" is positive Y.
  // In standard screen coords, +Y is Down. So "Front" is Down. "Back" is Up.

  switch (rotationDeg) {
    case 0:
      // Front -> +Y (Bottom), Back -> -Y (Top), Left -> -X (Left), Right -> +X (Right)
      return { top: c.back, bottom: c.front, left: c.left, right: c.right };
    case 90:
      // Rotated 90 deg clockwise
      // Object Front (+Y) -> moves to Face Left (-X)? Or Right (+X)?
      // Standard clockwise rotation of vector (0, 1) is (-1, 0) if Y-down X-right?
      // Let's assume standard geometric rotation.
      // 0 deg: Front is +Y.
      // 90 deg: Front is -X (Left). Back is +X (Right). Left is -Y (Top). Right is +Y (Bottom).
      // WAIT. If 0 deg front is +Y (Down), and we rotate clockwise 90 deg:
      // Front (Down) rotates to Left.
      // Right (Right) rotates to Down.
      // Back (Up) rotates to Right.
      // Left (Left) rotates to Up.
      return { top: c.left, bottom: c.right, left: c.front, right: c.back };
    case 180:
      // 180 deg
      // Front (Down) -> Up. Back (Up) -> Down. Left (Left) -> Right. Right (Right) -> Left.
      return { top: c.front, bottom: c.back, left: c.right, right: c.left };
    case 270:
      // 270 deg (or -90)
      // Front (Down) -> Right.
      // Right (Right) -> Up.
      // Back (Up) -> Left.
      // Left (Left) -> Down.
      return { top: c.right, bottom: c.left, left: c.back, right: c.front };
  }
  return { top: 0, bottom: 0, left: 0, right: 0 };
}

/**
 * Calculates the bounding box of the clearance zone for a fixture.
 */
export function getClearanceRect(
  fixture: FixtureConfig,
  catalogItem: ModuleCatalogItem
): RectFt | null {
  if (!catalogItem.minClearanceFt) return null;

  const rect = rectFromFixture(fixture, catalogItem);
  const clearance = rotateClearance(catalogItem.minClearanceFt, fixture.rotationDeg);

  return {
    x: rect.x - clearance.left,
    y: rect.y - clearance.top,
    width: rect.width + clearance.left + clearance.right,
    height: rect.height + clearance.top + clearance.bottom,
  };
}

/**
 * Checks if two rectangles overlap, with optional clearance requirement.
 */
export function rectsOverlap(a: RectFt, b: RectFt, clearance = 0): boolean {
  return !(
    a.x + a.width + clearance <= b.x ||
    b.x + b.width + clearance <= a.x ||
    a.y + a.height + clearance <= b.y ||
    b.y + b.height + clearance <= a.y
  );
}

/**
 * Checks if a rectangle is fully inside the shell bounds.
 */
export function isInsideShell(shell: ShellConfig, rect: RectFt): boolean {
  return (
    rect.x >= 0 &&
    rect.y >= 0 &&
    rect.x + rect.width <= shell.lengthFt &&
    rect.y + rect.height <= shell.widthFt
  );
}

/**
 * Checks if a rectangle is fully inside a zone.
 */
export function isInsideZone(zone: ZoneConfig, rect: RectFt): boolean {
  return (
    rect.x >= zone.xFt &&
    rect.y >= zone.yFt &&
    rect.x + rect.width <= zone.xFt + zone.lengthFt &&
    rect.y + rect.height <= zone.yFt + zone.widthFt
  );
}

/**
 * Finds all zones that contain a given rectangle (even partially).
 */
export function zonesContainingRect(
  zones: ZoneConfig[],
  rect: RectFt
): ZoneConfig[] {
  return zones.filter((zone) => {
    // Check if rect overlaps with zone (not just fully inside)
    return !(
      rect.x + rect.width <= zone.xFt ||
      zone.xFt + zone.lengthFt <= rect.x ||
      rect.y + rect.height <= zone.yFt ||
      zone.yFt + zone.widthFt <= rect.y
    );
  });
}
