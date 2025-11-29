import Link from "next/link";
import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Thank You",
};

type ThankYouPageProps = {
  searchParams?: { type?: string };
};

const messages: Record<string, { title: string; description: string }> = {
  lead: {
    title: "We received your request",
    description: "Expect pricing and availability in your inbox within one business day. We will call if we need site details or clarification.",
  },
  quote: {
    title: "Quote request submitted",
    description:
      "Our project manager is reviewing your site info now. Look for an email with delivery logistics, upgrade options, and next steps.",
  },
  consultation: {
    title: "Consultation scheduled",
    description: "We will confirm the calendar invite and send a brief prep checklist for measurements, access photos, and utility info.",
  },
  reserve: {
    title: "Reservation in progress",
    description:
      "Once Stripe confirms payment we will issue engineering documents and reach out to coordinate fabrication milestones.",
  },
};

export default function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const type = searchParams?.type ?? "lead";
  const message = messages[type] ?? messages.lead;

  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <SectionTitle eyebrow="Thank You" title={message.title} subtitle={message.description} align="center" />
      <Link href="/" className="text-sm font-semibold text-forest hover:text-forest/80">
        Back to home →
      </Link>
    </PageContainer>
  );
}
