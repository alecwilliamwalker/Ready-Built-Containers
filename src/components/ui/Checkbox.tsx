"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, error, ...props }, ref) => {
    return (
      <label className={cn("flex items-start gap-3 text-sm", className)}>
        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            className="h-5 w-5 rounded border border-foreground/20 accent-forest"
            {...props}
          />
        </span>
        <span className="flex-1 space-y-1">
          {label && <span className="font-medium text-foreground">{label}</span>}
          {hint && <p className="text-xs text-foreground/70">{hint}</p>}
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        </span>
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";
