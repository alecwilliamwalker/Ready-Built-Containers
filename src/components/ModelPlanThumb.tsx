import Image from "next/image";

type PlanKey = "basecamp20" | "basecamp40" | "outfitter40" | "default";

const PLAN_CONFIG: Record<PlanKey, { src: string; alt: string; caption: string }> = {
  basecamp20: {
    src: "/images/floorplans/basecamp-20-plan.svg",
    alt: "Basecamp 20 schematic plan showing vestibule, living galley, optional bath bay, and bunk zone",
    caption: "Basecamp 20 – Compact 20' layout (schematic plan).",
  },
  basecamp40: {
    src: "/images/floorplans/basecamp-40-plan.svg",
    alt: "Basecamp 40 schematic plan with vestibule, living kitchen, hall bath, and four-bunk room",
    caption: "Basecamp 40 – Flagship 40' layout (schematic plan).",
  },
  outfitter40: {
    src: "/images/floorplans/outfitter-40-plus-plan.svg",
    alt: "Outfitter 40 Plus schematic plan highlighting gear vestibule, extended galley, full bath, and six bunks",
    caption: "Outfitter 40 Plus – Gear vestibule, full galley, 6-bunk bay (schematic plan).",
  },
  default: {
    src: "/images/floorplans/basecamp-40-plan.svg",
    alt: "Container cabin schematic plan",
    caption: "Standard container cabin schematic plan.",
  },
};

function resolvePlan(slug?: string): PlanKey {
  if (!slug) return "default";
  if (slug.includes("20")) return "basecamp20";
  if (slug.includes("outfitter")) return "outfitter40";
  if (slug.includes("40")) return "basecamp40";
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
        <span>Living / Kitchen</span>
        <span>Bath</span>
        <span>Bunks</span>
      </div>
    </div>
  );
}

