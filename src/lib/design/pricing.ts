import type {
  DesignConfig,
  ModuleCatalogItem,
  PriceLine,
  PriceSummary,
} from "@/types/design";
import { rectFromFixture } from "./geometry";

/**
 * Calculates the price for a design configuration based on the catalog.
 * Returns a summary with subtotal and per-fixture line items.
 */
export function priceDesign(
  design: DesignConfig,
  catalog: Record<string, ModuleCatalogItem>
): PriceSummary {
  const lines: PriceLine[] = [];

  for (const fixture of design.fixtures) {
    const cat = catalog[fixture.catalogKey];
    if (!cat) {
      // Skip unknown fixtures but log a warning
      console.warn(`Unknown catalog key: ${fixture.catalogKey}`);
      continue;
    }

    const rect = rectFromFixture(fixture, cat);

    // Determine run length for per-linear-foot pricing
    // For now, use width as the "run" dimension (can be refined later)
    const runFt =
      cat.priceRule.perLinearFtCents != null ? rect.width : 1;

    const base = cat.priceRule.baseCents ?? 0;
    const perFt = cat.priceRule.perLinearFtCents ?? 0;

    const lineCents = base + perFt * runFt;

    lines.push({
      fixtureId: fixture.id,
      catalogKey: cat.key,
      label: cat.label,
      quantity: 1,
      lineCents,
    });
  }

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineCents, 0);

  return { subtotalCents, lines };
}

