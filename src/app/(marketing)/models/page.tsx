import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ModelsGrid } from "@/components/ModelsGrid";
import { SectionTitle } from "@/components/ui/SectionTitle";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "High Cube Models | 20' and 40' Off-Grid Container Cabins",
  description: "Compare our 20' and 40' high-cube ISO container cabins. Insulated interiors, locking vestibules, and complete off-grid systems for hunters, outfitters, and remote landowners.",
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
        eyebrow="High Cube Lineup"
        title="20' and 40' off-grid platforms"
        subtitle="Both sizes feature insulated interiors, locking vestibules, and complete off-grid prewiring. Choose the shell that fits your land and needs."
      />
      <ModelsGrid models={summaries} />
    </PageContainer>
  );
}
