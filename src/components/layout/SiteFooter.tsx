import Link from "next/link";
import { cn } from "@/lib/utils";

const footerLinks = [
  { href: "/models", label: "Models" },
  { href: "/design", label: "Build Your Own" },
  { href: "/plans", label: "Plan Views" },
  { href: "/process", label: "Build Process" },
  { href: "/faq", label: "FAQ" },
  { href: "/consultation", label: "Schedule Consult" },
  { href: "/reserve", label: "Reserve" },
];

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-surface-muted/60 bg-surface", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-[2fr,1fr] md:px-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-foreground/60">Ready Built Containers</p>
          <p className="max-w-xl text-base text-foreground/80">
            Engineered shipping-container cabins designed for hunters, outfitters, and rural landowners across the Midwest. Secure locking doors, insulated shells, and configurable off-grid systems deliver a turnkey camp you can deploy anywhere a truck can reach.
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-foreground/70">
            <a href="mailto:build@readybuiltcontainers.com" className="underline-offset-4 hover:underline">
              build@readybuiltcontainers.com
            </a>
            <span>Based in Audubon, Iowa</span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-foreground/70">Explore</p>
          <div className="grid grid-cols-2 gap-2">
            {footerLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-foreground/70 transition hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-surface-muted/60 bg-surface/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-foreground/60 md:px-8">
          <p>© {new Date().getFullYear()} Ready Built Containers, LLC. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground/80">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground/80">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
