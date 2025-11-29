import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ModelDetail } from "@/components/ModelDetail";
import { QuoteForm } from "@/components/QuoteForm";
import { ConsultationForm } from "@/components/ConsultationForm";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import prisma from "@/lib/db";

export async function generateStaticParams() {
  const models = await prisma.model.findMany({ select: { slug: true } });
  return models.map((model) => ({ slug: model.slug }));
}

type ModelPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    return { title: "Model Not Found" };
  }
  const model = await prisma.model.findUnique({ where: { slug } });
  if (!model) {
    return { title: "Model Not Found" };
  }
  const description = model.tagline ?? model.description.slice(0, 140);
  return {
    title: model.name,
    description,
  };
}

export default async function ModelPage({ params }: ModelPageProps) {
  const { slug } = await params;
  if (!slug || typeof slug !== "string") {
    notFound();
  }
  const model = await prisma.model.findUnique({
    where: { slug },
    include: { images: true, floorplans: true },
  });

  if (!model) {
    notFound();
  }

  const modelOption = { slug: model.slug, name: model.name };

  return (
    <PageContainer className="space-y-16 py-16">
      <ModelDetail model={model} />

      <section className="grid gap-12 rounded-3xl border border-surface-muted/60 bg-white p-8 shadow-[0_30px_80px_-45px_rgba(18,23,29,0.65)] lg:grid-cols-2">
        <div className="space-y-4">
          <SectionTitle
            eyebrow="Quote"
            title={`Request a build plan for ${model.name}`}
            subtitle="We will send a detailed estimate with delivery logistics and recommended options for your property."
          />
          <QuoteForm models={[modelOption]} defaultModelSlug={model.slug} />
        </div>
        <div className="space-y-6">
          <SectionTitle
            eyebrow="Consultation"
            title="Talk spec with our fabrication team"
            subtitle="Pick a time to review site constraints, off-grid utilities, and customization options."
          />
          <ConsultationForm models={[modelOption]} defaultModelSlug={model.slug} />
          <div className="rounded-2xl border border-surface-muted/60 bg-background p-6 text-sm text-foreground/75">
            <p className="font-semibold text-foreground">Ready to reserve?</p>
            <p className="mt-2">
              Lock your build slot with a refundable deposit. We will confirm delivery prep and issue engineering documents immediately after payment.
            </p>
            <Button href={`/reserve?model=${model.slug}`} variant="accent" className="mt-4">
              Start reservation checkout
            </Button>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
