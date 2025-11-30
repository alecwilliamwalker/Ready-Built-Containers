"use client";

import { useMemo, useRef, useState } from "react";
import type { ModuleCatalogItem, FixtureCategory } from "@/types/design";
import { Input } from "@/components/ui/Input";
import { formatCurrencyCents } from "@/lib/format";
import { FixtureIcon } from "./FixtureIcon";

const DRAG_MIME = "application/x-readybuilt-fixture";

export type FixtureLibraryProps = {
  catalog: Record<string, ModuleCatalogItem>;
  onAddFixture: (item: ModuleCatalogItem) => void;
  pendingPlacement?: ModuleCatalogItem | null;
  onSetPendingPlacement?: (item: ModuleCatalogItem | null) => void;
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
  "shell-structure": "bg-green-500",
  "fixture-bath": "bg-blue-500",
  "fixture-galley": "bg-orange-500",
  "fixture-sleep": "bg-purple-500",
  opening: "bg-yellow-500",
  storage: "bg-gray-500",
  interior: "bg-pink-500",
};

export function FixtureLibrary({ 
  catalog, 
  onAddFixture,
  pendingPlacement,
  onSetPendingPlacement,
}: FixtureLibraryProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<FixtureCategory | "all">("all");
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    const cats = new Set<FixtureCategory>();
    Object.values(catalog).forEach((item) => {
      cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [catalog]);

  const filteredItems = useMemo(() => {
    // Filter out hidden items (like walls which are drawn, not placed)
    const visibleItems = Object.values(catalog).filter((item) => !item.hidden);
    
    const pool =
      activeCategory === "all"
        ? visibleItems
        : visibleItems.filter((item) => item.category === activeCategory);

    const query = search.trim().toLowerCase();
    if (!query) return pool;

    return pool.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [catalog, activeCategory, search]);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    item: ModuleCatalogItem
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      DRAG_MIME,
      JSON.stringify({ catalogKey: item.key })
    );

    const preview = document.createElement("div");
    preview.textContent = item.label;
    preview.className =
      "rounded-lg border-2 border-forest bg-white px-4 py-2 text-sm font-semibold text-forest shadow-xl";
    preview.style.position = "absolute";
    preview.style.top = "-999px";
    preview.style.left = "-999px";
    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(preview, 0, 0);
    dragPreviewRef.current = preview;
  };

  const handleDragEnd = () => {
    if (dragPreviewRef.current) {
      document.body.removeChild(dragPreviewRef.current);
      dragPreviewRef.current = null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="mb-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search fixtures..."
          className="h-9 text-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            activeCategory === "all"
              ? "bg-forest text-white"
              : "bg-surface text-foreground hover:bg-forest/10"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              activeCategory === category
                ? "bg-forest text-white"
                : "bg-surface text-foreground hover:bg-forest/10"
            }`}
          >
            {CATEGORY_LABELS[category] || category}
          </button>
        ))}
      </div>

      {/* Fixture Grid */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground/60">
            No fixtures match your search.
          </p>
        ) : (
          filteredItems.map((item) => {
            const isSelected = pendingPlacement?.key === item.key;
            return (
              <div
                key={item.key}
                draggable
                onDragStart={(event) => handleDragStart(event, item)}
                onDragEnd={handleDragEnd}
                className={`group cursor-move rounded-xl border p-3 shadow-sm transition-all hover:shadow-md ${
                  isSelected 
                    ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/30" 
                    : "border-surface-muted/60 bg-white hover:border-forest"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? "bg-cyan-500" : CATEGORY_COLORS[item.category]
                    } text-white`}
                  >
                    <FixtureIcon category={item.category} fixtureKey={item.key} className="h-8 w-8" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h4 className={`truncate text-sm font-semibold ${
                      isSelected ? "text-cyan-700" : "text-foreground group-hover:text-forest"
                    }`}>
                      {item.label}
                    </h4>
                    <p className="text-xs text-foreground/60">
                      {item.footprintFt.length}' × {item.footprintFt.width}'
                    </p>
                    {item.requiresUtilities && item.requiresUtilities.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.requiresUtilities.map((util) => (
                          <span
                            key={util}
                            className="rounded bg-forest/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-forest"
                          >
                            {util}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs font-semibold text-foreground">
                      {formatCurrencyCents(item.priceRule.baseCents)}
                    </div>
                  </div>
                </div>

                {/* Place Button - toggle placement mode */}
                <button
                  onClick={() => onSetPendingPlacement?.(item)}
                  className={`mt-2 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : "bg-forest/10 text-forest hover:bg-forest hover:text-white"
                  }`}
                >
                  {isSelected ? "Click to Place (Esc to cancel)" : "Place"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

