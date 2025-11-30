import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ModelsGrid } from "@/components/ModelsGrid";
import { SectionTitle } from "@/components/ui/SectionTitle";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Models",
  description: "View our lineup of engineered shipping-container hunting cabins with pricing and specs.",
};

export default async function ModelsPage() {
  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: { images: true },
    orderBy: { basePrice: "asc" },
  });

  const summaries = models.map((model) => ({
    slug: model.slug,
    name: model.name,
    tagline: model.tagline,
    lengthFt: model.lengthFt,
    sleeps: model.sleeps,
    hasBathroom: model.hasBathroom,
    hasKitchen: model.hasKitchen,
    basePrice: model.basePrice,
    images: model.images,
  }));

  return (
    <PageContainer className="space-y-12 py-16">
      <SectionTitle
        eyebrow="Model Lineup"
        title="Two container cabin platforms"
        subtitle="Each build starts with a reinforced high-cube shell, insulated framing package, and engineered delivery plan."
      />
      <ModelsGrid models={summaries} />
    </PageContainer>
  );
}
