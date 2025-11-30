/**
 * Bill of Materials Calculator
 * 
 * Pure functions for calculating all BOM costs from a design configuration.
 */

import type { DesignConfig, ModuleCatalogItem, FixtureConfig } from "@/types/design";
import type {
  BOMSelections,
  BOMCalculation,
  DesignAnalysis,
  LaborBreakdownItem,
  ElectricalLoadBreakdown,
  ElectricalSystemInfo,
  ElectricalPowerSource,
  GeneratorTier,
  SolarBatteryTier,
} from "@/types/bom";
import {
  CONTAINER_COST_CENTS,
  ELECTRICAL_BASE_CENTS,
  ELECTRICAL_PER_FIXTURE_CENTS,
  PLUMBING_BASE_CENTS,
  PLUMBING_PER_FIXTURE_CENTS,
  ROOFING_BASE_CENTS_PER_SQFT,
  ROOFING_DECK_PREP_CENTS_PER_SQFT,
  ROOFING_SOLAR_RAILS_CENTS_PER_SQFT,
  LABOR_HOURS,
  FIXTURE_WATTAGES,
  HEATING_WATTS_PER_SQFT,
  BASE_LIGHTING_WATTS,
  GENERATOR_TIERS,
  SOLAR_BATTERY_TIERS,
  ELECTRICAL_POWER_SOURCE_LABELS,
} from "@/types/bom";
import { priceDesign } from "./pricing";
import { getDistanceFromAudubon, calculateDeliveryCost, getZipLabel } from "./zip-distance";

// Re-import price constants for calculations
import {
  INSULATION_PRICES as INS_PRICES,
  INTERIOR_FINISH_PRICES as INT_PRICES,
  FLOORING_PRICES as FLR_PRICES,
  EXTERIOR_FINISH_PRICES as EXT_PRICES,
  ROOFING_PRICES as ROOF_PRICES,
  FOUNDATION_PRICES as FOUND_PRICES,
} from "@/types/bom";

/**
 * Analyze a design to extract dimensions and counts needed for BOM
 */
export function analyzeDesign(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
): DesignAnalysis {
  const { shell, fixtures } = design;
  
  // Shell dimensions
  const shellLengthFt = shell.lengthFt;
  const shellWidthFt = shell.widthFt;
  const shellHeightFt = shell.heightFt;
  
  // Calculated areas
  const perimeterFt = 2 * (shellLengthFt + shellWidthFt);
  const floorSqft = shellLengthFt * shellWidthFt;
  const roofSqft = floorSqft;
  const externalWallSqft = perimeterFt * shellHeightFt;
  
  // Count fixtures by type
  let windowCount = 0;
  let exteriorDoorCount = 0;
  let interiorDoorCount = 0;
  let interiorWallLinearFt = 0;
  let poweredFixtureCount = 0;
  let wetFixtureCount = 0;
  let totalFixtureCount = 0;
  let openingsSqft = 0;
  
  for (const fixture of fixtures) {
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) continue;
    
    totalFixtureCount++;
    
    // Count by key pattern
    const key = fixture.catalogKey.toLowerCase();
    
    if (key.includes("window")) {
      windowCount++;
      // Estimate window opening area (width × height from catalog key pattern)
      // fixture-window-24x36 = 2ft × 3ft, fixture-window-36x48 = 3ft × 4ft
      if (key.includes("24x36")) {
        openingsSqft += 2 * 3;
      } else if (key.includes("36x48")) {
        openingsSqft += 3 * 4;
      } else {
        openingsSqft += 6; // Default estimate
      }
    }
    
    if (key.includes("exterior-door")) {
      exteriorDoorCount++;
      openingsSqft += 3 * 7; // Standard door opening
    }
    
    if (key.includes("interior-door")) {
      interiorDoorCount++;
    }
    
    if (key.includes("wall") && catalogItem.category === "interior") {
      // Interior wall - calculate length from properties or footprint
      const wallLength = (fixture.properties?.lengthOverrideFt as number) || 
                         catalogItem.footprintFt.length;
      interiorWallLinearFt += wallLength;
    }
    
    // Check for powered fixtures
    const schema = catalogItem as ModuleCatalogItem & { requiresUtilities?: string[] };
    const utilities = schema.requiresUtilities || [];
    
    if (utilities.includes("power")) {
      poweredFixtureCount++;
    }
    
    if (utilities.includes("water") || utilities.includes("waste")) {
      wetFixtureCount++;
    }
  }
  
  // Interior wall surface area (both sides × height)
  const interiorWallSqft = interiorWallLinearFt * shellHeightFt * 2;
  
  return {
    shellLengthFt,
    shellWidthFt,
    shellHeightFt,
    perimeterFt,
    floorSqft,
    roofSqft,
    externalWallSqft,
    windowCount,
    exteriorDoorCount,
    interiorDoorCount,
    interiorWallLinearFt,
    interiorWallSqft,
    poweredFixtureCount,
    wetFixtureCount,
    totalFixtureCount,
    openingsSqft,
  };
}

// ============================================
// Electrical Load Calculation Functions
// ============================================

/**
 * Calculate heating load based on floor area
 * Uses ~10W per sqft for electric space heating
 */
export function calculateHeatingLoad(floorSqft: number): number {
  return Math.round(floorSqft * HEATING_WATTS_PER_SQFT);
}

/**
 * Get wattage for a fixture by its catalog key
 */
function getFixtureWattage(catalogKey: string): number {
  // Check for exact match
  if (FIXTURE_WATTAGES[catalogKey]) {
    return FIXTURE_WATTAGES[catalogKey];
  }
  // Return default wattage for unknown powered fixtures
  return FIXTURE_WATTAGES["default"];
}

/**
 * Calculate total fixture electrical load
 */
export function calculateFixtureLoad(
  fixtures: FixtureConfig[],
  catalog: Record<string, ModuleCatalogItem>
): { totalWatts: number; details: { label: string; watts: number }[] } {
  const details: { label: string; watts: number }[] = [];
  let totalWatts = 0;

  for (const fixture of fixtures) {
    const catalogItem = catalog[fixture.catalogKey];
    if (!catalogItem) continue;

    // Check if fixture requires power
    const utilities = catalogItem.requiresUtilities || [];
    if (utilities.includes("power")) {
      const watts = getFixtureWattage(fixture.catalogKey);
      totalWatts += watts;
      details.push({
        label: catalogItem.label,
        watts,
      });
    }
  }

  return { totalWatts, details };
}

/**
 * Calculate complete electrical load breakdown
 */
export function calculateElectricalLoad(
  analysis: DesignAnalysis,
  fixtures: FixtureConfig[],
  catalog: Record<string, ModuleCatalogItem>
): ElectricalLoadBreakdown {
  // Heating load based on floor area
  const heatingWatts = calculateHeatingLoad(analysis.floorSqft);

  // Fixture load
  const { totalWatts: fixtureWatts, details: fixtureDetails } = calculateFixtureLoad(
    fixtures,
    catalog
  );

  // Base lighting load
  const lightingWatts = BASE_LIGHTING_WATTS;

  // Total load
  const totalWatts = heatingWatts + fixtureWatts + lightingWatts;

  return {
    heatingWatts,
    fixtureWatts,
    lightingWatts,
    totalWatts,
    fixtureDetails,
  };
}

/**
 * Size a generator based on total wattage requirement
 * Adds 20% headroom for peak loads
 */
export function sizeGenerator(totalWatts: number): GeneratorTier {
  // Add 20% headroom for peak/startup loads
  const requiredWatts = Math.round(totalWatts * 1.2);

  // Find the appropriate tier
  for (const tier of GENERATOR_TIERS) {
    if (requiredWatts <= tier.maxWatts) {
      return tier;
    }
  }

  // Return largest tier if load exceeds all tiers
  return GENERATOR_TIERS[GENERATOR_TIERS.length - 1];
}

/**
 * Size a solar + battery system based on total wattage requirement
 * Assumes 5 hours of peak sun per day and 2 days of battery backup
 */
export function sizeSolarBattery(totalWatts: number): SolarBatteryTier {
  // Add 20% headroom
  const requiredWatts = Math.round(totalWatts * 1.2);

  // Find the appropriate tier
  for (const tier of SOLAR_BATTERY_TIERS) {
    if (requiredWatts <= tier.maxWatts) {
      return tier;
    }
  }

  // Return largest tier if load exceeds all tiers
  return SOLAR_BATTERY_TIERS[SOLAR_BATTERY_TIERS.length - 1];
}

/**
 * Calculate electrical system info based on power source selection
 */
export function calculateElectricalSystem(
  powerSource: ElectricalPowerSource,
  loadBreakdown: ElectricalLoadBreakdown
): ElectricalSystemInfo {
  let systemLabel: string | undefined;
  let systemCostCents = 0;

  switch (powerSource) {
    case "generator": {
      const tier = sizeGenerator(loadBreakdown.totalWatts);
      systemLabel = tier.label;
      systemCostCents = tier.priceCents;
      break;
    }
    case "solar-battery": {
      const tier = sizeSolarBattery(loadBreakdown.totalWatts);
      systemLabel = tier.label;
      systemCostCents = tier.priceCents;
      break;
    }
    case "grid":
    default:
      // Grid connection - no additional system cost
      systemLabel = undefined;
      systemCostCents = 0;
      break;
  }

  return {
    powerSource,
    loadBreakdown,
    systemLabel,
    systemCostCents,
  };
}

/**
 * Calculate labor hours breakdown
 */
export function calculateLaborHours(
  analysis: DesignAnalysis,
  selections: BOMSelections
): LaborBreakdownItem[] {
  const breakdown: LaborBreakdownItem[] = [];
  
  // Exterior wall framing
  breakdown.push({
    category: "exterior-framing",
    label: "Exterior Wall Framing",
    hours: Math.round(analysis.perimeterFt * LABOR_HOURS.exteriorFramingPerLinearFt * 10) / 10,
    description: `${analysis.perimeterFt} linear ft`,
  });
  
  // Window installation
  if (analysis.windowCount > 0) {
    breakdown.push({
      category: "window-installation",
      label: "Window Installation",
      hours: analysis.windowCount * LABOR_HOURS.windowInstallationPerUnit,
      description: `${analysis.windowCount} windows`,
    });
  }
  
  // Exterior doors
  if (analysis.exteriorDoorCount > 0) {
    breakdown.push({
      category: "exterior-door",
      label: "Exterior Door Installation",
      hours: analysis.exteriorDoorCount * LABOR_HOURS.exteriorDoorPerUnit,
      description: `${analysis.exteriorDoorCount} doors`,
    });
  }
  
  // Interior wall framing
  if (analysis.interiorWallLinearFt > 0) {
    breakdown.push({
      category: "interior-wall-framing",
      label: "Interior Wall Framing",
      hours: Math.round(analysis.interiorWallLinearFt * LABOR_HOURS.interiorWallPerLinearFt * 10) / 10,
      description: `${analysis.interiorWallLinearFt} linear ft`,
    });
  }
  
  // Interior doors
  if (analysis.interiorDoorCount > 0) {
    breakdown.push({
      category: "interior-door",
      label: "Interior Door Installation",
      hours: analysis.interiorDoorCount * LABOR_HOURS.interiorDoorPerUnit,
      description: `${analysis.interiorDoorCount} doors`,
    });
  }
  
  // Insulation
  const totalWallSqft = analysis.externalWallSqft - analysis.openingsSqft + analysis.interiorWallSqft;
  breakdown.push({
    category: "insulation",
    label: "Insulation Installation",
    hours: Math.round(totalWallSqft * LABOR_HOURS.insulationPerSqft * 10) / 10,
    description: `${Math.round(totalWallSqft)} sqft`,
  });
  
  // Wall finish
  const wallFinishRate = selections.interiorFinish === "drywall" 
    ? LABOR_HOURS.wallFinishDrywallPerSqft 
    : LABOR_HOURS.wallFinishWoodPerSqft;
  breakdown.push({
    category: "wall-finish",
    label: "Interior Wall Finish",
    hours: Math.round(totalWallSqft * wallFinishRate * 10) / 10,
    description: `${Math.round(totalWallSqft)} sqft (${INS_PRICES[selections.insulation]?.label || selections.interiorFinish})`,
  });
  
  // Electrical
  const electricalHours = LABOR_HOURS.electricalBase + 
    (analysis.poweredFixtureCount * LABOR_HOURS.electricalPerFixture);
  breakdown.push({
    category: "electrical",
    label: "Electrical Rough-In",
    hours: Math.round(electricalHours * 10) / 10,
    description: `Panel + ${analysis.poweredFixtureCount} fixtures`,
  });
  
  // Plumbing
  const plumbingHours = LABOR_HOURS.plumbingBase + 
    (analysis.wetFixtureCount * LABOR_HOURS.plumbingPerFixture);
  breakdown.push({
    category: "plumbing",
    label: "Plumbing Rough-In",
    hours: Math.round(plumbingHours * 10) / 10,
    description: `Rough-in + ${analysis.wetFixtureCount} fixtures`,
  });
  
  // Roofing
  let roofingHours = selections.roofingType === "none" ? 0 : analysis.roofSqft * LABOR_HOURS.roofingPerSqft;
  if (selections.roofingType !== "none" && selections.roofingDeckPrep) {
    roofingHours += analysis.roofSqft * LABOR_HOURS.roofingDeckPrepPerSqft;
  }
  breakdown.push({
    category: "roofing",
    label: "Roofing/Membrane",
    hours: Math.round(roofingHours * 10) / 10,
    description: selections.roofingType === "none" ? "None" : `${analysis.roofSqft} sqft${selections.roofingDeckPrep ? " + deck prep" : ""}`,
  });
  
  // Flooring
  breakdown.push({
    category: "flooring",
    label: "Flooring Installation",
    hours: Math.round(analysis.floorSqft * LABOR_HOURS.flooringPerSqft * 10) / 10,
    description: `${analysis.floorSqft} sqft`,
  });
  
  // Exterior finish
  const extFinishRate = selections.exteriorFinish === "none"
    ? 0
    : selections.exteriorFinish === "paint" 
      ? LABOR_HOURS.exteriorFinishPaintPerSqft 
      : LABOR_HOURS.exteriorFinishSidingPerSqft;
  breakdown.push({
    category: "exterior-finish",
    label: "Exterior Finish",
    hours: Math.round(analysis.externalWallSqft * extFinishRate * 10) / 10,
    description: `${Math.round(analysis.externalWallSqft)} sqft`,
  });
  
  // Fixture installation
  breakdown.push({
    category: "fixture-install",
    label: "Fixture/Appliance Install",
    hours: analysis.totalFixtureCount * LABOR_HOURS.fixtureInstallPerUnit,
    description: `${analysis.totalFixtureCount} fixtures`,
  });
  
  // Trim & finish
  const totalOpenings = analysis.windowCount + analysis.exteriorDoorCount + analysis.interiorDoorCount;
  breakdown.push({
    category: "trim-finish",
    label: "Trim & Finish Work",
    hours: LABOR_HOURS.trimBaseHours + (totalOpenings * LABOR_HOURS.trimPerOpening),
    description: `${totalOpenings} openings`,
  });
  
  // Cleanup
  breakdown.push({
    category: "cleanup",
    label: "Final Cleanup",
    hours: LABOR_HOURS.cleanupHours,
  });
  
  return breakdown;
}

/**
 * Calculate complete BOM from design and selections
 */
export function calculateBOM(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>,
  selections: BOMSelections
): BOMCalculation {
  const analysis = analyzeDesign(design, catalog);
  
  // 1. Container
  const container = {
    label: "Container Shell",
    costCents: CONTAINER_COST_CENTS,
    details: `40' High Cube (${analysis.shellLengthFt}' × ${analysis.shellWidthFt}' × ${analysis.shellHeightFt}')`,
  };
  
  // 2. Fixtures (from existing pricing)
  const fixturePricing = priceDesign(design, catalog);
  const fixtures = {
    label: "Fixtures & Appliances",
    costCents: fixturePricing.subtotalCents,
    details: `${analysis.totalFixtureCount} items`,
  };
  
  // 3. Walls & Insulation
  const netWallSqft = analysis.externalWallSqft - analysis.openingsSqft;
  const totalInteriorSqft = netWallSqft + analysis.interiorWallSqft;
  
  const insulationCost = Math.round(totalInteriorSqft * INS_PRICES[selections.insulation].centsPerSqft);
  const interiorFinishCost = Math.round(totalInteriorSqft * INT_PRICES[selections.interiorFinish].centsPerSqft);
  
  const wallsInsulation = {
    label: "Walls & Insulation",
    costCents: insulationCost + interiorFinishCost,
    details: `${Math.round(totalInteriorSqft)} sqft (${INS_PRICES[selections.insulation].label} + ${INT_PRICES[selections.interiorFinish].label})`,
  };
  
  // 4. Flooring
  const flooringCost = Math.round(analysis.floorSqft * FLR_PRICES[selections.flooring].centsPerSqft);
  const flooring = {
    label: "Flooring",
    costCents: flooringCost,
    details: `${analysis.floorSqft} sqft (${FLR_PRICES[selections.flooring].label})`,
  };
  
  // 5. Electrical (with power source selection)
  const loadBreakdown = calculateElectricalLoad(analysis, design.fixtures, catalog);
  const systemInfo = calculateElectricalSystem(selections.electricalPowerSource, loadBreakdown);
  
  // Base electrical cost (wiring, panel, fixtures)
  const baseElectricalCost = ELECTRICAL_BASE_CENTS + 
    (analysis.poweredFixtureCount * ELECTRICAL_PER_FIXTURE_CENTS);
  
  // Total electrical cost includes power system for off-grid options
  const totalElectricalCost = baseElectricalCost + systemInfo.systemCostCents;
  
  // Build details string
  let electricalDetails = `${ELECTRICAL_POWER_SOURCE_LABELS[selections.electricalPowerSource]}`;
  if (systemInfo.systemLabel) {
    electricalDetails += ` (${systemInfo.systemLabel})`;
  }
  electricalDetails += ` • ${(loadBreakdown.totalWatts / 1000).toFixed(1)}kW load`;
  
  const electrical = {
    label: "Electrical",
    costCents: totalElectricalCost,
    details: electricalDetails,
    systemInfo,
  };
  
  // 6. Plumbing
  const plumbingCost = PLUMBING_BASE_CENTS + 
    (analysis.wetFixtureCount * PLUMBING_PER_FIXTURE_CENTS);
  const plumbing = {
    label: "Plumbing",
    costCents: plumbingCost,
    details: `Rough-in + ${analysis.wetFixtureCount} wet fixtures`,
  };
  
  // 7. Exterior finish
  const extFinishCost = Math.round(analysis.externalWallSqft * EXT_PRICES[selections.exteriorFinish].centsPerSqft);
  const exteriorFinish = {
    label: "Exterior Finish",
    costCents: extFinishCost,
    details: `${Math.round(analysis.externalWallSqft)} sqft (${EXT_PRICES[selections.exteriorFinish].label})`,
  };
  
  // 8. Roofing
  let roofingCost = Math.round(analysis.roofSqft * ROOF_PRICES[selections.roofingType].centsPerSqft);
  const roofingOptions: string[] = selections.roofingType === "none" ? ["None"] : [ROOF_PRICES[selections.roofingType].label];
  
  if (selections.roofingType !== "none") {
    if (selections.roofingDeckPrep) {
      roofingCost += Math.round(analysis.roofSqft * ROOFING_DECK_PREP_CENTS_PER_SQFT);
      roofingOptions.push("Deck Prep");
    }
    if (selections.roofingSolarRails) {
      roofingCost += Math.round(analysis.roofSqft * ROOFING_SOLAR_RAILS_CENTS_PER_SQFT);
      roofingOptions.push("Solar Rails");
    }
  }
  
  const roofing = {
    label: "Roofing",
    costCents: roofingCost,
    details: selections.roofingType === "none" ? "None" : `${analysis.roofSqft} sqft (${roofingOptions.join(" + ")})`,
  };
  
  // 9. Foundation
  const foundationCost = FOUND_PRICES[selections.foundation].baseCents;
  const foundation = {
    label: "Foundation",
    costCents: foundationCost,
    details: FOUND_PRICES[selections.foundation].label,
  };
  
  // 10. Labor
  const laborBreakdown = calculateLaborHours(analysis, selections);
  const totalHours = laborBreakdown.reduce((sum, item) => sum + item.hours, 0);
  const laborCost = Math.round(totalHours * selections.laborRateCents);
  
  const labor = {
    label: "Labor",
    costCents: laborCost,
    details: `${Math.round(totalHours)} hrs × $${(selections.laborRateCents / 100).toFixed(2)}/hr`,
    breakdown: laborBreakdown,
    totalHours: Math.round(totalHours * 10) / 10,
  };
  
  // 11. Delivery
  let deliveryDistanceMiles: number | null = null;
  let deliveryCost = 0;
  let deliveryDetails = "Enter ZIP code";
  
  if (selections.deliveryZip && selections.deliveryZip.length >= 5) {
    deliveryDistanceMiles = getDistanceFromAudubon(selections.deliveryZip);
    
    if (deliveryDistanceMiles !== null) {
      deliveryCost = calculateDeliveryCost(deliveryDistanceMiles);
      const zipLabel = getZipLabel(selections.deliveryZip);
      deliveryDetails = zipLabel 
        ? `${deliveryDistanceMiles} mi to ${zipLabel}`
        : `${deliveryDistanceMiles} mi from Audubon, IA`;
    } else {
      deliveryDetails = "ZIP code not found";
    }
  }
  
  const delivery = {
    label: "Delivery",
    costCents: deliveryCost,
    details: deliveryDetails,
    distanceMiles: deliveryDistanceMiles,
  };
  
  // Totals
  const subtotalCents = 
    container.costCents +
    fixtures.costCents +
    wallsInsulation.costCents +
    flooring.costCents +
    electrical.costCents +
    plumbing.costCents +
    exteriorFinish.costCents +
    roofing.costCents +
    foundation.costCents +
    labor.costCents +
    delivery.costCents;
  
  const contingencyCents = Math.round(subtotalCents * 0.1); // 10% contingency
  const grandTotalCents = subtotalCents + contingencyCents;
  
  return {
    container,
    fixtures,
    wallsInsulation,
    flooring,
    electrical,
    plumbing,
    exteriorFinish,
    roofing,
    foundation,
    labor,
    delivery,
    subtotalCents,
    contingencyCents,
    grandTotalCents,
  };
}

/**
 * Get design analysis for display
 */
export function getDesignAnalysis(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
): DesignAnalysis {
  return analyzeDesign(design, catalog);
}


