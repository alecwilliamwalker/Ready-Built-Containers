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
import { leadSchema, TIMELINE_OPTIONS, type LeadInput } from "@/lib/validation";

export type LeadCaptureFormProps = {
  source: string;
  models?: Array<{ slug: string; name: string }>;
  defaultModelSlug?: string;
  redirectTo?: string;
  className?: string;
};

export function LeadCaptureForm({
  source,
  models = [],
  defaultModelSlug,
  redirectTo = "/thank-you?type=lead",
  className,
}: LeadCaptureFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      state: "",
      zip: "",
      modelSlug: defaultModelSlug ?? "",
      timeline: "",
      source,
      message: "",
    },
  });

  async function onSubmit(data: LeadInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, modelSlug: data.modelSlug || undefined, timeline: data.timeline || undefined }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to submit lead right now");
      }

      showToast({
        variant: "success",
        title: "Thanks for reaching out",
        description: "We will send pricing and availability shortly.",
      });

      form.reset({ ...form.getValues(), message: "" });
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
      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="lead-name">
            Name
          </label>
          <Input id="lead-name" placeholder="Your name" {...register("name")} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="lead-email">
            Email
          </label>
          <Input id="lead-email" type="email" placeholder="you@email.com" {...register("email")} aria-invalid={Boolean(errors.email)} />
          {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email.message}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="lead-phone">
              Phone (optional)
            </label>
            <Input id="lead-phone" placeholder="###-###-####" {...register("phone")} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="lead-state">
              State (optional)
            </label>
            <Input id="lead-state" placeholder="MT" maxLength={2} {...register("state")} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="lead-zip">
              ZIP (optional)
            </label>
            <Input id="lead-zip" placeholder="59601" maxLength={10} {...register("zip")} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="lead-model">
              Interested model (optional)
            </label>
            <Select id="lead-model" {...register("modelSlug")}>
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.slug} value={model.slug}>
                  {model.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="lead-timeline">
            Timeline (optional)
          </label>
          <Select id="lead-timeline" {...register("timeline")}>
            <option value="">Select timeline</option>
            {TIMELINE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("mo", " months")}
              </option>
            ))}
          </Select>
          {errors.timeline && <p className="mt-1 text-xs font-medium text-red-600">{errors.timeline.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="lead-message">
            What problem will this cabin solve for you?
          </label>
          <Textarea id="lead-message" placeholder="Describe your site, access road, or must-haves" {...register("message")} />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full md:w-auto">
        {isSubmitting ? "Submitting..." : "Get Pricing & Availability"}
      </Button>
    </form>
  );
}
