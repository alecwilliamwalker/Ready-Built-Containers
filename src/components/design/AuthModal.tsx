"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { TIMELINE_OPTIONS } from "@/lib/validation";

// Sign In schema
const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password is required"),
});

// Create Account schema
const createAccountSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
  timeline: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm your password"),
});

type SignInInput = z.infer<typeof signInSchema>;
type CreateAccountInput = z.infer<typeof createAccountSchema>;

export type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (userEmail: string) => void;
};

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "create">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const createForm = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      state: "",
      zip: "",
      timeline: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignIn = async (data: SignInInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Invalid email or password");
      }

      showToast({ variant: "success", title: "Welcome back!", description: "You're now signed in." });
      onSuccess(data.email);
    } catch (error) {
      showToast({ variant: "error", title: "Sign in failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async (data: CreateAccountInput) => {
    if (data.password !== data.confirmPassword) {
      showToast({ variant: "error", title: "Error", description: "Passwords do not match" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          phone: data.phone || undefined,
          state: data.state || undefined,
          zip: data.zip || undefined,
          timeline: data.timeline || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to create account");
      }

      showToast({ variant: "success", title: "Account created!", description: "Your design will be saved automatically." });
      onSuccess(data.email);
    } catch (error) {
      showToast({ variant: "error", title: "Registration failed", description: (error as Error).message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-md">
      {/* Tabs */}
      <div className="flex border-b border-surface-muted/60">
        <button
          type="button"
          onClick={() => setActiveTab("signin")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "signin"
              ? "border-b-2 border-forest text-forest"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "create"
              ? "border-b-2 border-forest text-forest"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      <div className="p-6">
        {activeTab === "signin" ? (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
            <p className="text-sm text-foreground/70 mb-4">
              Sign in to save your design and access it from anywhere.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@email.com"
                {...signInForm.register("email")}
                aria-invalid={Boolean(signInForm.formState.errors.email)}
              />
              {signInForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{signInForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...signInForm.register("password")}
                aria-invalid={Boolean(signInForm.formState.errors.password)}
              />
              {signInForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{signInForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
              {isSubmitting ? "Signing in..." : "Sign In & Save"}
            </Button>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit(handleCreateAccount)} className="space-y-4">
            <p className="text-sm text-foreground/70 mb-4">
              Create an account to save your design. We&apos;ll also keep you updated on your project.
            </p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="Your name"
                {...createForm.register("name")}
                aria-invalid={Boolean(createForm.formState.errors.name)}
              />
              {createForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="you@email.com"
                {...createForm.register("email")}
                aria-invalid={Boolean(createForm.formState.errors.email)}
              />
              {createForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  placeholder="###-###-####"
                  {...createForm.register("phone")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  State
                </label>
                <Input
                  type="text"
                  placeholder="MT"
                  maxLength={2}
                  {...createForm.register("state")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  ZIP Code
                </label>
                <Input
                  type="text"
                  placeholder="59601"
                  maxLength={10}
                  {...createForm.register("zip")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Timeline
                </label>
                <Select {...createForm.register("timeline")}>
                  <option value="">Select timeline</option>
                  {TIMELINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.replace("mo", " months")}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="At least 8 characters"
                {...createForm.register("password")}
                aria-invalid={Boolean(createForm.formState.errors.password)}
              />
              {createForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                {...createForm.register("confirmPassword")}
                aria-invalid={Boolean(createForm.formState.errors.confirmPassword)}
              />
              {createForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{createForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
              {isSubmitting ? "Creating account..." : "Create Account & Save"}
            </Button>

            <p className="text-xs text-foreground/50 text-center mt-4">
              By creating an account, you agree to receive updates about your project and Ready Built offers.
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}


