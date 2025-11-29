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
import { consultationRequestSchema, type ConsultationRequestInput } from "@/lib/validation";

export type ConsultationFormProps = {
  models?: Array<{ slug: string; name: string }>;
  defaultModelSlug?: string;
  redirectTo?: string;
  className?: string;
};

export function ConsultationForm({
  models = [],
  defaultModelSlug,
  redirectTo = "/thank-you?type=consultation",
  className,
}: ConsultationFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConsultationRequestInput>({
    resolver: zodResolver(consultationRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      preferredModel: defaultModelSlug ?? "",
      preferredDate: "",
      timeZone: "",
      notes: "",
    },
  });

  async function onSubmit(data: ConsultationRequestInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          preferredModel: data.preferredModel || undefined,
          preferredDate: data.preferredDate || undefined,
          timeZone: data.timeZone || undefined,
          phone: data.phone || undefined,
          notes: data.notes || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to schedule consultation right now");
      }

      showToast({
        variant: "success",
        title: "Consultation requested",
        description: "We will confirm a meeting time shortly.",
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
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Your name" {...register("name")} aria-invalid={Boolean(errors.name)} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="you@email.com" {...register("email")} aria-invalid={Boolean(errors.email)} />
          </Field>
        </div>
        <Field label="Phone" hint="Optional, but helps if we need to coordinate delivery access">
          <Input placeholder="###-###-####" {...register("phone")} />
        </Field>
        <Field label="Preferred model">
          <Select {...register("preferredModel")}>
            <option value="">Select a model</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Preferred date">
            <Input type="date" {...register("preferredDate")} />
          </Field>
          <Field label="Time zone">
            <Input placeholder="Mountain, Central, etc." {...register("timeZone")} />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea rows={4} placeholder="What would you like to focus on during the call?" {...register("notes")} />
        </Field>
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full md:w-auto">
        {isSubmitting ? "Sending..." : "Request Consultation"}
      </Button>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-foreground/60">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
