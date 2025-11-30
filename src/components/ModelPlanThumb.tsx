import Image from "next/image";

type PlanKey = "standard" | "deluxe" | "default";

const PLAN_CONFIG: Record<PlanKey, { src: string; alt: string; caption: string }> = {
  standard: {
    src: "/images/floorplans/standard-plan.svg",
    alt: "Standard schematic plan with vestibule, living kitchen, hall bath, and four-bunk room",
    caption: "Standard – Flagship 40' layout (schematic plan).",
  },
  deluxe: {
    src: "/images/floorplans/deluxe-plan.svg",
    alt: "Deluxe schematic plan highlighting gear vestibule, extended galley, full bath, and six bunks",
    caption: "Deluxe – Gear vestibule, full galley, 6-bunk bay (schematic plan).",
  },
  default: {
    src: "/images/floorplans/standard-plan.svg",
    alt: "Container cabin schematic plan",
    caption: "Standard container cabin schematic plan.",
  },
};

function resolvePlan(slug?: string): PlanKey {
  if (!slug) return "default";
  if (slug.includes("deluxe")) return "deluxe";
  if (slug.includes("standard")) return "standard";
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

