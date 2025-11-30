import type { DesignConfig, ZoneConfig, FixtureConfig } from "@/types/design";

export type ZoneType = "kitchen-living" | "bath-hallway" | "hallway" | "bedroom";
export type TemplateTier = "basic" | "standard" | "ultimate";

export type ZoneTemplateConfig = {
  id: string;
  zone: ZoneType;
  tier: TemplateTier;
  name: string;
  description: string;
  lengthFt: number;
  widthFt: number;
  yFt: number; // y position within container (0 = front wall side)
  fixtures: Array<Omit<FixtureConfig, "zone"> & { xFt: number }>; // xFt is relative to zone start
  priceCents: number;
};

// Cabin template type for full cabin layouts
export type CabinTemplate = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  zoneSelections: Record<ZoneType, TemplateTier>;
};

// Zone information
export const ZONE_INFO: Record<ZoneType, { label: string; description: string; defaultLengthFt: number; defaultWidthFt: number; defaultYFt: number }> = {
  "kitchen-living": {
    label: "Kitchen & Living",
    description: "Galley kitchen with living space",
    defaultLengthFt: 21.75,
    defaultWidthFt: 8,
    defaultYFt: 0,
  },
  "bath-hallway": {
    label: "Bath",
    description: "Bathroom with basic fixtures",
    defaultLengthFt: 7.75,
    defaultWidthFt: 6,
    defaultYFt: 0,
  },
  hallway: {
    label: "Hallway",
    description: "Passage between zones",
    defaultLengthFt: 7.75,
    defaultWidthFt: 2,
    defaultYFt: 6,
  },
  bedroom: {
    label: "Bedroom",
    description: "Sleeping quarters with storage",
    defaultLengthFt: 10.5,
    defaultWidthFt: 8,
    defaultYFt: 0,
  },
};

// KITCHEN & LIVING ZONE TEMPLATES (21.75' length × 8' width)
const kitchenLivingBasic: ZoneTemplateConfig = {
  id: "kitchen-living-basic",
  zone: "kitchen-living",
  tier: "basic",
  name: "Basic Kitchen & Living",
  description: "Essential galley kitchen with compact living space",
  lengthFt: 21.75,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    {
      id: "kitch-sink-1",
      catalogKey: "fixture-sink-base",
      xFt: 18.5,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-fridge-1",
      catalogKey: "fixture-fridge-24",
      xFt: 14.5,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-cabinet-1",
      catalogKey: "fixture-cabinet-run-24",
      xFt: 15.5,
      yFt: 0,
      rotationDeg: 0,
    },
    {
      id: "kitch-upper-1",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 15.5,
      yFt: 0,
      rotationDeg: 90,
    },
    {
      id: "living-sofa-1",
      catalogKey: "fixture-sofa-72",
      xFt: 4,
      yFt: 6.5,
      rotationDeg: 180,
    },
    {
      id: "living-recliner-1",
      catalogKey: "fixture-recliner",
      xFt: 8.75,
      yFt: 6.5,
      rotationDeg: 180,
    },
    {
      id: "living-recliner-2",
      catalogKey: "fixture-recliner",
      xFt: 12.5,
      yFt: 6.5,
      rotationDeg: 180,
    },
    {
      id: "living-table-1",
      catalogKey: "fixture-table-48",
      xFt: 17,
      yFt: 6,
      rotationDeg: 0,
    },
    {
      id: "living-coat-rack-1",
      catalogKey: "fixture-coat-rack",
      xFt: 7,
      yFt: 0.5,
      rotationDeg: 90,
    },
    {
      id: "living-vestibule-1",
      catalogKey: "module-vestibule",
      xFt: 0.335,
      yFt: 4,
      rotationDeg: 90,
    },
    {
      id: "kitch-window-1",
      catalogKey: "fixture-window-24x36",
      xFt: 19.5,
      yFt: 0.25,
      rotationDeg: 90,
    },
  ],
  priceCents: 2500000, // $25,000
};

const kitchenLivingStandard: ZoneTemplateConfig = {
  id: "kitchen-living-standard",
  zone: "kitchen-living",
  tier: "standard",
  name: "Standard Kitchen & Living",
  description: "Full galley kitchen with dining area",
  lengthFt: 18,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    {
      id: "kitch-sink-1",
      catalogKey: "fixture-sink-base",
      xFt: 4.5,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-range-1",
      catalogKey: "fixture-range-30",
      xFt: 9.5,
      yFt: 1.25,
      rotationDeg: 0,
    },
    {
      id: "kitch-fridge-1",
      catalogKey: "fixture-fridge-24",
      xFt: 7,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-cabinet-1",
      catalogKey: "fixture-cabinet-run-24",
      xFt: 1,
      yFt: 0,
      rotationDeg: 0,
    },
    {
      id: "kitch-upper-1",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 3.5,
      yFt: 0,
      rotationDeg: 90,
    },
    {
      id: "kitch-upper-2",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 6,
      yFt: 0,
      rotationDeg: 90,
    },
    {
      id: "living-table-1",
      catalogKey: "fixture-table-48",
      xFt: 13.5,
      yFt: 4.5,
      rotationDeg: 0,
    },
    {
      id: "living-bench-1",
      catalogKey: "fixture-bench-36",
      xFt: -1,
      yFt: 1.5,
      rotationDeg: 180,
    },
    // Door to hallway
    {
      id: "kitch-door-1",
      catalogKey: "fixture-interior-door",
      xFt: 17.75,
      yFt: 7,
      rotationDeg: 90,
    },
  ],
  priceCents: 3800000, // $38,000
};

const kitchenLivingUltimate: ZoneTemplateConfig = {
  id: "kitchen-living-ultimate",
  zone: "kitchen-living",
  tier: "ultimate",
  name: "Ultimate Kitchen & Living",
  description: "Chef's kitchen with island, dining, and lounge area",
  lengthFt: 18,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    // Expanded galley kitchen (front 10')
    {
      id: "kitch-sink-1",
      catalogKey: "fixture-sink-base",
      xFt: 2,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-range-1",
      catalogKey: "fixture-range-30",
      xFt: 4.5,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-fridge-1",
      catalogKey: "fixture-fridge-24",
      xFt: 7,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "kitch-cabinet-1",
      catalogKey: "fixture-cabinet-run-30",
      xFt: 9.5,
      yFt: 0,
      rotationDeg: 0,
    },
    {
      id: "kitch-upper-1",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 2,
      yFt: 0,
      rotationDeg: 0,
    },
    {
      id: "kitch-upper-2",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 4.5,
      yFt: 0,
      rotationDeg: 0,
    },
    {
      id: "kitch-upper-3",
      catalogKey: "fixture-upper-cabinet-24",
      xFt: 7,
      yFt: 0,
      rotationDeg: 0,
    },
    // Kitchen island (center)
    {
      id: "kitch-island-1",
      catalogKey: "fixture-island-48",
      xFt: 5,
      yFt: 4,
      rotationDeg: 0,
    },
    // Dining area
    {
      id: "living-table-1",
      catalogKey: "fixture-table-48",
      xFt: 10,
      yFt: 5.5,
      rotationDeg: 0,
    },
    // Living/lounge area (back)
    {
      id: "living-sofa-1",
      catalogKey: "fixture-sofa-72",
      xFt: 13.5,
      yFt: 5,
      rotationDeg: 0,
    },
    // Door to hallway
    {
      id: "kitch-door-1",
      catalogKey: "fixture-interior-door",
      xFt: 17.75,
      yFt: 7,
      rotationDeg: 90,
    },
  ],
  priceCents: 5500000, // $55,000
};

// BATH ZONE TEMPLATES (7.75' length × 6' width, positioned at y=0)
const bathHallwayBasic: ZoneTemplateConfig = {
  id: "bath-hallway-basic",
  zone: "bath-hallway",
  tier: "basic",
  name: "Basic Bath",
  description: "Essential bathroom with basic fixtures",
  lengthFt: 7.75,
  widthFt: 6,
  yFt: 0,
  fixtures: [
    {
      id: "bath-toilet-1",
      catalogKey: "fixture-toilet",
      xFt: 4.5,
      yFt: 1,
      rotationDeg: 0,
    },
    {
      id: "bath-shower-1",
      catalogKey: "fixture-shower-36x36",
      xFt: 1.75,
      yFt: 3,
      rotationDeg: 0,
    },
    {
      id: "bath-vanity-1",
      catalogKey: "fixture-vanity-24",
      xFt: 6.5,
      yFt: 4.75,
      rotationDeg: 90,
    },
    // Bathroom entry wall (separates bath from hallway)
    {
      id: "bath-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6, material: "plywood" },
    },
    // Wall separating bath zone from hallway zone
    {
      id: "bath-wall-2",
      catalogKey: "fixture-wall",
      xFt: 4,
      yFt: 6,
      rotationDeg: 90,
      properties: { lengthOverrideFt: 8, material: "plywood" },
    },
  ],
  priceCents: 2200000, // $22,000
};

const bathHallwayStandard: ZoneTemplateConfig = {
  id: "bath-hallway-standard",
  zone: "bath-hallway",
  tier: "standard",
  name: "Standard Bath & Hallway",
  description: "Full bathroom with upgraded vanity and linen storage",
  lengthFt: 10,
  widthFt: 6,
  yFt: 0,
  fixtures: [
    {
      id: "bath-toilet-1",
      catalogKey: "fixture-toilet",
      xFt: 1.5,
      yFt: 1.5,
      rotationDeg: 0,
    },
    {
      id: "bath-shower-1",
      catalogKey: "fixture-shower-36x36",
      xFt: 4.5,
      yFt: 1.5,
      rotationDeg: 0,
    },
    {
      id: "bath-vanity-1",
      catalogKey: "fixture-vanity-30",
      xFt: 7,
      yFt: 1.25,
      rotationDeg: 180,
    },
    {
      id: "bath-linen-1",
      catalogKey: "fixture-linen-cabinet",
      xFt: 9,
      yFt: 1,
      rotationDeg: 0,
    },
    // Bathroom entry wall
    {
      id: "bath-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6 },
    },
    // Wall separating bath zone from hallway zone
    {
      id: "bath-wall-2",
      catalogKey: "fixture-wall",
      xFt: 5,
      yFt: 6,
      rotationDeg: 90,
      properties: { lengthOverrideFt: 10 },
    },
    // Bathroom door
    {
      id: "bath-door-1",
      catalogKey: "fixture-interior-door",
      xFt: 1.5,
      yFt: 5.75,
      rotationDeg: 0,
    },
  ],
  priceCents: 3500000, // $35,000
};

const bathHallwayUltimate: ZoneTemplateConfig = {
  id: "bath-hallway-ultimate",
  zone: "bath-hallway",
  tier: "ultimate",
  name: "Ultimate Bath & Hallway",
  description: "Luxury spa bathroom with dual showers and double vanity",
  lengthFt: 10,
  widthFt: 6,
  yFt: 0,
  fixtures: [
    {
      id: "bath-toilet-1",
      catalogKey: "fixture-toilet",
      xFt: 1,
      yFt: 1.5,
      rotationDeg: 0,
    },
    {
      id: "bath-shower-1",
      catalogKey: "fixture-shower-36x36",
      xFt: 3.5,
      yFt: 3,
      rotationDeg: 0,
    },
    {
      id: "bath-shower-2",
      catalogKey: "fixture-shower-36x36",
      xFt: 6.5,
      yFt: 3,
      rotationDeg: 0,
    },
    {
      id: "bath-vanity-1",
      catalogKey: "fixture-vanity-60-double",
      xFt: 7.5,
      yFt: 0.75,
      rotationDeg: 0,
    },
    // Bathroom entry wall
    {
      id: "bath-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6 },
    },
    // Wall separating bath zone from hallway zone
    {
      id: "bath-wall-2",
      catalogKey: "fixture-wall",
      xFt: 5,
      yFt: 6,
      rotationDeg: 90,
      properties: { lengthOverrideFt: 10 },
    },
    // Bathroom door
    {
      id: "bath-door-1",
      catalogKey: "fixture-interior-door",
      xFt: 1.5,
      yFt: 5.75,
      rotationDeg: 0,
    },
  ],
  priceCents: 5200000, // $52,000
};

// BEDROOM ZONE TEMPLATES (10.5' length × 8' width)
const bedroomBasic: ZoneTemplateConfig = {
  id: "bedroom-basic",
  zone: "bedroom",
  tier: "basic",
  name: "Basic Bedroom",
  description: "Simple bedroom with bunk beds",
  lengthFt: 10.5,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    // Entry wall from hallway
    {
      id: "bed-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6, material: "plywood" },
    },
    // Bedroom door
    {
      id: "bed-door-1",
      catalogKey: "fixture-interior-door",
      xFt: -3.5,
      yFt: 6,
      rotationDeg: 270,
    },
    {
      id: "bed-bunk-1",
      catalogKey: "fixture-bunk-twin",
      xFt: 7.25,
      yFt: 1.75,
      rotationDeg: 90,
    },
    {
      id: "bed-bunk-2",
      catalogKey: "fixture-bunk-twin",
      xFt: 7.25,
      yFt: 6.25,
      rotationDeg: 90,
    },
    {
      id: "bed-bench-1",
      catalogKey: "fixture-bench-36",
      xFt: 2.25,
      yFt: 0.75,
      rotationDeg: 90,
    },
    {
      id: "bed-window-1",
      catalogKey: "fixture-window-36x48",
      xFt: 2.25,
      yFt: 0.25,
      rotationDeg: 90,
    },
  ],
  priceCents: 1800000, // $18,000
};

const bedroomStandard: ZoneTemplateConfig = {
  id: "bedroom-standard",
  zone: "bedroom",
  tier: "standard",
  name: "Standard Bedroom",
  description: "Comfortable bedroom with 2 beds, nightstands, and dresser",
  lengthFt: 12,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    {
      id: "bed-twin-1",
      catalogKey: "fixture-bed-twin",
      xFt: 8.75,
      yFt: 6.25,
      rotationDeg: 90,
    },
    {
      id: "bed-twin-2",
      catalogKey: "fixture-bed-twin",
      xFt: 8.5,
      yFt: 1.75,
      rotationDeg: 90,
    },
    {
      id: "nightstand-2",
      catalogKey: "fixture-nightstand",
      xFt: 1,
      yFt: 5,
      rotationDeg: 0,
    },
    {
      id: "dresser-1",
      catalogKey: "fixture-dresser-36",
      xFt: 1,
      yFt: 1.5,
      rotationDeg: 180,
    },
    // Entry wall from hallway
    {
      id: "bed-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6 },
    },
    // Bedroom door
    {
      id: "bed-door-1",
      catalogKey: "fixture-interior-door",
      xFt: -0.25,
      yFt: 7,
      rotationDeg: 90,
    },
  ],
  priceCents: 2900000, // $29,000
};

const bedroomUltimate: ZoneTemplateConfig = {
  id: "bedroom-ultimate",
  zone: "bedroom",
  tier: "ultimate",
  name: "Ultimate Bedroom",
  description: "Premium bedroom with 4 bunk beds, closet system, nightstands, and dresser",
  lengthFt: 12,
  widthFt: 8,
  yFt: 0,
  fixtures: [
    // 4 bunk beds (2 sets of bunks)
    {
      id: "bunk-1",
      catalogKey: "fixture-bunk-twin",
      xFt: 3.25,
      yFt: 6,
      rotationDeg: 0,
    },
    {
      id: "bunk-2",
      catalogKey: "fixture-bunk-twin",
      xFt: 3.25,
      yFt: 2,
      rotationDeg: 0,
    },
    // Nightstands
    {
      id: "nightstand-1",
      catalogKey: "fixture-nightstand",
      xFt: 7.5,
      yFt: 6,
      rotationDeg: 0,
    },
    {
      id: "nightstand-2",
      catalogKey: "fixture-nightstand",
      xFt: 7.5,
      yFt: 2,
      rotationDeg: 0,
    },
    // Dresser
    {
      id: "dresser-1",
      catalogKey: "fixture-dresser-36",
      xFt: 10,
      yFt: 4,
      rotationDeg: 0,
    },
    // Entry wall from hallway
    {
      id: "bed-wall-1",
      catalogKey: "fixture-wall",
      xFt: 0,
      yFt: 3,
      rotationDeg: 0,
      properties: { lengthOverrideFt: 6 },
    },
    // Bedroom door
    {
      id: "bed-door-1",
      catalogKey: "fixture-interior-door",
      xFt: -0.25,
      yFt: 7,
      rotationDeg: 90,
    },
  ],
  priceCents: 4500000, // $45,000
};

// HALLWAY ZONE TEMPLATES (7.75' length × 2' width, positioned at y=6)
const hallwayBasic: ZoneTemplateConfig = {
  id: "hallway-basic",
  zone: "hallway",
  tier: "basic",
  name: "Basic Hallway",
  description: "Simple passage between zones",
  lengthFt: 7.75,
  widthFt: 2,
  yFt: 6,
  fixtures: [],
  priceCents: 200000, // $2,000
};

const hallwayStandard: ZoneTemplateConfig = {
  id: "hallway-standard",
  zone: "hallway",
  tier: "standard",
  name: "Standard Hallway",
  description: "Passage with wall-mounted lighting",
  lengthFt: 10,
  widthFt: 2,
  yFt: 6,
  fixtures: [],
  priceCents: 350000, // $3,500
};

const hallwayUltimate: ZoneTemplateConfig = {
  id: "hallway-ultimate",
  zone: "hallway",
  tier: "ultimate",
  name: "Ultimate Hallway",
  description: "Premium passage with recessed lighting and trim",
  lengthFt: 10,
  widthFt: 2,
  yFt: 6,
  fixtures: [],
  priceCents: 500000, // $5,000
};

// Export all zone templates
export const ZONE_TEMPLATES: ZoneTemplateConfig[] = [
  kitchenLivingBasic,
  kitchenLivingStandard,
  kitchenLivingUltimate,
  bathHallwayBasic,
  bathHallwayStandard,
  bathHallwayUltimate,
  hallwayBasic,
  hallwayStandard,
  hallwayUltimate,
  bedroomBasic,
  bedroomStandard,
  bedroomUltimate,
];

// Full cabin templates
export const CABIN_TEMPLATES: CabinTemplate[] = [
  {
    id: "standard",
    name: "Standard Design",
    description: "Essential cabin layout with kitchen, living area, bathroom, and bedroom",
    priceCents: 5100000, // $51,000
    zoneSelections: {
      "kitchen-living": "basic",
      "bath-hallway": "basic",
      "hallway": "basic",
      "bedroom": "basic",
    },
  },
  // Future templates can be added here
];

// Helper to get zone templates by zone type
export function getZoneTemplatesByZone(zone: ZoneType): ZoneTemplateConfig[] {
  return ZONE_TEMPLATES.filter((t) => t.zone === zone);
}

// Helper to get zone template by zone and tier
export function getZoneTemplate(zone: ZoneType, tier: TemplateTier): ZoneTemplateConfig | undefined {
  return ZONE_TEMPLATES.find((t) => t.zone === zone && t.tier === tier);
}

// Calculate total price from zone selections
export function calculateTotalPrice(selections: Record<ZoneType, TemplateTier | "">): number {
  let total = 0;
  for (const [zone, tier] of Object.entries(selections) as [ZoneType, TemplateTier | ""][]) {
    if (tier !== "") {
      const template = getZoneTemplate(zone, tier);
      if (template) {
        total += template.priceCents;
      }
    }
  }
  return total;
}

// Build a complete design from zone selections
export function buildDesignFromZoneSelections(
  selections: Record<ZoneType, TemplateTier>
): DesignConfig {
  // Zone order determines x positions - hallway runs parallel to bath-hallway
  const mainZoneOrder: ZoneType[] = ["kitchen-living", "bath-hallway", "bedroom"];
  const parallelZones: ZoneType[] = ["hallway"]; // Zones that run parallel to others

  let currentX = 0;
  const zones: ZoneConfig[] = [];
  const fixtures: FixtureConfig[] = [];
  const zoneXPositions: Record<string, number> = {};

  // First pass: process main zones to establish x positions
  for (const zoneType of mainZoneOrder) {
    const tier = selections[zoneType];
    if (!tier) continue; // Skip if not selected

    const template = getZoneTemplate(zoneType, tier);
    if (!template) {
      throw new Error(`Template not found for zone: ${zoneType}, tier: ${tier}`);
    }

    zoneXPositions[zoneType] = currentX;

    // Create zone config using template dimensions
    zones.push({
      id: zoneType,
      name: ZONE_INFO[zoneType].label,
      xFt: currentX,
      yFt: template.yFt,
      lengthFt: template.lengthFt,
      widthFt: template.widthFt,
    });

    // Add fixtures with adjusted x positions (fixtures already have relative xFt)
    for (const fixture of template.fixtures) {
      fixtures.push({
        ...fixture,
        xFt: currentX + fixture.xFt, // Add zone offset to fixture's relative position
        zone: zoneType,
      });
    }

    currentX += template.lengthFt;
  }

  // Second pass: process parallel zones (hallway runs alongside bath-hallway)
  for (const zoneType of parallelZones) {
    const tier = selections[zoneType];
    if (!tier) continue; // Skip if not selected

    const template = getZoneTemplate(zoneType, tier);
    if (!template) {
      throw new Error(`Template not found for zone: ${zoneType}, tier: ${tier}`);
    }

    // Hallway is positioned at the same x as bath-hallway
    const parallelToZone = zoneType === "hallway" ? "bath-hallway" : zoneType;
    const xPosition = zoneXPositions[parallelToZone] ?? 0;

    zones.push({
      id: zoneType,
      name: ZONE_INFO[zoneType].label,
      xFt: xPosition,
      yFt: template.yFt,
      lengthFt: template.lengthFt,
      widthFt: template.widthFt,
    });

    // Add fixtures with adjusted x positions
    for (const fixture of template.fixtures) {
      fixtures.push({
        ...fixture,
        xFt: xPosition + fixture.xFt,
        zone: zoneType,
      });
    }
  }

  return {
    version: 1,
    shell: {
      id: "shell-40",
      lengthFt: 40,
      widthFt: 8,
      heightFt: 9.5,
    },
    zones,
    fixtures,
  };
}

