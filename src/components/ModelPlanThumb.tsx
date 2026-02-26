import Image from "next/image";

type PlanKey = "hc40" | "hc20" | "default";

const PLAN_CONFIG: Record<PlanKey, { src: string; alt: string; caption: string }> = {
  hc40: {
    src: "/images/floorplans/hc40-plan.svg",
    alt: "40' High Cube floor plan with vestibule, kitchen, living, hall bath, and bunk room",
    caption: "40' High Cube – Full off-grid cabin (floor plan).",
  },
  hc20: {
    src: "/images/floorplans/hc20-plan.svg",
    alt: "20' High Cube floor plan with vestibule, galley, and sleeping area",
    caption: "20' High Cube – Compact off-grid basecamp (floor plan).",
  },
  default: {
    src: "/images/floorplans/hc40-plan.svg",
    alt: "High cube container cabin floor plan",
    caption: "High cube container cabin floor plan.",
  },
};

function resolvePlan(slug?: string): PlanKey {
  if (!slug) return "default";
  if (slug.includes("hc40")) return "hc40";
  if (slug.includes("hc20")) return "hc20";
  return "default";
}

export function ModelPlanThumb({ slug }: { slug?: string }) {
  const plan = PLAN_CONFIG[resolvePlan(slug)];

  return (
    <div className="w-full rounded-xl bg-slate-950/85 p-4 shadow-[0_12px_35px_-30px_rgba(12,20,31,0.9)]">
      <div className="relative w-full overflow-hidden rounded-lg border border-slate-800/70 bg-slate-900 shadow-inner aspect-[24/11]">
        <Image
          src={plan.src}
          alt={plan.alt}
          fill
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 320px"
          priority={false}
        />
      </div>
      <p className="mt-3 text-xs font-semibold tracking-wide text-slate-200">{plan.caption}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] uppercase tracking-[0.24em] text-slate-500">
        <span>Entry</span>
        <span>Living / Galley</span>
        <span>{slug?.includes("hc40") ? "Bath / Bunks" : "Sleep"}</span>
      </div>
    </div>
  );
}

