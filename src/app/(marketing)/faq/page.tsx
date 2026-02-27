import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FAQAccordion, type FAQItem } from "@/components/FAQAccordion";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Ready Built Containers, delivery, permits, and customization.",
  alternates: {
    canonical: "/faq",
  },
};

const faqs: FAQItem[] = [
  {
    question: "How much does a cabin really cost?",
    answer:
      "The 40' High Cube starts at $51k delivered within 300 miles of Audubon, IA. The 20' High Cube starts at $29k. We publish a detailed price sheet during your quote.",
  },
  {
    question: "Do I handle permits or do you?",
    answer:
      "Permits required are to be determined by the customer. You handle permits with your county. If your jurisdiction requires additional documentation, our engineering partner can supply it for a small fee.",
  },
  {
    question: "How do you manage insulation and condensation?",
    answer:
      "We add insulation on walls and ceiling, and install a composite subfloor with thermal break. Utility chases are heated.",
  },
  {
    question: "Can I customize the layout or finishes?",
    answer:
      "Yes within reason. Structural openings, window placements, and primary layout follow engineered templates. Interior finishes (flooring, wall cladding, fixtures) and cabinetry can be customized—send us inspiration photos and we will quote it.",
  },
  {
    question: "How is delivery handled?",
    answer:
      "We arrange tilt-deck or crane service and coordinate set on your prepared foundation. Provide clear photos and measurements of access roads. Delivery is typically scheduled 4-6 weeks before completion so you can prep the pad.",
  },
  {
    question: "Can the cabin be moved later?",
    answer:
      "Absolutely. We retain corner castings and lifting points. If you keep the container doors, they latch closed for transport so interior finishes stay protected. We can coordinate a move or you can hire a container hauler.",
  },
  {
    question: "What maintenance should I expect?",
    answer:
      "Annual inspection of door seals, roof coating every 5 years, and standard appliance maintenance. We provide a seasonal checklist covering snow load, condensation monitoring, and generator servicing to keep everything running for decades.",
  },
];

export default function FAQPage() {
  return (
    <PageContainer className="space-y-12 py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }}
      />
      <SectionTitle
        eyebrow="FAQ"
        title="Answers for landowners, outfitters, and hunting guides"
        subtitle="If you still have questions, reach out—our fabrication team lives for the details."
      />
      <FAQAccordion items={faqs} />
    </PageContainer>
  );
}
