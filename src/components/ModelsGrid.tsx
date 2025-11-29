import { SectionTitle } from "@/components/ui/SectionTitle";
import { ModelCard } from "@/components/ModelCard";
import type { ModelSummary } from "@/types/model";

export function ModelsGrid({ models }: { models: ModelSummary[] }) {
  return (
    <section className="space-y-10">
      <SectionTitle
        eyebrow="Model Lineup"
        title="Standard container cabin packages"
        subtitle="Each model starts with a reinforced 40' high-cube shell, fabricated steel vestibule, insulated interior, and systems rough-in. Customize finishes, bunks, and off-grid kit to match your hunt camp."
      />
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => (
          <ModelCard key={model.slug} model={model} />
        ))}
      </div>
    </section>
  );
}
