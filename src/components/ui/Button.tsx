"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "accent" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type LinkLikeProps = Omit<React.ComponentProps<typeof Link>, "href" | "children"> & {
  href: string;
};

type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: undefined;
};

type ButtonProps = BaseProps & (LinkLikeProps | NativeButtonProps);

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "inline-flex items-center justify-center rounded-md bg-forest font-semibold text-white shadow-md shadow-forest/30 transition hover:bg-forest/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
  secondary:
    "inline-flex items-center justify-center rounded-md bg-surface font-semibold text-foreground shadow transition hover:bg-surface-muted/60 hover:text-foreground",
  accent:
    "inline-flex items-center justify-center rounded-md bg-accent font-semibold text-white shadow-md shadow-accent/35 transition hover:bg-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  outline:
    "inline-flex items-center justify-center rounded-md border border-foreground/20 font-semibold text-foreground transition hover:border-foreground/40 hover:text-foreground",
  ghost:
    "inline-flex items-center justify-center rounded-md font-semibold text-foreground transition hover:bg-foreground/5",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  const classes = cn(variantClasses[variant], sizeClasses[size], className);

  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as NativeButtonProps;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
