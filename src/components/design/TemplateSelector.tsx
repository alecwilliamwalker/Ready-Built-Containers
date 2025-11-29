"use client";

import { useState } from "react";
import type { ZoneType, TemplateTier } from "@/lib/design/templates";
import {
  ZONE_INFO,
  getZoneTemplatesByZone,
  buildDesignFromZoneSelections,
  calculateTotalPrice
} from "@/lib/design/templates";
import type { DesignConfig } from "@/types/design";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCents } from "@/lib/format";

export type TemplateSelectorProps = {
  onSelectTemplate: (design: DesignConfig | null) => void;
};

const TIERS: { id: TemplateTier; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "standard", label: "Standard" },
  { id: "ultimate", label: "Ultimate" },
];

const ZONE_ORDER: ZoneType[] = ["kitchen-living", "bath-hallway", "hallway", "bedroom"];

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedZones, setSelectedZones] = useState<Record<ZoneType, TemplateTier | "">>({
    "kitchen-living": "basic",
    "bath-hallway": "basic",
    "hallway": "basic",
    "bedroom": "basic",
  });

  const handleZoneChange = (zone: ZoneType, tier: TemplateTier | "") => {
    setSelectedZones(prev => ({
      ...prev,
      [zone]: tier,
    }));
  };

  const allZonesSelected = ZONE_ORDER.every(zone => selectedZones[zone] !== "");

  const handleStartDesigning = () => {
    if (!allZonesSelected) return;

    const design = buildDesignFromZoneSelections(selectedZones as Record<ZoneType, TemplateTier>);
    onSelectTemplate(design);
  };

  const handleStartBlank = () => {
    onSelectTemplate(null);
  };

  const totalPrice = calculateTotalPrice(selectedZones);

  return (
    <div className="min-h-screen bg-slate-950 pt-[56px]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="rounded-3xl border border-surface-muted/60 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Choose Your Layout</h1>
            <p className="mt-2 text-foreground/60">
              Start with a pre-configured template or build from scratch
            </p>
          </div>

          <div className="space-y-6 pb-20">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Select Category
            </h2>

            {/* Zone Selection Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {ZONE_ORDER.map((zone) => {
                const zoneInfo = ZONE_INFO[zone];
                const templates = getZoneTemplatesByZone(zone);
                const selectedTier = selectedZones[zone];

                return (
                  <div
                    key={zone}
                    className="rounded-2xl border-2 border-surface-muted/60 bg-surface p-6 transition-all hover:border-forest hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {zoneInfo.label}
                        </h3>
                        <p className="mt-1 text-sm text-foreground/60">{zoneInfo.description}</p>
                        <p className="mt-1 text-xs text-foreground/40">
                          {zoneInfo.defaultLengthFt}' length
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <select
                        value={selectedTier}
                        onChange={(e) => handleZoneChange(zone, e.target.value as TemplateTier | "")}
                        className="w-full rounded-lg border border-surface-muted/60 bg-white px-3 py-2 text-sm text-foreground transition-colors hover:border-forest focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                        suppressHydrationWarning={true}
                      >
                        <option value="">Select tier...</option>
                        {TIERS.map((tier) => {
                          const template = templates.find((t) => t.tier === tier.id);
                          if (!template) return null;
                          return (
                            <option key={tier.id} value={tier.id}>
                              {tier.label} - {formatCurrencyCents(template.priceCents)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Price Display */}
            {allZonesSelected && (
              <div className="rounded-xl border border-forest/20 bg-forest/5 p-4 text-center">
                <div className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
                  Total Estimated Price
                </div>
                <div className="mt-1 text-3xl font-bold text-forest">
                  {formatCurrencyCents(totalPrice)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 space-y-3 border-t border-surface-muted/40 pt-6">
              <Button
                type="button"
                className="w-full"
                onClick={handleStartDesigning}
                disabled={!allZonesSelected}
              >
                {allZonesSelected ? "Start Designing" : "Select all zones to continue"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleStartBlank}
              >
                Start from Blank Canvas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
