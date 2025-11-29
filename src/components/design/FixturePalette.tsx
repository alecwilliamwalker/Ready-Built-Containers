"use client";

import { useMemo, useRef, useState } from "react";
import type { ModuleCatalogItem } from "@/types/design";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const DRAG_MIME = "application/x-readybuilt-fixture";

export type FixturePaletteProps = {
  catalog: Record<string, ModuleCatalogItem>;
  onAddFixture: (item: ModuleCatalogItem) => void;
};

export function FixturePalette({ catalog, onAddFixture }: FixturePaletteProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const dragPreviewRef = useRef<HTMLDivElement | null>(null);

  const categorized = useMemo(() => {
    return Object.values(catalog).reduce<Record<string, ModuleCatalogItem[]>>(
      (acc, item) => {
        const key = item.category ?? "misc";
        acc[key] = acc[key] ? [...acc[key], item] : [item];
        return acc;
      },
      {}
    );
  }, [catalog]);

  const categories = useMemo(
    () => ["all", ...Object.keys(categorized)],
    [categorized]
  );

  const filteredItems = useMemo(() => {
    const pool =
      activeCategory === "all"
        ? Object.values(catalog)
        : categorized[activeCategory] ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return pool;
    return pool.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.key.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [catalog, categorized, activeCategory, search]);

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
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
      "rounded-full border border-white/50 bg-forest px-3 py-1 text-xs font-semibold text-white shadow-xl";
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
    <div className="space-y-4">
      <div className="rounded-2xl border border-surface-muted/60 bg-white/90 p-3 shadow-md">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search fixtures..."
          className="h-9 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          {categories.map((category) => {
            const label =
              category === "all"
                ? "All"
                : category
                    .replace("fixture-", "")
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (letter) => letter.toUpperCase());
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3 py-1 ${
                  isActive
                    ? "bg-forest text-white"
                    : "bg-surface text-foreground/70"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
        {filteredItems.length === 0 ? (
          <p className="text-xs text-foreground/60">No fixtures match this filter.</p>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.key}
              draggable
              onDragStart={(event) => handleDragStart(event, item)}
              onDragEnd={handleDragEnd}
              className="group rounded-2xl border border-white/40 bg-white/90 p-4 shadow hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-foreground/60">
                    {item.footprintFt.length}' × {item.footprintFt.width}'
                  </p>
                </div>
                <span className="rounded-full bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/60">
                  {item.category.replace("fixture-", "").slice(0, 10)}
                </span>
              </div>
              {item.requiresUtilities && item.requiresUtilities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.requiresUtilities.map((util) => (
                    <span
                      key={util}
                      className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-forest"
                    >
                      {util}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={() => onAddFixture(item)}
                >
                  Insert
                </Button>
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/50">
                  Drag
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

