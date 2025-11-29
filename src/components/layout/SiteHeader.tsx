"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/models", label: "Models" },
  { href: "/design", label: "Build your own" },
  { href: "/plans", label: "Plans" },
  { href: "/process", label: "Process" },
  { href: "/faq", label: "FAQ" },
  { href: "/quote", label: "Quote" },
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isOverlay = isLanding && !scrolled;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300",
        isOverlay
          ? "border-transparent bg-transparent text-slate-100"
          : "border-slate-200 bg-white/95 text-slate-900 shadow-sm backdrop-blur",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className={clsx(
            "flex items-center gap-3 transition",
            isOverlay ? "text-slate-100 hover:text-emerald-300" : "text-slate-900 hover:text-emerald-600",
          )}
          onClick={() => setIsOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-400/30">
            RB
          </span>
          <span className="leading-tight">
            <span
              className={clsx(
                "text-[11px] font-semibold uppercase tracking-[0.16em]",
                isOverlay ? "text-slate-100" : "text-slate-700",
              )}
            >
              Ready Built
            </span>
            <span
              className={clsx(
                "block text-[10px] uppercase tracking-[0.18em]",
                isOverlay ? "text-slate-400" : "text-slate-500",
              )}
            >
              Containers
            </span>
          </span>
        </Link>

        <nav
          className={clsx(
            "hidden flex-1 items-center justify-center gap-6 text-[13px] md:flex",
            isOverlay ? "text-slate-200" : "text-slate-700",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "transition-colors",
                isOverlay ? "hover:text-emerald-400" : "hover:text-emerald-600",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/quote"
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md shadow-emerald-500/25 transition-colors hover:bg-emerald-400"
          >
            Get Pricing &amp; Availability
          </Link>
        </div>

        <button
          type="button"
          className={clsx(
            "ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold md:hidden",
            isOverlay ? "border-slate-700/70 text-slate-100" : "border-slate-200 text-slate-900",
          )}
          onClick={() => setIsOpen((previous) => !previous)}
          aria-label="Toggle navigation"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      <div
        className={clsx(
          "md:hidden",
          isOpen
            ? clsx(
                "max-h-96 border-t",
                isOverlay ? "border-slate-800/70 bg-slate-950/95" : "border-slate-200 bg-white/95 shadow-lg",
              )
            : "max-h-0 overflow-hidden",
        )}
      >
        <div
          className={clsx(
            "space-y-3 px-4 pb-6 pt-4 text-sm font-medium",
            isOverlay ? "text-slate-200" : "text-slate-700",
          )}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block rounded-md px-2 py-2 transition-colors",
                isOverlay ? "hover:bg-slate-900/70" : "hover:bg-slate-100",
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/quote"
            className="mt-2 block rounded-full bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
            onClick={() => setIsOpen(false)}
          >
            Get Pricing &amp; Availability
          </Link>
        </div>
      </div>
    </header>
  );
}
