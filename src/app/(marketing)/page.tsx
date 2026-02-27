import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { ModelsGrid } from "@/components/ModelsGrid";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { FAQAccordion, type FAQItem } from "@/components/FAQAccordion";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { JsonLd } from "@/components/JsonLd";
import prisma from "@/lib/db";

export const metadata: Metadata = {
  title: {
    absolute:
      "Container Hunting Cabins | Off-Grid 20 & 40 High Cube — Ready Built Containers",
  },
  description:
    "Engineered shipping-container hunting cabins built in Audubon, Iowa. 20' High Cube from $29k, 40' from $51k — insulated, locking vestibules, off-grid ready. Delivered across the Midwest.",
  alternates: {
    canonical: "/",
  },
};

const faqPreview: FAQItem[] = [
  {
    question: "What sizes do you offer?",
    answer:
      "We build on 20' and 40' high-cube ISO shells. The 20' High Cube starts at $29k and the 40' High Cube starts at $51k, delivered within 300 miles of Audubon, IA.",
  },
  {
    question: "How off-grid ready are these cabins?",
    answer:
      "Every unit is prewired for solar panels and generator input, with dedicated circuits for battery chargers and appliances. Plumbing is roughed in for cisterns, holding tanks, or composting toilets. Choose your off-grid package: solar + battery, propane generator, or hybrid systems.",
  },
  {
    question: "Can I move the cabin later?",
    answer:
      "Yes. All units remain lift- and haul-ready. The locking vestibule and container doors protect interior finishes during transport—relocate as your lease or property changes.",
  },
];

export default async function HomePage() {
  const models = await prisma.model.findMany({
    where: { isActive: true },
    include: { images: true },
    orderBy: { basePrice: "asc" },
  });

  const modelSummaries = models.map((model) => ({
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
    <div className="space-y-24">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Ready Built Containers",
          description:
            "Engineered shipping-container hunting cabins with secure doors, off-grid options, and turnkey delivery across the Midwest.",
          url: "https://www.readybuiltcontainers.com",
          telephone: "+1-712-563-2024",
          email: "readybuiltcontainers@gmail.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "409 Broadway St",
            addressLocality: "Audubon",
            addressRegion: "IA",
            postalCode: "50025",
            addressCountry: "US",
          },
          areaServed: {
            "@type": "GeoCircle",
            geoMidpoint: {
              "@type": "GeoCoordinates",
              latitude: 41.7183,
              longitude: -94.9322,
            },
            geoRadius: "500 mi",
          },
          image: "https://www.readybuiltcontainers.com/images/hero-main.jpg",
          priceRange: "$29,000–$80,000",
        }}
      />
      <Hero />

      <PageContainer className="space-y-24">
        <section className="grid gap-10 lg:grid-cols-[2fr,3fr] lg:items-center">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Why High Cube"
              title="Built for off-grid living"
              subtitle="High-cube ISO shells deliver the security, insulation, and portability that hunters, outfitters, and remote landowners need."
            />
            <ul className="space-y-4 text-sm text-slate-700">
              <li>
                <strong className="text-slate-900">Locking vestibules:</strong> Original container doors protect the insulated man-door entry. Bolt-on locking bars and optional alarm hardware keep firearms and optics safe between trips.
              </li>
              <li>
                <strong className="text-slate-900">Transportable by design:</strong> Built to ISO standards, both 20&apos; and 40&apos; high-cube units can relocate as your lease or property changes. Standard trucking—no special permits required.
              </li>
              <li>
                <strong className="text-slate-900">Insulated for any climate:</strong> Insulated throughout to keep your bedding comfortable year-round.
              </li>
            </ul>
          </div>
        </section>

        <section id="models" className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="High Cube Lineup"
              title="20' and 40' off-grid platforms"
              subtitle="Choose the shell size that fits your needs—both come with insulated interiors, locking vestibules, and off-grid prewiring."
            />
            <Link href="/models" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              Compare models →
            </Link>
          </div>
          <ModelsGrid models={modelSummaries} />
        </section>

        <section className="space-y-8">
          <SectionTitle
            eyebrow="How It Works"
            title="From order to off-grid ready in 90 days"
            subtitle="We handle fabrication and off-grid systems while you prepare your site."
          />
          <ProcessTimeline />
          <p className="mt-8 text-center text-lg font-semibold text-foreground">
            Elevate your property now with one of our ready built containers!
          </p>
        </section>

        <section className="grid gap-12 rounded-3xl border border-slate-800/60 bg-slate-950/80 p-8 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.9)] lg:grid-cols-[2fr,3fr]" id="lead">
          <div className="space-y-4 text-slate-200">
            <SectionTitle
              eyebrow="Pricing"
              title="Request current availability and pricing"
              subtitle="Share the basics about your property and timeline so we can send an accurate budget range and delivery plan."
              tone="light"
            />
            <p className="text-sm text-slate-300">
              Every inquiry goes direct to our founders. We do not hand your details to a call center. Expect a call within one business day and a written estimate once we confirm delivery logistics.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/80 p-6 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.95)]">
            <LeadCaptureForm source="hero" models={modelSummaries} />
          </div>
        </section>

        <section className="space-y-8">
          <SectionTitle eyebrow="FAQ" title="Common questions" subtitle="If you don't see your question, schedule a consultation—we'll dig in." />
          <FAQAccordion items={faqPreview} />
          <Link href="/faq" className="text-sm font-semibold text-emerald-300 hover:text-emerald-200">
            View full FAQ →
          </Link>
        </section>
      </PageContainer>
    </div>
  );
}
