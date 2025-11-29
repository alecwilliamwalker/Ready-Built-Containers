"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, rows = 4, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      "w-full rounded-md border border-foreground/15 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/30 disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
