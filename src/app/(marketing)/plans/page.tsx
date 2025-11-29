import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PlansGallery } from "@/components/PlansGallery";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Plan Views",
  description: "Compare floorplans for each Ready Built Containers model and evaluate layout options.",
};

export const dynamic = "force-dynamic";

type PlansPageProps = {
  searchParams: { model?: string };
};

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const [models, floorplans] = await Promise.all([
    prisma.model.findMany({ 
      where: { isActive: true }, 
      select: { 
        slug: true, 
        name: true, 
        lengthFt: true, 
        sleeps: true, 
        basePrice: true 
      } 
    }),
    prisma.floorplan.findMany({ include: { model: { select: { slug: true, name: true } } }, orderBy: { name: "asc" } }),
  ]);

  const activeModel = searchParams.model ?? "all";

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
