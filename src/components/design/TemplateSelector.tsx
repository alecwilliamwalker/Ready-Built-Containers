"use client";

import { useState } from "react";
import {
  CABIN_TEMPLATES,
  buildDesignFromZoneSelections,
} from "@/lib/design/templates";
import type { CabinTemplate } from "@/lib/design/templates";
import type { DesignConfig } from "@/types/design";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCents } from "@/lib/format";

export type TemplateSelectorProps = {
  onSelectTemplate: (design: DesignConfig | null) => void;
};

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    CABIN_TEMPLATES[0]?.id ?? ""
  );

  const selectedTemplate = CABIN_TEMPLATES.find(
    (t) => t.id === selectedTemplateId
  );

  const handleStartDesigning = () => {
    if (!selectedTemplate) return;

    const design = buildDesignFromZoneSelections(selectedTemplate.zoneSelections);
    onSelectTemplate(design);
  };

  const handleStartBlank = () => {
    onSelectTemplate(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-[56px]">
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="rounded-3xl border border-surface-muted/60 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Choose Your Layout</h1>
            <p className="mt-2 text-foreground/60">
              Start with a pre-configured template or build from scratch
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label
                htmlFor="cabin-template"
                className="block text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60 mb-3"
              >
                Select a Template
              </label>

              <select
                id="cabin-template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-lg border border-surface-muted/60 bg-white px-4 py-3 text-base text-foreground transition-colors hover:border-forest focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
                suppressHydrationWarning={true}
              >
                {CABIN_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {formatCurrencyCents(template.priceCents)}
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <p className="mt-2 text-sm text-foreground/60">
                  {selectedTemplate.description}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 border-t border-surface-muted/40 pt-6">
              <Button
                type="button"
                className="w-full"
                onClick={handleStartDesigning}
                disabled={!selectedTemplate}
              >
                Start Designing
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
