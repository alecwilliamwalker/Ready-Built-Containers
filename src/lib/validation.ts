import { z } from "zod";

export const TIMELINE_OPTIONS = [
  "0-3mo",
  "3-6mo",
  "6-12mo",
  "Just researching",
] as const;

export const POWER_OPTIONS = ["grid", "solar", "generator", "hybrid"] as const;
export const WATER_OPTIONS = ["well", "cistern", "haul-in", "existing"] as const;
export const SEPTIC_OPTIONS = ["septic", "holding", "composting", "planning"] as const;

const optionalTrimmedString = z
  .string()
  .transform((value) => value.trim())
  .optional()
  .transform((value) => (value === "" ? undefined : value));

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: optionalTrimmedString,
  state: optionalTrimmedString,
  zip: optionalTrimmedString,
  modelSlug: optionalTrimmedString,
  timeline: optionalTrimmedString.refine(
    (value) => !value || TIMELINE_OPTIONS.includes(value as (typeof TIMELINE_OPTIONS)[number]),
    "Select a timeline",
  ),
  source: z.string().min(1),
  message: optionalTrimmedString,
});

export const quoteRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: optionalTrimmedString,
  modelSlug: optionalTrimmedString,
  landState: optionalTrimmedString,
  landZip: optionalTrimmedString,
  landDescription: optionalTrimmedString,
  powerPreference: optionalTrimmedString,
  waterPreference: optionalTrimmedString,
  septicSituation: optionalTrimmedString,
  timeline: optionalTrimmedString,
  budgetRange: optionalTrimmedString,
  message: optionalTrimmedString,
});

export const consultationRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: optionalTrimmedString,
  preferredModel: optionalTrimmedString,
  preferredDate: optionalTrimmedString,
  timeZone: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export const reservationSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email"),
    phone: optionalTrimmedString,
    modelSlug: optionalTrimmedString,
    confirmTerms: z.boolean().refine((value) => value, "You must confirm the reservation terms"),
  })
  .transform((data) => ({
    ...data,
    modelSlug: data.modelSlug ?? null,
  }));

export const adminLoginSchema = z.object({
  email: z.string().email("Email is required"),
  password: z.string().min(8, "Password is required"),
});

export const userRegisterSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
  name: z.string().min(2, "Name is required"),
  phone: optionalTrimmedString,
  state: optionalTrimmedString,
  zip: optionalTrimmedString,
  timeline: optionalTrimmedString.refine(
    (value) => !value || TIMELINE_OPTIONS.includes(value as (typeof TIMELINE_OPTIONS)[number]),
    "Select a timeline",
  ),
});

export const userLoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password is required"),
});

export const designSaveSchema = z.object({
  name: z.string().min(2, "Name is required"),
  shellLengthFt: z.coerce.number().int().min(10).max(60).optional(),
  config: z.unknown().optional(),
  configJson: z.unknown().optional(), // New format: DesignConfig
  bomSelectionsJson: z.unknown().optional(), // BOM material selections
  priceCents: z.coerce.number().int().min(0),
  previewImageUrl: optionalTrimmedString,
});

export const designUpdateSchema = designSaveSchema.partial();

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type DesignSaveInput = z.infer<typeof designSaveSchema>;
export type DesignUpdateInput = z.infer<typeof designUpdateSchema>;

export type LeadInput = z.infer<typeof leadSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type ConsultationRequestInput = z.infer<typeof consultationRequestSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
