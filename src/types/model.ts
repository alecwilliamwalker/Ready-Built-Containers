import type { Floorplan, Model, ModelImage } from "@prisma/client";

export type ModelWithRelations = Model & {
  images: ModelImage[];
  floorplans: Floorplan[];
};

export type ModelSummary = Pick<Model, "slug" | "name" | "sleeps" | "lengthFt" | "basePrice" | "hasBathroom" | "hasKitchen" | "tagline"> & {
  images?: ModelImage[];
};
