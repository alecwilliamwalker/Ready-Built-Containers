import type {
  FixtureCategory,
  FootprintAnchor,
  ModuleCatalogEntry,
  ModuleCatalogItem,
  UtilityType,
} from "@/types/design";

/**
 * Converts a legacy ModuleCatalogEntry from the database to the new ModuleCatalogItem format.
 * This handles backward compatibility while we migrate to the new structure.
 */
export function entryToItem(entry: ModuleCatalogEntry): ModuleCatalogItem | null {
  const schema = entry.schemaJson as Record<string, unknown>;
  const priceRule = entry.priceRuleJson as Record<string, unknown>;

  // Extract footprint
  const footprintRaw = schema["footprintFt"];
  let footprintFt = { length: 6, width: 4 }; // defaults
  
  if (
    footprintRaw &&
    typeof footprintRaw === "object" &&
    footprintRaw !== null
  ) {
    const fp = footprintRaw as Record<string, unknown>;
    if (typeof fp["length"] === "number" && typeof fp["width"] === "number") {
      footprintFt = { length: fp["length"], width: fp["width"] };
    }
  } else if (entry.category === "opening") {
    // For openings like windows/doors that don't have footprintFt,
    // use widthFt as the length along the wall, with a thin width for 2D representation
    const openingWidth = typeof schema["widthFt"] === "number" ? schema["widthFt"] : 3;
    // Wall openings have minimal depth (thickness) in floor plan - just enough to be visible
    footprintFt = { length: openingWidth, width: 0.5 };
  }

  // Extract utilities
  const utilitiesRaw = schema["utilities"];
  const requiresUtilities: UtilityType[] = [];
  if (Array.isArray(utilitiesRaw)) {
    for (const util of utilitiesRaw) {
      if (
        typeof util === "string" &&
        ["water", "waste", "power", "vent"].includes(util)
      ) {
        requiresUtilities.push(util as UtilityType);
      }
    }
  }

  // Extract allowed zones (if present)
  const zonesRaw = schema["allowedZones"];
  const allowedZones: string[] | undefined = Array.isArray(zonesRaw)
    ? zonesRaw.filter((z): z is string => typeof z === "string")
    : undefined;

  // Extract clearance
  const clearanceRaw = schema["minClearanceFt"];
  const minClearFt =
    clearanceRaw && typeof clearanceRaw === "object" && clearanceRaw !== null
      ? (clearanceRaw as Record<string, unknown>)
      : undefined;

  // Determine footprint anchor (default to center for fixtures, front-left for modules)
  const footprintAnchor: FootprintAnchor =
    (schema["footprintAnchor"] as FootprintAnchor) ||
    (entry.category.includes("fixture") ? "center" : "front-left");

  // Determine mount
  const mount: "wall" | "floor" =
    (schema["mount"] as "wall" | "floor") ||
    (entry.category.includes("opening") ? "wall" : "floor");

  // Extract price rule
  const baseCents =
    typeof priceRule["baseCents"] === "number" ? priceRule["baseCents"] : 0;
  const perLinearFtCents =
    typeof priceRule["perLinearFtCents"] === "number"
      ? priceRule["perLinearFtCents"]
      : undefined;

  // Extract hidden flag (for internal items like walls that shouldn't appear in fixture library)
  const hidden = schema["hidden"] === true ? true : undefined;

  return {
    key: entry.key,
    label: entry.name,
    category: entry.category as FixtureCategory,
    footprintFt,
    footprintAnchor,
    mount,
    allowedZones,
    requiresUtilities: requiresUtilities.length > 0 ? requiresUtilities : undefined,
    minClearanceFt: minClearFt
      ? {
          front: typeof minClearFt["front"] === "number" ? minClearFt["front"] : undefined,
          back: typeof minClearFt["back"] === "number" ? minClearFt["back"] : undefined,
          left: typeof minClearFt["left"] === "number" ? minClearFt["left"] : undefined,
          right: typeof minClearFt["right"] === "number" ? minClearFt["right"] : undefined,
        }
      : undefined,
    priceRule: {
      baseCents,
      perLinearFtCents,
    },
    hidden,
  };
}

/**
 * Converts an array of ModuleCatalogEntry to a Record<string, ModuleCatalogItem>.
 */
export function entriesToCatalogMap(
  entries: ModuleCatalogEntry[]
): Record<string, ModuleCatalogItem> {
  const map: Record<string, ModuleCatalogItem> = {};
  for (const entry of entries) {
    const item = entryToItem(entry);
    if (item) {
      map[entry.key] = item;
    }
  }
  return map;
}

