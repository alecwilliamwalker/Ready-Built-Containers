"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { DesignConfig, ModuleCatalogEntry } from "@/types/design";
import type { BOMSelections } from "@/types/bom";
import { TemplateSelector } from "./TemplateSelector";
import { DesignStudio } from "./DesignStudio";
import { SiteHeader } from "@/components/layout/SiteHeader";

export type DesignStudioWrapperProps = {
  modules: ModuleCatalogEntry[];
  userEmail?: string | null;
  initialDesign?: DesignConfig | null;
  initialDesignName?: string | null;
  initialBomSelections?: BOMSelections | null;
};

function createBlankDesign(): DesignConfig {
  return {
    version: 1,
    shell: {
      id: "shell-40",
      lengthFt: 40,
      widthFt: 8,
      heightFt: 9.5,
    },
    zones: [
      {
        id: "zone-1",
        name: "Main Area",
        xFt: 0,
        yFt: 0,
        lengthFt: 40,
        widthFt: 8,
      },
    ],
    fixtures: [],
  };
}

export function DesignStudioWrapper({
  modules,
  userEmail,
  initialDesign,
  initialDesignName,
  initialBomSelections,
}: DesignStudioWrapperProps) {
  const searchParams = useSearchParams();
  const [selectedDesign, setSelectedDesign] = useState<DesignConfig | null>(
    initialDesign ?? null
  );
  const [selectedName, setSelectedName] = useState<string | null>(
    initialDesignName ?? null
  );

  // If we have an initial design (editing existing), skip template selector
  if (initialDesign) {
    // Extract design ID from URL if editing
    const designId = searchParams.get("id");

    return (
      <DesignStudio
        modules={modules}
        userEmail={userEmail}
        initialDesign={initialDesign}
        initialDesignName={initialDesignName}
        designId={designId}
        initialBomSelections={initialBomSelections}
      />
    );
  }

  // If no design selected yet, show template selector
  if (!selectedDesign) {
    return (
      <>
        <SiteHeader />
        <TemplateSelector
          onSelectTemplate={(design) => {
            if (design) {
              setSelectedDesign(design);
              setSelectedName("Custom Design");
            } else {
              setSelectedDesign(createBlankDesign());
              setSelectedName("Blank Design");
            }
          }}
        />
      </>
    );
  }

  // Show design studio with selected template
  return (
    <DesignStudio
      modules={modules}
      userEmail={userEmail}
      initialDesign={selectedDesign}
      initialDesignName={selectedName}
      designId={null}
      initialBomSelections={null}
    />
  );
}

