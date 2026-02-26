import { SectionTitle } from "@/components/ui/SectionTitle";
import { ModelCard } from "@/components/ModelCard";
import type { ModelSummary } from "@/types/model";

export function ModelsGrid({ models }: { models: ModelSummary[] }) {
  return (
    <section className="space-y-10">
      <SectionTitle
        eyebrow="Model Lineup"
        title="Standard container cabin packages"
        subtitle="Choose between our 20' standard or 40' high-cube shell, each with fabricated steel vestibule, insulated interior, and systems rough-in. Customize finishes and bunks to match your hunt camp."
      />
      <div className="grid gap-8">
        {models.map((model) => (
          <ModelCard key={model.slug} model={model} />
        ))}
      </div>
    </section>
  );
}
