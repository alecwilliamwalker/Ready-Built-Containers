import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ReservationForm } from "@/components/ReservationForm";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: "Reserve",
  description:
    "Place a refundable deposit to lock the next available Ready Built Containers production slot for your cabin.",
};

export default async function ReservePage({ searchParams }: { searchParams?: { model?: string } }) {
  const models = await prisma.model.findMany({ where: { isActive: true }, select: { slug: true, name: true } });
  const defaultModelSlug = searchParams?.model ?? "";

  return (
    <PageContainer className="grid gap-12 py-16 lg:grid-cols-[2fr,3fr]">
      <div className="space-y-6">
        <SectionTitle
          eyebrow="Reservation"
          title="Reserve your build slot"
          subtitle="A $5,000 fully-refundable deposit holds the next available production window while we finalize engineering and delivery logistics."
        />
        <div className="space-y-3 text-sm text-foreground/75">
          <p>Your deposit is credited toward the final invoice. If engineering review or delivery access prevents the build, we refund 100% within five business days.</p>
          <p>After payment we schedule the engineering kickoff, deliver permit documents, and lock in fabrication milestones so you can plan pad work with confidence.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Deposit refunded if site access is not feasible after professional evaluation.</li>
            <li>Balance billed 50/40/10: 50% to launch fabrication, 40% when interior finishes begin, and 10% on delivery and set.</li>
            <li>We store the unit up to 30 days after completion—no charge—while you finish the pad.</li>
          </ul>
        </div>
      </div>
      <div className="rounded-3xl border border-surface-muted/60 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(18,23,29,0.65)]">
        <ReservationForm models={models} defaultModelSlug={defaultModelSlug} />
      </div>
    </PageContainer>
  );
}
