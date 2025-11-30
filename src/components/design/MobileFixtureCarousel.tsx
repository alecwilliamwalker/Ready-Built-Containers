"use client";

import { useMemo, useState } from "react";
import type { ModuleCatalogItem, FixtureCategory } from "@/types/design";
import { FixtureIcon } from "./FixtureIcon";

export type MobileFixtureCarouselProps = {
  catalog: Record<string, ModuleCatalogItem>;
  pendingPlacement?: ModuleCatalogItem | null;
  onSetPendingPlacement?: (item: ModuleCatalogItem | null) => void;
  onClose: () => void;
};

const CATEGORY_LABELS: Record<FixtureCategory, string> = {
  "shell-structure": "Structure",
  "fixture-bath": "Bath",
  "fixture-galley": "Galley",
  "fixture-sleep": "Sleep",
  opening: "Openings",
  storage: "Storage",
  interior: "Interior",
};

const CATEGORY_COLORS: Record<FixtureCategory, string> = {
  "shell-structure": "from-emerald-500 to-green-600",
  "fixture-bath": "from-blue-500 to-cyan-600",
  "fixture-galley": "from-orange-500 to-amber-600",
  "fixture-sleep": "from-purple-500 to-violet-600",
  opening: "from-yellow-500 to-orange-500",
  storage: "from-slate-500 to-gray-600",
  interior: "from-pink-500 to-rose-600",
};

export function MobileFixtureCarousel({
  catalog,
  pendingPlacement,
  onSetPendingPlacement,
  onClose,
}: MobileFixtureCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FixtureCategory | "all">("all");

  const categories = useMemo(() => {
    const cats = new Set<FixtureCategory>();
    Object.values(catalog).forEach((item) => {
      if (!item.hidden) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [catalog]);

  const filteredItems = useMemo(() => {
    const visibleItems = Object.values(catalog).filter((item) => !item.hidden);
    if (activeCategory === "all") return visibleItems;
    return visibleItems.filter((item) => item.category === activeCategory);
  }, [catalog, activeCategory]);

  const handleSelect = (item: ModuleCatalogItem) => {
    // Toggle selection - if already selected, deselect
    if (pendingPlacement?.key === item.key) {
      console.log("[CAROUSEL] Deselecting fixture:", item.key);
      onSetPendingPlacement?.(null);
    } else {
      console.log("[CAROUSEL] Selecting fixture:", item.key);
      onSetPendingPlacement?.(item);
    }
  };

  return (
    <div className="relative z-[60] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 border-b border-slate-700 shadow-2xl">
      {/* Header Row */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Fixtures
        </h3>
        
        {/* Category Pills - Horizontal Scroll */}
        <div className="flex-1 mx-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                activeCategory === "all"
                  ? "bg-white text-slate-900"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
                  activeCategory === cat
                    ? "bg-white text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {CATEGORY_LABELS[cat]?.slice(0, 6) || cat.slice(0, 6)}
              </button>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Fixture Carousel */}
      <div className="px-2 pb-3 pt-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          {filteredItems.map((item) => {
            const isSelected = pendingPlacement?.key === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleSelect(item)}
                className={`flex-shrink-0 w-20 rounded-xl p-2 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-cyan-500 ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-full aspect-square rounded-lg flex items-center justify-center mb-1.5 ${
                    isSelected
                      ? "bg-cyan-600"
                      : `bg-gradient-to-br ${CATEGORY_COLORS[item.category]}`
                  }`}
                >
                  <FixtureIcon category={item.category} fixtureKey={item.key} className="w-8 h-8 text-white" />
                </div>
                
                {/* Label */}
                <div
                  className={`text-[10px] font-semibold leading-tight truncate ${
                    isSelected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {item.label}
                </div>
                
                {/* Dimensions */}
                <div
                  className={`text-[9px] ${
                    isSelected ? "text-cyan-200" : "text-slate-500"
                  }`}
                >
                  {item.footprintFt.length}'×{item.footprintFt.width}'
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selection Indicator */}
      {pendingPlacement && (
        <div className="px-3 pb-2">
          <div className="bg-cyan-500/20 border border-cyan-500/50 rounded-lg px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-cyan-300">
              <span className="font-semibold text-cyan-100">{pendingPlacement.label}</span>
              {" "}selected — tap canvas to place
            </span>
            <button
              onClick={() => onSetPendingPlacement?.(null)}
              className="text-cyan-400 hover:text-cyan-200 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

