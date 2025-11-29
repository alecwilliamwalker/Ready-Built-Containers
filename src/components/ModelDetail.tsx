import { Gallery } from "@/components/Gallery";
import { FloorplanSelector } from "@/components/FloorplanSelector";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatCurrencyCents } from "@/lib/format";
import type { ModelWithRelations } from "@/types/model";
import Image from "next/image";

export function ModelDetail({ model }: { model: ModelWithRelations }) {
  return (
    <section className="space-y-16">
      <div className="grid gap-10 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-6">
          <SectionTitle eyebrow="Container Cabin" title={model.name} subtitle={model.tagline ?? undefined} />
          <p className="text-lg text-foreground/80">{model.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-foreground/70">
            <span className="rounded-full bg-surface px-4 py-2">Length: {model.lengthFt}&apos;</span>
            <span className="rounded-full bg-surface px-4 py-2">Sleeps {model.sleeps} adults</span>
            <span className="rounded-full bg-surface px-4 py-2">{model.hasBathroom ? "Full bathroom" : "Dry cabin (no plumbing)"}</span>
            <span className="rounded-full bg-surface px-4 py-2">{model.hasKitchen ? "Full galley" : "Prep kitchen"}</span>
          </div>
          <div className="rounded-xl border border-surface-muted/60 bg-surface p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">Starting at</p>
            <p className="text-3xl font-semibold text-foreground">{formatCurrencyCents(model.basePrice)}</p>
            <p className="mt-2 text-sm text-foreground/70">
              Includes fabrication, insulation, electrical rough-in, plumbing rough-in, architectural drawings, and delivery within 300 miles of Audubon, IA. Finish selections and power packages priced separately.
            </p>
          </div>
        </div>
        <div className="flex flex-col min-h-[500px] max-h-[70vh] space-y-4 overflow-y-auto rounded-2xl shadow-2xl border border-surface-muted/60 p-4">
          <Gallery images={model.images ?? []} />
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-[3fr,2fr]">
        <div className="space-y-6">
          <SectionTitle eyebrow="Specifications" title="Engineered for four-season performance" />
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <Spec label="Structure" value="Reinforced high-cube shipping container, powder-coated vestibule frame" />
            <Spec label="Shell" value="Closed-cell spray foam (R-28 walls / R-38 ceiling), thermal break flooring" />
            <Spec label="Doors" value="Locking container doors + insulated steel man door, tamper-resistant hardware" />
            <Spec label="Windows" value="Low-e dual-pane units with storm shutters on primary exposures" />
            <Spec label="Systems" value="120/240V service, propane stub, PEX manifold plumbing, heat recovery ventilator" />
            <Spec label="Off-grid" value="Pre-wire for solar/battery, generator transfer switch, optional composting toilet" />
          </dl>
        </div>
        {/* 
        <div className="space-y-6">
          <SectionTitle eyebrow="Floorplans" title="Fine-tune the layout" />
          <FloorplanSelector floorplans={model.floorplans} />
        </div>
        */}
      </div>
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-surface-muted/60 bg-white px-5 py-4">
      <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
