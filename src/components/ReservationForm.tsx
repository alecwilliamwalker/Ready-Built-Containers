"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { reservationSchema, type ReservationInput } from "@/lib/validation";

export type ReservationFormProps = {
  models?: Array<{ slug: string; name: string }>;
  defaultModelSlug?: string;
  className?: string;
};

export function ReservationForm({ models = [], defaultModelSlug, className }: ReservationFormProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      modelSlug: defaultModelSlug ?? "",
      confirmTerms: false,
    },
  });

  async function onSubmit(data: ReservationInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reservations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          modelSlug: data.modelSlug || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to start reservation right now");
      }

      const payload = (await response.json()) as { url: string };
      window.location.href = payload.url;
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Checkout failed", description: (error as Error).message });
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
        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Your name" {...register("name")} aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@email.com" {...register("email")} aria-invalid={Boolean(errors.email)} />
        </Field>
        <Field label="Phone">
          <Input placeholder="###-###-####" {...register("phone")} />
        </Field>
        <Field label="Reservation applies to">
          <Select {...register("modelSlug")}>
            <option value="">Select a model</option>
            {models.map((model) => (
              <option key={model.slug} value={model.slug}>
                {model.name}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          {...register("confirmTerms")}
          label="I understand this deposit locks in the next available build slot and is credited toward my final invoice."
          hint="Fully refundable if we cannot deliver to your site or if engineering review flags an issue we can’t solve."
          error={errors.confirmTerms?.message}
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="mt-6 w-full md:w-auto">
        {isSubmitting ? "Redirecting..." : "Reserve Your Build Slot"}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </label>
  );
}
