import { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <PageContainer className="space-y-10 py-16 text-sm text-foreground/75">
      <SectionTitle eyebrow="Terms" title="Terms of service" subtitle="Plain-language terms for working with Ready Built Containers." />
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Payment schedule</h2>
          <p>
            Quotes are valid for 30 days. Your $5,000 refundable reservation deposit is credited in full toward the build. After engineering documents are approved, payments follow a 50/40/10 structure: 50% to launch fabrication, 40% when interior finishes begin, and the final 10% on delivery and set.
          </p>
          <p>
            Deposits are fully refundable if engineering review or delivery access proves infeasible. Client-initiated cancellations after fabrication starts incur actual costs to date; any remaining balance is refunded.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Change orders & scope adjustments</h2>
          <p>
            Upgrades or layout adjustments after engineering approval are documented with written change orders that summarize scope, price, and schedule impacts. Change orders are approved electronically and the balance is due with the next milestone invoice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Client responsibilities</h2>
          <p>
            Clients handle permitting, site access, pad or foundation construction, and final utility connections. Provide current site photos, measurements, and access notes before delivery is scheduled. Ready Built Containers can recommend partners, but you contract directly with local trades.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Warranty & jurisdiction</h2>
          <p>
            Ready Built Containers warrants structural steel and container modifications for 5 years and workmanship for 2 years. Liability is limited to the cost of services provided. Iowa law governs disputes, and we aim to mediate before formal action. Contact <a href="mailto:contracts@readybuiltcontainers.com" className="underline">contracts@readybuiltcontainers.com</a> with questions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Documentation</h2>
          <p>
            A full builder agreement detailing insurance, site readiness, delivery requirements, and warranty language is shared when you reserve your build slot.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}
