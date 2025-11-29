import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PageContainer className="space-y-10 py-16 text-sm text-foreground/75">
      <SectionTitle eyebrow="Privacy" title="Privacy policy" subtitle="How Ready Built Containers handles your data." />
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Data we collect</h2>
          <p>When you request pricing, schedule a consultation, or reserve a build slot we collect:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Contact information such as name, email, phone number, and mailing address.</li>
            <li>Property details including site photos, access measurements, permit requirements, and delivery notes.</li>
            <li>Communication history (emails, forms, and call notes) so our team can reference prior conversations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">How we use your information</h2>
          <p>Information is used to prepare budgets, engineering documents, and delivery plans, to follow up on inquiries, and to send transactional updates about your project. We do not sell or rent data.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Storage & retention</h2>
          <p>Project records are stored in secure CRM and file systems hosted in the United States. We retain lead information for 24 months and contract documentation for the life of the warranty unless you request deletion sooner.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Service providers</h2>
          <p>Payments are processed by Stripe and email notifications are delivered by Resend. Both providers receive only the data required to perform their services and are PCI compliant.</p>
          <p>Our site may set cookies for essential session management and basic analytics. You can clear cookies in your browser at any time.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Your choices</h2>
          <p>You can unsubscribe from marketing emails using the link in any message. To access, correct, or delete personal data, email <a href="mailto:privacy@readybuiltcontainers.com" className="underline">privacy@readybuiltcontainers.com</a> and we will respond within 5 business days.</p>
        </section>
      </div>
    </PageContainer>
  );
}
