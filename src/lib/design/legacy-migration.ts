import type {
  DesignConfig,
  FixtureConfig,
  PlacedModule,
  ShellConfig,
  ZoneConfig,
} from "@/types/design";

/**
 * Converts legacy PlacedModule[] format to new DesignConfig format.
 * This handles backward compatibility when loading old designs.
 */
export function migrateLegacyDesign(
  legacyConfig: unknown,
  shellLengthFt: number
): DesignConfig {
  // Check if it's already a DesignConfig
  if (
    legacyConfig &&
    typeof legacyConfig === "object" &&
    "version" in legacyConfig &&
    "shell" in legacyConfig &&
    "fixtures" in legacyConfig
  ) {
    return legacyConfig as DesignConfig;
  }

  // Check if it's the old format with modules array
  if (
    legacyConfig &&
    typeof legacyConfig === "object" &&
    "modules" in legacyConfig &&
    Array.isArray((legacyConfig as { modules: unknown }).modules)
  ) {
    const modules = (legacyConfig as { modules: PlacedModule[] }).modules;

    // Create default shell
    const shell: ShellConfig = {
      id: `shell-${shellLengthFt}`,
      lengthFt: shellLengthFt,
      widthFt: 8,
      heightFt: 9.5,
    };

    // Create default zones (bath and galley)
    const zones: ZoneConfig[] = [
      {
        id: "bath",
        name: "Bath",
        xFt: 0,
        yFt: 0,
        lengthFt: 8,
        widthFt: 8,
      },
      {
        id: "galley",
        name: "Galley",
        xFt: 8,
        yFt: 0,
        lengthFt: 12,
        widthFt: 8,
      },
    ];

    // Convert PlacedModule[] to FixtureConfig[]
    // Old format was linear (1D), new format is 2D
    // Place modules along the x-axis, centered in y
    const fixtures: FixtureConfig[] = modules.map((module, index) => {
      // Determine zone based on position
      let zoneId: string | undefined;
      if (module.positionFt < 8) {
        zoneId = "bath";
      } else if (module.positionFt < 20) {
        zoneId = "galley";
      }

      return {
        id: module.id,
        catalogKey: module.catalogKey,
        name: module.name,
        xFt: module.positionFt,
        yFt: 3, // Center in 8ft width (4ft - half of typical fixture)
        rotationDeg: 0,
        zone: zoneId,
      };
    });

    return {
      version: 1,
      shell,
      fixtures,
      zones,
    };
  }

  // Fallback: create empty design
  return {
    version: 1,
    shell: {
      id: `shell-${shellLengthFt}`,
      lengthFt: shellLengthFt,
      widthFt: 8,
      heightFt: 9.5,
    },
    fixtures: [],
    zones: [
      {
        id: "bath",
        name: "Bath",
        xFt: 0,
        yFt: 0,
        lengthFt: 8,
        widthFt: 8,
      },
      {
        id: "galley",
        name: "Galley",
        xFt: 8,
        yFt: 0,
        lengthFt: 12,
        widthFt: 8,
      },
    ],
  };
}

