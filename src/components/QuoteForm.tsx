"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import {
  quoteRequestSchema,
  TIMELINE_OPTIONS,
  POWER_OPTIONS,
  WATER_OPTIONS,
  SEPTIC_OPTIONS,
  type QuoteRequestInput,
} from "@/lib/validation";

export type QuoteFormProps = {
  models?: Array<{ slug: string; name: string }>;
  defaultModelSlug?: string;
  redirectTo?: string;
  className?: string;
};

const timelineLabels: Record<string, string> = {
  "0-3mo": "0-3 months",
  "3-6mo": "3-6 months",
  "6-12mo": "6-12 months",
  "Just researching": "Just researching",
};

export function QuoteForm({
  models = [],
  defaultModelSlug,
  redirectTo = "/thank-you?type=quote",
  className,
}: QuoteFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuoteRequestInput>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      modelSlug: defaultModelSlug ?? "",
      landState: "",
      landZip: "",
      landDescription: "",
      powerPreference: "",
      waterPreference: "",
      septicSituation: "",
      timeline: "",
      budgetRange: "",
      message: "",
    },
  });

  async function onSubmit(data: QuoteRequestInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          modelSlug: data.modelSlug || undefined,
          landState: data.landState || undefined,
          landZip: data.landZip || undefined,
          landDescription: data.landDescription || undefined,
          powerPreference: data.powerPreference || undefined,
          waterPreference: data.waterPreference || undefined,
          septicSituation: data.septicSituation || undefined,
          timeline: data.timeline || undefined,
          budgetRange: data.budgetRange || undefined,
          message: data.message || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to submit quote request right now");
      }

      showToast({
        variant: "success",
        title: "Quote request received",
        description: "Our team will review your site details and reach out within one business day.",
      });
      router.push(redirectTo);
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Submission failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="grid gap-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" htmlFor="quote-name" error={errors.name?.message}>
            <Input id="quote-name" placeholder="Your name" {...register("name")} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Email" htmlFor="quote-email" error={errors.email?.message}>
            <Input id="quote-email" type="email" placeholder="you@email.com" {...register("email")} aria-invalid={Boolean(errors.email)} />
          </Field>
        </div>
        <Field label="Phone" htmlFor="quote-phone" hint="Helpful when delivery access questions come up" error={errors.phone?.message}>
          <Input id="quote-phone" placeholder="###-###-####" {...register("phone")} />
        </Field>
        <Field label="Which model are you considering?" htmlFor="quote-model">
          <Select id="quote-model" {...register("modelSlug")}> 
            <option value="">Select a model</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Land state" htmlFor="quote-land-state">
            <Input id="quote-land-state" placeholder="MT" maxLength={2} {...register("landState")} />
          </Field>
          <Field label="Land ZIP" htmlFor="quote-land-zip">
            <Input id="quote-land-zip" placeholder="59601" maxLength={10} {...register("landZip")} />
          </Field>
        </div>
        <Field label="Tell us about the build site" htmlFor="quote-land-desc" hint="Access road, slope, trees to clear, existing pads, etc.">
          <Textarea id="quote-land-desc" rows={4} {...register("landDescription")} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Power preference" htmlFor="quote-power">
            <Select id="quote-power" {...register("powerPreference")}>
              <option value="">Select power plan</option>
              {POWER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "grid"
                    ? "Grid"
                    : option === "solar"
                      ? "Solar"
                      : option === "generator"
                        ? "Generator"
                        : "Hybrid"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Water" htmlFor="quote-water" hint="Existing well, hauling, cistern, etc.">
            <Select id="quote-water" {...register("waterPreference")}>
              <option value="">Select water plan</option>
              {WATER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "existing" ? "Existing plumbing" : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Waste / septic" htmlFor="quote-septic">
          <Select id="quote-septic" {...register("septicSituation")}>
            <option value="">Select septic plan</option>
            {SEPTIC_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === "holding"
                  ? "Holding tank"
                  : option === "composting"
                    ? "Composting"
                    : option === "planning"
                      ? "Planning / in permitting"
                      : "Traditional septic"}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Timeline" htmlFor="quote-timeline">
            <Select id="quote-timeline" {...register("timeline")}>
              <option value="">Select timeline</option>
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {timelineLabels[option] ?? option}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Budget range" htmlFor="quote-budget">
            <Select id="quote-budget" {...register("budgetRange")}>
              <option value="">Select a range</option>
              <option value="<100k">Under $100k</option>
              <option value="100-150k">$100k – $150k</option>
              <option value="150-200k">$150k – $200k</option>
              <option value=">200k">$200k +</option>
            </Select>
          </Field>
        </div>
        <Field label="Anything else we should know?" htmlFor="quote-message">
          <Textarea id="quote-message" rows={4} {...register("message")} />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full md:w-auto">
        {isSubmitting ? "Sending..." : "Request a Quote"}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block text-sm">
      <label className="mb-1 block font-medium text-foreground" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-foreground/60">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
