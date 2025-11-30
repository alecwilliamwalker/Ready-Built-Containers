import Image from "next/image";
import { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Process",
  description: "Understand Ready Built Containers' build process from design through delivery and set.",
};

const STEPS: {
  step: string;
  title: string;
  description: ReactNode;
  image: string;
  imageAlt: string;
  badgeClass: string;
}[] = [
    {
      step: "1",
      title: "Choose your model",
      description: (
        <>
          Compare Standard and Deluxe layouts, choose bunks and power, and add an off-grid kit if needed. We flag what's included and what's worth upgrading.
        </>
      ),
      image: "/images/process-1-models.png",
      imageAlt: "Top-down layout options",
      badgeClass: "bg-emerald-600",
    },
    {
      step: "2",
      title: "Site & permits",
      description: (
        <>
          You send site photos, access info, and local requirements. We provide stamped drawings and anchor details so your authority has what they need.
        </>
      ),
      image: "/images/process-2-permits.png",
      imageAlt: "Permit plans and documentation",
      badgeClass: "bg-cyan-600",
    },
    {
      step: "3",
      title: "Build & spec confirmation",
      description: (
        <>
          We cut openings, add the entry, frame, insulate, and run <abbr title="Electrical and plumbing run before finishes">rough-ins</abbr>. Before finishes go in, you approve a clear spec sheet.
        </>
      ),
      image: "/images/process-3-shop.png",
      imageAlt: "Shop fabrication of container cabin",
      badgeClass: "bg-amber-600",
    },
    {
      step: "4",
      title: "Delivery & set",
      description: (
        <>
          We coordinate <abbr title="Tilt-deck truck for easy loading">tilt-deck</abbr> or crane, place on your piers or slab, and walk through final checks. You arrive at a locked, weather-tight cabin ready for bedding and gear.
        </>
      ),
      image: "/images/process-4-delivery.png",
      imageAlt: "Cabin being delivered on flatbed truck",
      badgeClass: "bg-sky-600",
    },
  ];

export default function ProcessPage() {
  return (
    <main className="pt-24">
      <section className="relative overflow-hidden bg-slate-950 text-slate-50">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/images/process-hero-yard.svg"
            alt="Container cabin ready for delivery in a timber yard"
            fill
            priority
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/85 to-slate-950" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-6 py-14 md:py-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">Build process</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Four phases from sketch to hunt-ready cabin</h1>
          <p className="max-w-3xl text-base leading-relaxed text-slate-200 md:text-lg md:leading-relaxed">
            We turn a standard steel shell into a locked, insulated cabin in a clear, repeatable sequence. You handle the land and pad; we handle drawings, fabrication, and delivery.
          </p>
        </div>
      </section>

      <section className="bg-[#f5efe2]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          {/* Mobile accordion */}
          <div className="space-y-4 md:hidden">
            {STEPS.map((s, i) => (
              <ProcessAccordionItem
                key={s.step}
                step={s.step}
                title={s.title}
                description={s.description}
                image={s.image}
                imageAlt={s.imageAlt}
                badgeClass={s.badgeClass}
                defaultOpen={i === 0}
              />
            ))}
          </div>

          {/* Desktop cards */}
          <div className="hidden gap-8 md:grid md:grid-cols-2">
            {STEPS.map((s) => (
              <ProcessCard
                key={s.step}
                step={s.step}
                title={s.title}
                description={s.description}
                image={s.image}
                imageAlt={s.imageAlt}
                badgeClass={s.badgeClass}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800/40 bg-slate-950 text-slate-50">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-14 md:flex-row md:items-center md:justify-between md:py-16">
          <div>
            <h2 className="text-xl font-semibold">Ready to put a steel cabin on your land?</h2>
            <p className="mt-1 text-sm text-slate-300">
              Share your site and timeline. We&apos;ll respond with a clear budget range and next steps—no call center, just the build team.
            </p>
          </div>
          <a
            href="/quote"
            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            Start your build plan
          </a>
        </div>
      </section>
    </main>
  );
}

function ProcessCard({
  step,
  title,
  description,
  image,
  imageAlt,
  badgeClass,
}: {
  step: string;
  title: string;
  description: ReactNode;
  image: string;
  imageAlt: string;
  badgeClass?: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-900/5 transition-shadow hover:shadow-md">
      <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${badgeClass ?? "bg-emerald-600"}`}>
        {step}
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-700">{description}</p>
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-slate-900/5">
          <Image src={image} alt={imageAlt} fill className="object-cover" />
        </div>
      </div>
    </div>
  );
}

function ProcessAccordionItem({
  step,
  title,
  description,
  image,
  imageAlt,
  badgeClass,
  defaultOpen,
}: {
  step: string;
  title: string;
  description: ReactNode;
  image: string;
  imageAlt: string;
  badgeClass?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="rounded-2xl bg-white/80 p-4 ring-1 ring-slate-900/5">
      <summary className="flex cursor-pointer items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${badgeClass ?? "bg-emerald-600"}`}>{step}</span>
        <span className="text-base font-semibold text-slate-900">{title}</span>
      </summary>
      <div className="mt-3 space-y-3 pl-11">
        <p className="text-sm text-slate-700">{description}</p>
        <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-slate-900/5">
          <Image src={image} alt={imageAlt} fill className="object-cover" />
        </div>
      </div>
    </details>
  );
}
