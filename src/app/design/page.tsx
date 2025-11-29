import { Metadata } from "next";
import { DesignStudioWrapper } from "@/components/design/DesignStudioWrapper";
import prisma from "@/lib/db";
import { getUserSession } from "@/lib/user-auth";
import { migrateLegacyDesign } from "@/lib/design/legacy-migration";
import type { DesignConfig } from "@/types/design";
import type { BOMSelections } from "@/types/bom";

export const metadata: Metadata = {
  title: "Design Studio",
  description: "Build a custom Ready Built container layout with modular components and visualize it instantly.",
};

type SearchParams = Promise<{ id?: string }>;

export default async function DesignPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const [session, moduleCatalog] = await Promise.all([
    getUserSession(),
    prisma.moduleCatalog.findMany({ orderBy: { category: "asc" } }),
  ]);

  const modules = moduleCatalog.map((module) => ({
    id: module.id,
    key: module.key,
    name: module.name,
    category: module.category,
    schemaJson: module.schemaJson as Record<string, unknown>,
    priceRuleJson: module.priceRuleJson as Record<string, unknown>,
    createdAt: module.createdAt.toISOString(),
  }));

  // Load design if ID provided
  let initialDesign: DesignConfig | null = null;
  let initialDesignName: string | null = null;
  let initialBomSelections: BOMSelections | null = null;
  if (params.id && session) {
    try {
      const design = await prisma.design.findFirst({
        where: { id: params.id, userId: session.sub },
      });
      if (design) {
        // Migrate legacy format if needed
        initialDesign = migrateLegacyDesign(
          design.configJson,
          design.shellLengthFt
        );
        initialDesignName = design.name;
        // Load BOM selections if available
        if (design.bomSelectionsJson) {
          initialBomSelections = design.bomSelectionsJson as BOMSelections;
        }
      }
    } catch (error) {
      console.error("Error loading design:", error);
    }
  }

  return (
    <DesignStudioWrapper
      modules={modules}
      userEmail={session?.email ?? null}
      initialDesign={initialDesign}
      initialDesignName={initialDesignName}
      initialBomSelections={initialBomSelections}
    />
  );
}

