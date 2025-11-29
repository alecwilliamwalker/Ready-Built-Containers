import type { JSX } from "react";
import type { FixtureCategory } from "@/types/design";

export type FixtureIconProps = {
  category: FixtureCategory;
  className?: string;
};

export function FixtureIcon({ category, className = "h-12 w-12" }: FixtureIconProps) {
  const icons: Record<FixtureCategory, JSX.Element> = {
    "shell-structure": (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
        <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    "fixture-bath": (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
        <circle cx="16" cy="20" r="2" fill="currentColor"/>
        <path d="M 24 28 Q 24 32 28 32" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
    "fixture-galley": (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="10" width="36" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <rect x="10" y="14" width="12" height="8" rx="1" fill="currentColor" fillOpacity="0.3"/>
        <rect x="26" y="14" width="12" height="8" rx="1" fill="currentColor" fillOpacity="0.3"/>
        <line x1="10" y1="28" x2="38" y2="28" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    "fixture-sleep": (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="16" width="32" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
        <rect x="6" y="36" width="36" height="4" rx="1" fill="currentColor" fillOpacity="0.4"/>
        <circle cx="14" cy="22" r="2" fill="currentColor"/>
      </svg>
    ),
    opening: (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="8" width="28" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="24" r="2" fill="currentColor"/>
        <path d="M 24 12 L 28 12 L 28 36 L 24 36" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    ),
    storage: (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="10" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <line x1="8" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="2"/>
        <line x1="8" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="2"/>
        <rect x="16" y="14" width="4" height="2" rx="1" fill="currentColor"/>
        <rect x="16" y="23" width="4" height="2" rx="1" fill="currentColor"/>
        <rect x="16" y="32" width="4" height="2" rx="1" fill="currentColor"/>
      </svg>
    ),
    interior: (
      <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="12" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
  };

  return icons[category] || icons.interior;
}



