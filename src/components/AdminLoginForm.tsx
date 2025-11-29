"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { adminLoginSchema, type AdminLoginInput } from "@/lib/validation";

export function AdminLoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to log in");
      }

      showToast({ variant: "success", title: "Logged in", description: "Admin session created." });
      router.refresh();
    } catch (error) {
      console.error(error);
      showToast({ variant: "error", title: "Login failed", description: (error as Error).message });
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-surface-muted/60 bg-white p-6 shadow-[0_25px_70px_-45px_rgba(18,23,29,0.65)]">
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="admin-email"
          type="email"
          placeholder="admin@readybuiltcontainers.com"
          autoComplete="email"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="admin-password" className="mb-1 block text-sm font-medium text-foreground">
          Password
        </label>
        <Input
          id="admin-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

