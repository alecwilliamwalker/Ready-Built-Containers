import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ConsultationForm } from "@/components/ConsultationForm";
import prisma from "@/lib/db";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Schedule a Consultation",
  description:
    "Book time with Ready Built Containers to review your cabin project, permitting questions, and delivery logistics across the Midwest.",
};

export default async function ConsultationPage({ searchParams }: { searchParams?: { model?: string } }) {
  const models = await prisma.model.findMany({ where: { isActive: true }, select: { slug: true, name: true } });
  const defaultModelSlug = searchParams?.model ?? "";
  const calendlyUrl = env.NEXT_PUBLIC_CALENDLY_URL;

  return (
    <PageContainer className="space-y-12 py-16">
      <SectionTitle
        eyebrow="Consultation"
        title="Talk through site prep, utilities, and customization"
        subtitle="We cover delivery logistics, off-grid options, and what paperwork you need for your jurisdiction."
      />
      {calendlyUrl && (
        <div className="rounded-3xl border border-surface-muted/60 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(18,23,29,0.65)]">
          <iframe
            src={calendlyUrl}
            title="Schedule Consultation"
            className="h-[680px] w-full rounded-2xl border border-surface-muted/60"
            allowTransparency
          />
        </div>
      )}
      <div className="grid gap-10 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-4 text-sm text-foreground/75">
          <p>
            Prefer email instead? Fill out the form and we&apos;ll reply with open slots. Share the terrain conditions, availability of power/water, and any pictures of the route in.
          </p>
          <p>
            For remote Midwest sites we often join by video with your ranch manager or guide to confirm crane or tilt-deck access.
          </p>
        </div>
        <div className="rounded-3xl border border-surface-muted/60 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(18,23,29,0.65)]">
          <ConsultationForm models={models} defaultModelSlug={defaultModelSlug} />
        </div>
      </div>
    </PageContainer>
  );
}
