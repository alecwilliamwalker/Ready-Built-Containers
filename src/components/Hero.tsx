import { Button } from "@/components/ui/Button";

const FEATURE_STRIP = [
  {
    label: "Secure",
    text: "Locking steel doors + inner man door",
  },
  {
    label: "Off-grid ready",
    text: "Solar, generator, or hybrid",
  },
  {
    label: "Sleeps 4+",
    text: "Engineered bunk layouts",
  },
  {
    label: "Delivered anywhere",
    text: "Any site a truck can reach",
  },
];

export function Hero() {
  return (
    <section className="relative min-h-[70vh] overflow-hidden pt-24 pb-16 text-slate-50">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="hero-forest-pan h-full w-[110%] bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/hero-main.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/40 to-slate-950/75" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 md:flex-row md:items-center md:px-6">
        <div className="max-w-xl space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Rugged steel cabins</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Container cabins built to disappear into the timber.
          </h1>
          <p className="text-sm text-slate-200/90">
            High-cube ISO shells with insulated interiors, locking vestibules, and off-grid systems—engineered for hunters, outfitters, and remote landowners.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              href="/quote"
              variant="accent"
              className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-400"
            >
              Get Pricing &amp; Availability
            </Button>
            <Button
              href="/models"
              variant="ghost"
              className="rounded-full border border-slate-400/60 px-5 py-2 text-xs font-semibold text-slate-50 hover:border-emerald-400 hover:text-emerald-300"
            >
              View Floor Plans
            </Button>
          </div>
        </div>

        <div className="max-w-sm space-y-3 rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 backdrop-blur-md">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-400">Flagship layout</p>
          <h2 className="text-lg font-semibold">Walk through the Standard</h2>
          <p className="text-[11px] text-slate-200">
            <strong>Living + Kitchen:</strong> 16&apos; lounge with L-shape galley &amp; window.
            <br />
            <strong>Center Hall:</strong> Mud zone and full bath.
            <br />
            <strong>Bunk Room:</strong> Four stacked bunks, lockable firearms cabinet, egress window.
          </p>
          <Button
            href="/models/standard"
            variant="accent"
            className="inline-flex rounded-full bg-emerald-500/95 px-4 py-1.5 text-[10px] font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Explore Standard
          </Button>
        </div>
      </div>

      <div className="relative mt-10">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-3 rounded-full border border-slate-700/70 bg-slate-900/90 px-5 py-3 text-[10px] text-slate-200 backdrop-blur">
          {FEATURE_STRIP.map((feature) => (
            <div key={feature.label} className="flex-1 min-w-[140px]">
              <span className="font-semibold">{feature.label}</span>
              <span className="mx-1 text-slate-500">•</span>
              {feature.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
