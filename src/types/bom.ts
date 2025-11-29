// Bill of Materials Types

// ============================================
// Material Options
// ============================================

export type InsulationType = "fiberglass-batts" | "spray-foam" | "rigid-board";

export type InteriorWallFinish = "drywall" | "plywood" | "shiplap";

export type FlooringType = "vinyl-plank" | "laminate" | "engineered-hardwood" | "rubber";

export type ExteriorFinish = "paint" | "corrugated-metal" | "wood-siding" | "composite";

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
  "paint": { label: "Primer + Paint", centsPerSqft: 250 },
  "corrugated-metal": { label: "Corrugated Metal Panels", centsPerSqft: 600 },
  "wood-siding": { label: "Wood Siding", centsPerSqft: 1200 },
  "composite": { label: "Composite Panels", centsPerSqft: 900 },
};

// ============================================
// Fixed Costs (cents)
// ============================================

export const CONTAINER_COST_CENTS = 450000; // $4,500 for 40' High Cube

export const ELECTRICAL_BASE_CENTS = 150000; // $1,500 base panel
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
// Labor Hour Rates
// ============================================

export const LABOR_HOURS = {
  exteriorFramingPerLinearFt: 0.5,
  windowInstallationPerUnit: 4,
  exteriorDoorPerUnit: 6,
  interiorWallPerLinearFt: 1,
  interiorDoorPerUnit: 2,
  insulationPerSqft: 0.05,
  wallFinishDrywallPerSqft: 0.08,
  wallFinishWoodPerSqft: 0.12,
  electricalBase: 2,
  electricalPerFixture: 1.5,
  plumbingBase: 4,
  plumbingPerFixture: 3,
  roofingPerSqft: 0.1,
  roofingDeckPrepPerSqft: 0.05,
  flooringPerSqft: 0.06,
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
  roofingDeckPrep: boolean;
  roofingSolarRails: boolean;
  laborRateCents: number;
  deliveryZip: string;
};

export const DEFAULT_BOM_SELECTIONS: BOMSelections = {
  insulation: "fiberglass-batts",
  interiorFinish: "drywall",
  flooring: "vinyl-plank",
  exteriorFinish: "paint",
  roofingDeckPrep: false,
  roofingSolarRails: false,
  laborRateCents: DEFAULT_LABOR_RATE_CENTS,
  deliveryZip: "",
};

// ============================================
// BOM Calculation Results
// ============================================

export type BOMCategoryResult = {
  label: string;
  costCents: number;
  details?: string;
};

export type BOMCalculation = {
  container: BOMCategoryResult;
  fixtures: BOMCategoryResult;
  wallsInsulation: BOMCategoryResult;
  flooring: BOMCategoryResult;
  electrical: BOMCategoryResult;
  plumbing: BOMCategoryResult;
  exteriorFinish: BOMCategoryResult;
  roofing: BOMCategoryResult;
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


