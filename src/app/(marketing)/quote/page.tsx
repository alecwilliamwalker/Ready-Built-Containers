import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { QuoteForm } from "@/components/QuoteForm";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Request a Quote",
  description:
    "Share your property details to receive a detailed Ready Built Containers quote and delivery plan tailored to your site.",
};

export default async function QuotePage({ searchParams }: { searchParams?: { model?: string } }) {
  const models = await prisma.model.findMany({ where: { isActive: true }, select: { slug: true, name: true } });
  const defaultModelSlug = searchParams?.model ?? "";

  return (
    <PageContainer className="grid gap-12 py-16 lg:grid-cols-[2fr,3fr]">
      <div className="space-y-6">
        <SectionTitle
          eyebrow="Quote"
          title="Detailed pricing + delivery plan"
          subtitle="Tell us about your land, access route, and utility preferences. We map logistics, generate permit-ready documents, and share a clear budget."
        />
        <div className="space-y-3 text-sm text-foreground/75">
          <p>After you submit we schedule a 15-minute follow-up call, verify access measurements, and send a written scope with line-item costs.</p>
          <p>
            Typical lead time is 6-8 weeks for fabrication and 1-2 weeks for delivery once permitting and pad prep are complete.
          </p>
        </div>
      </div>
      <div className="rounded-3xl border border-surface-muted/60 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(18,23,29,0.65)]">
        <QuoteForm models={models} defaultModelSlug={defaultModelSlug} />
      </div>
    </PageContainer>
  );
}
