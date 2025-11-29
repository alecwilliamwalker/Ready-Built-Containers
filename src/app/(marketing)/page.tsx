import Link from "next/link";
import { Hero } from "@/components/Hero";
import { PageContainer } from "@/components/layout/PageContainer";
import { ModelsGrid } from "@/components/ModelsGrid";
import { ProcessTimeline } from "@/components/ProcessTimeline";
import { FAQAccordion, type FAQItem } from "@/components/FAQAccordion";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { SectionTitle } from "@/components/ui/SectionTitle";
import prisma from "@/lib/db";

const faqPreview: FAQItem[] = [
  {
    question: "How much does a 40' container cabin cost?",
    answer:
      "Basecamp 40 starts at $118k delivered within 300 miles of Audubon, IA. Most clients land between $145k-$185k after finishes, power kit, and delivery beyond the base radius.",
  },
  {
    question: "Do I need a permit?",
    answer:
      "Each county is different. You are responsible for local permits—we supply engineered drawings, structural calcs, and stamped foundation details to streamline review.",
  },
  {
    question: "Can I move the cabin later?",
    answer:
      "Yes. Units remain lift- and haul-ready. If you keep the container doors, they latch shut for transport so all interior finishes remain protected.",
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
      <Hero />

      <PageContainer className="space-y-24">
        <section className="grid gap-10 lg:grid-cols-[2fr,3fr] lg:items-center">
          <div className="space-y-6">
            <SectionTitle
              eyebrow="Why Steel"
              title="Why choose a container cabin over stick-built?"
              subtitle="Hunters need gear security, thermal performance, and the ability to relocate. Container shells deliver all three."
            />
            <ul className="space-y-4 text-sm text-slate-700">
              <li>
                <strong className="text-slate-900">Lock it and leave it:</strong> Original container doors protect the insulated man-door. Bolt-on locking bars and optional alarm hardware keep firearms and optics safe between trips.
              </li>
              <li>
                <strong className="text-slate-900">Transportable by design:</strong> Built to ISO standards, every unit can relocate as your lease or property portfolio evolves. No special permits for 40' high-cube moves.
              </li>
              <li>
                <strong className="text-slate-900">Engineered for harsh climates:</strong> Closed-cell foam, heated utility chase, and dehumidification keep condensation off your rifles and bedding.
              </li>
            </ul>
          </div>
          <div className="grid gap-4 rounded-3xl border border-slate-800/60 bg-[#f4eee2] p-6 text-slate-900 shadow-[0_35px_90px_-50px_rgba(15,23,42,0.6)]">
            <h3 className="text-xl font-semibold">Off-grid ready from day one</h3>
            <p className="text-sm text-slate-800/80">
              We prewire for solar and generator input, run dedicated circuits for battery chargers and freezer, and rough in plumbing for holding tanks or composting toilets. Choose your preferred package: solar + battery banks, propane generator, or hybrid.
            </p>
            <div className="grid gap-3 text-sm text-slate-900 md:grid-cols-2">
              <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-inner">
                <p className="font-semibold">Power</p>
                <p>Prewired inverter panel, 30A shore power, Honda EU or solar integration.</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-inner">
                <p className="font-semibold">Water</p>
                <p>PEX manifold plumbing with quick-connect pump for cistern or gravity feed.</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-inner">
                <p className="font-semibold">Heat</p>
                <p>Diesel or propane heaters with backup electric panel heaters for shoulder seasons.</p>
              </div>
              <div className="rounded-2xl bg-white/70 px-4 py-3 shadow-inner">
                <p className="font-semibold">Monitoring</p>
                <p>Optional Starlink-ready mast, cellular booster, and low-temp alarm integrations.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="models" className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionTitle
              eyebrow="Model Overview"
              title="Standard layouts engineered for the field"
              subtitle="Pick the floor plan that fits your hunting camp, then customize bunks, storage, and systems."
            />
            <Link href="/models" className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              Explore all models →
            </Link>
          </div>
          <ModelsGrid models={modelSummaries} />
        </section>

        <section className="space-y-8">
          <SectionTitle
            eyebrow="How It Works"
            title="From idea to hunt-ready cabin in 120 days"
            subtitle="We manage fabrication while you prepare the pad and handle permits."
          />
          <ProcessTimeline />
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
