"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ModelImage } from "@prisma/client";

export type GalleryProps = {
  images: ModelImage[];
  className?: string;
};

export function Gallery({ images, className }: GalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeId, setActiveId] = useState(sortedImages[0]?.id);
  const activeImage = sortedImages.find((image) => image.id === activeId) ?? sortedImages[0];

  if (!activeImage) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-surface-muted/60 bg-surface-muted/30">
        <Image src={activeImage.url} alt={activeImage.alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" priority />
      </div>
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {sortedImages.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveId(image.id)}
              className={cn(
                "relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border",
                activeId === image.id
                  ? "border-forest shadow-[0_0_0_2px_rgba(49,76,58,0.4)]"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
