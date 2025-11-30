// Bill of Materials Types

// ============================================
// Material Options
// ============================================

export type InsulationType = "fiberglass-batts" | "spray-foam" | "rigid-board";

export type InteriorWallFinish = "drywall" | "plywood" | "shiplap";

export type FlooringType = "vinyl-plank" | "laminate" | "engineered-hardwood" | "rubber";

export type ExteriorFinish = "none" | "paint" | "corrugated-metal" | "wood-siding" | "composite";

export type RoofingType = "none" | "membrane";

// ============================================
// Material Pricing (cents per sqft)
// ============================================

export const INSULATION_PRICES: Record<InsulationType, { label: string; centsPerSqft: number }> = {
  "fiberglass-batts": { label: "Fiberglass Batts", centsPerSqft: 150 },
  "spray-foam": { label: "Spray Foam (Open Cell)", centsPerSqft: 350 },
  "rigid-board": { label: "Rigid Foam Board", centsPerSqft: 275 },
};

export const INTERIOR_FINISH_PRICES: Record<InteriorWallFinish, { label: string; centsPerSqft: number }> = {
  "drywall": { label: '1/2" Drywall', centsPerSqft: 300 },
  "plywood": { label: '3/4" Plywood', centsPerSqft: 450 },
  "shiplap": { label: "Shiplap/Tongue & Groove", centsPerSqft: 800 },
};

export const FLOORING_PRICES: Record<FlooringType, { label: string; centsPerSqft: number }> = {
  "vinyl-plank": { label: "Vinyl Plank (LVP)", centsPerSqft: 400 },
  "laminate": { label: "Laminate", centsPerSqft: 350 },
  "engineered-hardwood": { label: "Engineered Hardwood", centsPerSqft: 800 },
  "rubber": { label: "Rubber/Commercial", centsPerSqft: 600 },
};

export const EXTERIOR_FINISH_PRICES: Record<ExteriorFinish, { label: string; centsPerSqft: number }> = {
  "none": { label: "None (Raw Container)", centsPerSqft: 0 },
  "paint": { label: "Primer + Paint", centsPerSqft: 250 },
  "corrugated-metal": { label: "Corrugated Metal Panels", centsPerSqft: 600 },
  "wood-siding": { label: "Wood Siding", centsPerSqft: 1200 },
  "composite": { label: "Composite Panels", centsPerSqft: 900 },
};

export const ROOFING_PRICES: Record<RoofingType, { label: string; centsPerSqft: number }> = {
  "none": { label: "None", centsPerSqft: 0 },
  "membrane": { label: "Membrane (TPO/EPDM)", centsPerSqft: 550 },  // $5.50/sqft for quality membrane
};

// ============================================
// Foundation Options
// ============================================

export type FoundationType = "none" | "gravel" | "slab";

export const FOUNDATION_PRICES: Record<FoundationType, { label: string; baseCents: number }> = {
  "none": { label: "None (Customer Provides)", baseCents: 0 },
  "gravel": { label: "Compacted Gravel Pad", baseCents: 200000 },  // $2,000 flat
  "slab": { label: "4\" Reinforced Concrete Slab", baseCents: 450000 },  // $4,500 flat
};

// ============================================
// Fixed Costs (cents)
// ============================================

export const CONTAINER_COST_CENTS = 450000; // $4,500 for 40' High Cube

export const ELECTRICAL_BASE_CENTS = 250000; // $2,500 base panel (container requires steel cutting, weatherproofing)
export const ELECTRICAL_PER_FIXTURE_CENTS = 15000; // $150 per powered fixture

export const PLUMBING_BASE_CENTS = 200000; // $2,000 rough-in
export const PLUMBING_PER_FIXTURE_CENTS = 35000; // $350 per wet fixture

export const ROOFING_BASE_CENTS_PER_SQFT = 400; // $4.00/sqft base membrane
export const ROOFING_DECK_PREP_CENTS_PER_SQFT = 300; // +$3.00/sqft
export const ROOFING_SOLAR_RAILS_CENTS_PER_SQFT = 250; // +$2.50/sqft

export const DELIVERY_RATE_CENTS_PER_MILE = 450; // $4.50/mile
export const DELIVERY_MINIMUM_CENTS = 50000; // $500 minimum

export const DEFAULT_LABOR_RATE_CENTS = 4500; // $45/hr default

// ============================================
// Electrical Power Source Options
// ============================================

export type ElectricalPowerSource = "grid" | "generator" | "solar-battery";

export const ELECTRICAL_POWER_SOURCE_LABELS: Record<ElectricalPowerSource, string> = {
  "grid": "Grid Connection",
  "generator": "Generator (Off-Grid)",
  "solar-battery": "Solar + Battery (Off-Grid)",
};

// ============================================
// Fixture Wattages (watts) for load calculation
// ============================================

export const FIXTURE_WATTAGES: Record<string, number> = {
  // Kitchen/Galley
  "fixture-fridge-24": 150,        // Refrigerator (running avg)
  "fixture-range-30": 2500,        // Electric range (1-2 burners)
  "fixture-dishwasher": 1800,      // Dishwasher
  "fixture-microwave": 1200,       // Microwave
  // Laundry
  "fixture-washer": 500,           // Washing machine
  "fixture-dryer": 3000,           // Electric dryer
  // Bath
  "fixture-water-heater": 4500,    // Electric water heater (tankless)
  // HVAC/Comfort
  "fixture-mini-split": 1500,      // Mini-split AC/heat (12k BTU)
  // Lighting (per fixture, estimated)
  "default-lighting": 60,          // LED lighting per room
  // Default for unlisted powered fixtures
  "default": 200,
};

// Heating load: ~10W per sqft for electric space heating
export const HEATING_WATTS_PER_SQFT = 10;

// Base lighting load (watts) - general lighting for the container
export const BASE_LIGHTING_WATTS = 300;

// ============================================
// Generator Pricing (cents) - tiered by kW capacity
// ============================================

export type GeneratorTier = {
  minWatts: number;
  maxWatts: number;
  capacityKw: number;
  label: string;
  priceCents: number;
};

export const GENERATOR_TIERS: GeneratorTier[] = [
  { minWatts: 0, maxWatts: 3500, capacityKw: 5, label: "5kW Portable Generator", priceCents: 80000 },
  { minWatts: 3501, maxWatts: 5500, capacityKw: 7.5, label: "7.5kW Generator", priceCents: 120000 },
  { minWatts: 5501, maxWatts: 8000, capacityKw: 10, label: "10kW Generator", priceCents: 180000 },
  { minWatts: 8001, maxWatts: 12000, capacityKw: 15, label: "15kW Standby Generator", priceCents: 350000 },
  { minWatts: 12001, maxWatts: 20000, capacityKw: 22, label: "22kW Standby Generator", priceCents: 550000 },
];

// ============================================
// Solar + Battery Pricing (cents) - tiered by system size
// ============================================

export type SolarBatteryTier = {
  minWatts: number;
  maxWatts: number;
  solarKw: number;
  batteryKwh: number;
  label: string;
  priceCents: number;
};

export const SOLAR_BATTERY_TIERS: SolarBatteryTier[] = [
  { minWatts: 0, maxWatts: 3000, solarKw: 3, batteryKwh: 10, label: "3kW Solar + 10kWh Battery", priceCents: 800000 },
  { minWatts: 3001, maxWatts: 5000, solarKw: 5, batteryKwh: 15, label: "5kW Solar + 15kWh Battery", priceCents: 1200000 },
  { minWatts: 5001, maxWatts: 8000, solarKw: 8, batteryKwh: 20, label: "8kW Solar + 20kWh Battery", priceCents: 1800000 },
  { minWatts: 8001, maxWatts: 12000, solarKw: 10, batteryKwh: 30, label: "10kW Solar + 30kWh Battery", priceCents: 2500000 },
  { minWatts: 12001, maxWatts: 20000, solarKw: 15, batteryKwh: 40, label: "15kW Solar + 40kWh Battery", priceCents: 3500000 },
];

// ============================================
// Electrical Load Calculation Result
// ============================================

export type ElectricalLoadBreakdown = {
  heatingWatts: number;
  fixtureWatts: number;
  lightingWatts: number;
  totalWatts: number;
  fixtureDetails: { label: string; watts: number }[];
};

// ============================================
// Labor Hour Rates
// ============================================

export const LABOR_HOURS = {
  exteriorFramingPerLinearFt: 0.5,
  windowInstallationPerUnit: 4,
  exteriorDoorPerUnit: 6,
  interiorWallPerLinearFt: 0.2,
  interiorDoorPerUnit: 2,
  insulationPerSqft: 0.05,
  wallFinishDrywallPerSqft: 0.08,
  wallFinishWoodPerSqft: 0.12,
  electricalBase: 10,
  electricalPerFixture: 1.5,
  plumbingBase: 4,
  plumbingPerFixture: 3,
  roofingPerSqft: 0.04,
  roofingDeckPrepPerSqft: 0.05,
  flooringPerSqft: 0.015,
  exteriorFinishPaintPerSqft: 0.04,
  exteriorFinishSidingPerSqft: 0.15,
  fixtureInstallPerUnit: 1,
  trimBaseHours: 8,
  trimPerOpening: 1,
  cleanupHours: 8,
};

// ============================================
// Labor Categories
// ============================================

export type LaborCategory =
  | "exterior-framing"
  | "window-installation"
  | "exterior-door"
  | "interior-wall-framing"
  | "interior-door"
  | "insulation"
  | "wall-finish"
  | "electrical"
  | "plumbing"
  | "roofing"
  | "flooring"
  | "exterior-finish"
  | "fixture-install"
  | "trim-finish"
  | "cleanup";

export type LaborBreakdownItem = {
  category: LaborCategory;
  label: string;
  hours: number;
  description?: string;
};

// ============================================
// BOM State
// ============================================

export type BOMSelections = {
  insulation: InsulationType;
  interiorFinish: InteriorWallFinish;
  flooring: FlooringType;
  exteriorFinish: ExteriorFinish;
  roofingType: RoofingType;
  roofingDeckPrep: boolean;
  roofingSolarRails: boolean;
  laborRateCents: number;
  deliveryZip: string;
  electricalPowerSource: ElectricalPowerSource;
  foundation: FoundationType;
};

export const DEFAULT_BOM_SELECTIONS: BOMSelections = {
  insulation: "fiberglass-batts",
  interiorFinish: "drywall",
  flooring: "laminate",
  exteriorFinish: "none",
  roofingType: "none",
  roofingDeckPrep: false,
  roofingSolarRails: false,
  laborRateCents: DEFAULT_LABOR_RATE_CENTS,
  deliveryZip: "",
  electricalPowerSource: "grid",
  foundation: "none",
};

// ============================================
// BOM Calculation Results
// ============================================

export type BOMCategoryResult = {
  label: string;
  costCents: number;
  details?: string;
};

export type ElectricalSystemInfo = {
  powerSource: ElectricalPowerSource;
  loadBreakdown: ElectricalLoadBreakdown;
  systemLabel?: string;         // e.g., "10kW Generator" or "5kW Solar + 15kWh Battery"
  systemCostCents: number;      // Cost of generator/solar+battery system (0 for grid)
};

export type BOMCalculation = {
  container: BOMCategoryResult;
  fixtures: BOMCategoryResult;
  wallsInsulation: BOMCategoryResult;
  flooring: BOMCategoryResult;
  electrical: BOMCategoryResult & { systemInfo: ElectricalSystemInfo };
  plumbing: BOMCategoryResult;
  exteriorFinish: BOMCategoryResult;
  roofing: BOMCategoryResult;
  foundation: BOMCategoryResult;
  labor: BOMCategoryResult & { breakdown: LaborBreakdownItem[]; totalHours: number };
  delivery: BOMCategoryResult & { distanceMiles: number | null };
  subtotalCents: number;
  contingencyCents: number;
  grandTotalCents: number;
};

// ============================================
// Design Analysis (extracted from design for BOM)
// ============================================

export type DesignAnalysis = {
  shellLengthFt: number;
  shellWidthFt: number;
  shellHeightFt: number;
  perimeterFt: number;
  floorSqft: number;
  roofSqft: number;
  externalWallSqft: number;
  windowCount: number;
  exteriorDoorCount: number;
  interiorDoorCount: number;
  interiorWallLinearFt: number;
  interiorWallSqft: number;
  poweredFixtureCount: number;
  wetFixtureCount: number;
  totalFixtureCount: number;
  openingsSqft: number;
};


