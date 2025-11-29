"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Floorplan } from "@prisma/client";

export function FloorplanSelector({ floorplans }: { floorplans: Floorplan[] }) {
  const sorted = [...floorplans].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((plan) => plan.id === activeId) ?? sorted[0];

  if (!active) return null;

  return (
    <div className="space-y-4">
      <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-surface-muted/60 bg-white">
        <Image src={active.imageUrl} alt={active.name} fill className="object-contain p-6" />
      </div>
      <p className="text-xs font-semibold tracking-wide text-foreground/60">
        Not for construction – schematic layout
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {sorted.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setActiveId(plan.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left text-sm transition",
              activeId === plan.id
                ? "border-forest bg-forest/5 text-forest shadow-[0_0_0_2px_rgba(49,76,58,0.25)]"
                : "border-surface-muted/60 hover:border-forest/40",
            )}
          >
            <p className="font-semibold">{plan.name}</p>
            {plan.description && <p className="mt-1 text-foreground/70">{plan.description}</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
