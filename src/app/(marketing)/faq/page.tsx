import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { FAQAccordion, type FAQItem } from "@/components/FAQAccordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Ready Built Containers, delivery, permits, and customization.",
};

const faqs: FAQItem[] = [
  {
    question: "How much does a cabin really cost?",
    answer:
      "Basecamp 40 starts at $118k delivered within 300 miles of Audubon, IA. Most turn-key packages (finishes, off-grid kit, extended delivery) run $145k-$185k. We publish a detailed price sheet during your quote.",
  },
  {
    question: "Do I handle permits or do you?",
    answer:
      "You handle permits with your county. We provide stamped structural drawings, foundation details, and engineer letters to support the submission. If your jurisdiction requires additional documentation, our engineering partner can supply it for a small fee.",
  },
  {
    question: "How do you manage insulation and condensation?",
    answer:
      "We spray closed-cell foam on walls/ceiling, install a composite subfloor with thermal break, and run a dedicated heat recovery ventilator. Utility chases are heated, and we include humidity sensors to monitor long-term performance.",
  },
  {
    question: "Can I customize the layout or finishes?",
    answer:
      "Yes within reason. Structural openings, window placements, and primary layout follow engineered templates. Interior finishes (flooring, wall cladding, fixtures) and cabinetry can be customized—send us inspiration photos and we will quote it.",
  },
  {
    question: "What off-grid options are available?",
    answer:
      "We prewire for 30A shore power, install generator transfer switch, and offer solar/battery packages sized from 4 kW to 12 kW. Water can be handled through well tie-in, cistern and pump, or hauled-in storage. Waste options include septic, holding tank, or composting toilet integration.",
  },
  {
    question: "How is delivery handled?",
    answer:
      "We arrange tilt-deck or crane service, coordinate escorts if required, and manage set on your prepared foundation. Provide clear photos and measurements of access roads. Delivery is typically scheduled 4-6 weeks before completion so you can prep the pad.",
  },
  {
    question: "Can the cabin be moved later?",
    answer:
      "Absolutely. We retain corner castings and lifting points. If you keep the container doors, they latch closed for transport so interior finishes stay protected. We can coordinate a move or you can hire a container hauler.",
  },
  {
    question: "What maintenance should I expect?",
    answer:
      "Annual inspection of door seals, roof coating every 5 years, and standard HVAC appliance maintenance. We provide a seasonal checklist covering snow load, condensation monitoring, and generator servicing to keep everything running for decades.",
  },
];

export default function FAQPage() {
  return (
    <PageContainer className="space-y-12 py-16">
      <SectionTitle
        eyebrow="FAQ"
        title="Answers for landowners, outfitters, and hunting guides"
        subtitle="If you still have questions, reach out—our fabrication team lives for the details."
      />
      <FAQAccordion items={faqs} />
    </PageContainer>
  );
}
