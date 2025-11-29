"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full appearance-none rounded-md border border-foreground/15 bg-white px-4 py-2.5 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/30 disabled:cursor-not-allowed disabled:opacity-60",
      "[background-image:linear-gradient(45deg,transparent_50%,#1f252b_50%),linear-gradient(135deg,#1f252b_50%,transparent_50%),linear-gradient(to_right,#1f252b,#1f252b)]",
      "[background-position:calc(100%-1.15rem)_1.05rem,calc(100%-0.75rem)_1.05rem,calc(100%-2.5rem)_0.5rem] [background-size:0.5rem_0.5rem,0.5rem_0.5rem,1px_60%] [background-repeat:no-repeat]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
