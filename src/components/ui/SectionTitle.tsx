import { cn } from "@/lib/utils";

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  tone = "dark",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
  tone?: "light" | "dark";
}) {
  const alignment =
    align === "center" ? "text-center mx-auto" : align === "right" ? "text-right ml-auto" : "text-left";

  const isLight = tone === "light";
  const eyebrowColor = isLight ? "text-emerald-200/80" : "text-foreground/60";
  const titleColor = isLight ? "text-slate-50" : "text-foreground";
  const subtitleColor = isLight ? "text-slate-200/80" : "text-foreground/75";

  return (
    <div className={cn("space-y-3", alignment, className)}>
      {eyebrow && (
        <p className={cn("text-xs font-semibold uppercase tracking-[0.45em]", eyebrowColor)}>{eyebrow}</p>
      )}
      <h2 className={cn("text-3xl font-semibold md:text-4xl", titleColor)}>{title}</h2>
      {subtitle && <p className={cn("max-w-2xl text-base md:text-lg", subtitleColor)}>{subtitle}</p>}
    </div>
  );
}
