import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PlansGallery } from "@/components/PlansGallery";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Plan Views",
  description: "Compare floorplans for each Ready Built Containers model and evaluate layout options.",
  alternates: {
    canonical: "/plans",
  },
};

export const dynamic = "force-dynamic";

type PlansPageProps = {
  searchParams: Promise<{ model?: string }>;
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const [models, floorplans] = await Promise.all([
    prisma.model.findMany({
      // Only show active, non-Standard models (hc40, hc20)
      where: { isActive: true, slug: { not: "standard" } },
      select: {
        slug: true,
        name: true,
        lengthFt: true,
        sleeps: true,
        basePrice: true
      }
    }),
    // Only fetch floorplans for active, non-Standard models
    prisma.floorplan.findMany({
      where: { model: { isActive: true, slug: { not: "standard" } } },
      include: { model: { select: { slug: true, name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const resolvedParams = await searchParams;
  // Default to 40' High Cube instead of "all" (All Plans option removed)
  const activeModel = resolvedParams?.model ?? "hc40";

  return (
    <PageContainer className="space-y-12 py-16">
      <SectionTitle
        eyebrow="Plan Views"
        title="Compare interior layouts"
        subtitle="Select a model to filter the gallery or review them all side by side."
      />
      <PlansGallery models={models} floorplans={floorplans} initialModel={activeModel} />
    </PageContainer>
  );
}
