"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrencyCents } from "@/lib/format";

type ModelSummary = {
  slug: string;
  name: string;
  lengthFt: number;
  sleeps: number;
  basePrice: number;
};

type FloorplanSummary = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  model: {
    slug: string;
    name: string;
  };
};

type PlansGalleryProps = {
  models: ModelSummary[];
  floorplans: FloorplanSummary[];
  initialModel: string;
};

export function PlansGallery({ models, floorplans, initialModel }: PlansGalleryProps) {
  const [activeModelSlug, setActiveModelSlug] = useState(initialModel || models[0]?.slug || "standard");
  const [activePlanId, setActivePlanId] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const modelPlans = useMemo(() =>
    floorplans.filter(p => p.model.slug === activeModelSlug),
    [activeModelSlug, floorplans]
  );
  const activePlan = modelPlans.find(p => p.id === activePlanId) || modelPlans[0];

  useEffect(() => {
    const modelPlansIds = modelPlans.map(p => p.id);
    if (modelPlansIds.length > 0 && !modelPlansIds.includes(activePlanId)) {
      setActivePlanId(modelPlansIds[0]);
    }
  }, [modelPlans, activePlanId]);

  const handleModelSelect = (slug: string) => {
    setActiveModelSlug(slug);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("model", slug);
      router.replace(`${pathname}?${params}`, { scroll: false });
    });
  };

  const handlePlanSelect = (id: string) => setActivePlanId(id);

  return (
    <div className="space-y-12">
      {/* Model Selector Tabs */}
      <div className="flex flex-wrap gap-2 -m-1">
        <button
          onClick={() => handleModelSelect("all")}
          className={cn(
            "m-1 px-6 py-3 rounded-full font-semibold transition-all duration-200 border focus-visible:ring-2 focus-visible:ring-forest ring-offset-2",
            activeModelSlug === "all"
              ? "bg-forest text-white shadow-lg border-forest"
              : "border-muted bg-surface hover:bg-forest/10 hover:border-forest/50"
          )}
        >
          All Plans
        </button>
        {models.map((model) => (
          <button
            key={model.slug}
            onClick={() => handleModelSelect(model.slug)}
            className={cn(
              "m-1 px-6 py-3 rounded-full font-semibold transition-all duration-200 border focus-visible:ring-2 focus-visible:ring-forest ring-offset-2",
              activeModelSlug === model.slug
                ? "bg-forest text-white shadow-lg border-forest"
                : "border-muted bg-surface hover:bg-forest/10 hover:border-forest/50"
            )}
          >
            {model.name}
          </button>
        ))}
      </div>

      {/* Hero Gallery: Large SVG + Plan Thumbs */}
      <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        {/* Hero SVG */}
        <div className="relative aspect-[3/1] w-full overflow-hidden rounded-3xl border border-muted shadow-2xl bg-gradient-to-br from-slate-50 to-white">
          {activePlan && (
            <Image
              src={activePlan.imageUrl}
              alt={`${activePlan.model.name} - ${activePlan.name} floorplan`}
              fill
              className="object-contain p-8 md:p-12"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
          )}
        </div>

        {/* Plan Thumbs (scrollable if many) */}
        {modelPlans.length > 1 && (
          <div className="space-y-4 lg:max-h-[400px] lg:overflow-y-auto">
            {modelPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all duration-200 hover:shadow-md hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-forest ring-offset-2",
                  activePlanId === plan.id
                    ? "border-forest bg-forest/10 shadow-lg ring-2 ring-forest/30"
                    : "border-muted bg-surface hover:border-forest/50"
                )}
              >
                <h4 className="font-bold text-foreground">{plan.name}</h4>
                {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Comparison Table */}
      <section className="overflow-x-auto rounded-3xl border border-muted/50 bg-surface shadow-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-muted/50">
              <th className="py-4 px-6 text-left font-semibold text-foreground">Model</th>
              <th className="py-4 px-6 text-left font-semibold text-foreground">Length</th>
              <th className="py-4 px-6 text-left font-semibold text-foreground">Sleeps</th>
              <th className="py-4 px-6 text-left font-semibold text-foreground">Key Zones</th>
              <th className="py-4 px-6 text-left font-semibold text-foreground">Starts At</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const planDesc = floorplans.find(p => p.model.slug === model.slug)?.description || "";
              const zones = planDesc.includes("Gear area") ? "Gear Area 4'/Galley 16'/Bath 6'/Bunks 14'" :
                planDesc.includes("Vestibule") ? "Vest 3'/Living 17'/Bath 7'/Bunks 13'" :
                  "Living 12'/Bath 4'/Bunks 4'";
              return (
                <tr
                  key={model.slug}
                  className={cn(
                    "border-b border-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
                    activeModelSlug === model.slug && "bg-forest/5 border-forest/30"
                  )}
                  onClick={() => handleModelSelect(model.slug)}
                >
                  <td className="py-4 px-6 font-semibold">{model.name}</td>
                  <td className="py-4 px-6">{model.lengthFt}'</td>
                  <td className="py-4 px-6 font-medium">{model.sleeps}</td>
                  <td className="py-4 px-6 text-sm max-w-md">{zones}</td>
                  <td className="py-4 px-6 font-mono text-lg font-semibold">{formatCurrencyCents(model.basePrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}


