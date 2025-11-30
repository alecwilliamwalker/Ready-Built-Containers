import type { JSX } from "react";
import type { FixtureCategory } from "@/types/design";

export type FixtureIconProps = {
  category: FixtureCategory;
  fixtureKey?: string;
  className?: string;
};

// Item-specific icons based on fixture key
const ITEM_ICONS: Record<string, (className: string) => JSX.Element> = {
  // ========== BATH FIXTURES ==========
  "fixture-toilet": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Toilet bowl */}
      <ellipse cx="24" cy="30" rx="10" ry="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Tank */}
      <rect x="16" y="12" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Seat */}
      <ellipse cx="24" cy="30" rx="7" ry="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Flush handle */}
      <line x1="30" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  "fixture-shower-36x36": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shower base */}
      <rect x="8" y="32" width="32" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Shower head */}
      <circle cx="32" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Water drops */}
      <line x1="28" y1="18" x2="28" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="18" x2="32" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="18" x2="36" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Pipe */}
      <line x1="32" y1="8" x2="32" y2="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="32" y1="4" x2="40" y2="4" stroke="currentColor" strokeWidth="2"/>
      <line x1="40" y1="4" x2="40" y2="40" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  
  "fixture-vanity-24": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet */}
      <rect x="8" y="20" width="32" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Sink basin */}
      <ellipse cx="24" cy="14" rx="10" ry="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Faucet */}
      <path d="M24 10 L24 6 Q24 4 26 4 L28 4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Cabinet doors */}
      <line x1="24" y1="22" x2="24" y2="38" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <circle cx="20" cy="30" r="1.5" fill="currentColor"/>
      <circle cx="28" cy="30" r="1.5" fill="currentColor"/>
    </svg>
  ),
  
  "fixture-vanity-30": (className) => ITEM_ICONS["fixture-vanity-24"](className),
  
  "fixture-vanity-60-double": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet */}
      <rect x="4" y="20" width="40" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Two sink basins */}
      <ellipse cx="14" cy="14" rx="7" ry="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      <ellipse cx="34" cy="14" rx="7" ry="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Faucets */}
      <circle cx="14" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="34" cy="10" r="1.5" fill="currentColor"/>
      {/* Cabinet divisions */}
      <line x1="16" y1="22" x2="16" y2="38" stroke="currentColor" strokeWidth="1"/>
      <line x1="24" y1="22" x2="24" y2="38" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="32" y1="22" x2="32" y2="38" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  
  "fixture-linen-cabinet": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tall cabinet */}
      <rect x="12" y="4" width="24" height="40" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Shelves */}
      <line x1="12" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="34" x2="36" y2="34" stroke="currentColor" strokeWidth="1.5"/>
      {/* Towel stacks */}
      <rect x="16" y="6" width="16" height="6" rx="1" fill="currentColor" fillOpacity="0.3"/>
      <rect x="16" y="16" width="16" height="6" rx="1" fill="currentColor" fillOpacity="0.25"/>
      <rect x="16" y="26" width="16" height="6" rx="1" fill="currentColor" fillOpacity="0.2"/>
      {/* Handle */}
      <circle cx="32" cy="24" r="2" fill="currentColor"/>
    </svg>
  ),

  // ========== GALLEY / KITCHEN FIXTURES ==========
  "fixture-sink-base": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Counter */}
      <rect x="6" y="14" width="36" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Sink basin */}
      <rect x="12" y="16" width="14" height="4" rx="2" fill="currentColor" fillOpacity="0.4"/>
      {/* Faucet */}
      <path d="M32 14 L32 10 Q32 8 34 8 L36 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Cabinet below */}
      <rect x="8" y="20" width="32" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Cabinet doors */}
      <line x1="24" y1="22" x2="24" y2="38" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="30" r="1.5" fill="currentColor"/>
      <circle cx="28" cy="30" r="1.5" fill="currentColor"/>
    </svg>
  ),
  
  "fixture-fridge-24": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main body */}
      <rect x="10" y="4" width="28" height="40" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Freezer door */}
      <rect x="10" y="4" width="28" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Fridge door */}
      <line x1="10" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="2"/>
      {/* Handles */}
      <rect x="32" y="8" width="2" height="6" rx="1" fill="currentColor"/>
      <rect x="32" y="20" width="2" height="10" rx="1" fill="currentColor"/>
      {/* Ice maker */}
      <rect x="14" y="7" width="6" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
  
  "fixture-range-30": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main body */}
      <rect x="8" y="14" width="32" height="28" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Stovetop */}
      <rect x="8" y="14" width="32" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Burners */}
      <circle cx="16" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="32" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="16" cy="18" r="1" fill="currentColor"/>
      <circle cx="32" cy="18" r="1" fill="currentColor"/>
      {/* Oven door */}
      <rect x="10" y="26" width="28" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Oven window */}
      <rect x="14" y="28" width="20" height="8" rx="1" fill="currentColor" fillOpacity="0.15"/>
      {/* Oven handle */}
      <line x1="14" y1="38" x2="34" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  "fixture-cabinet-run-24": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Counter top */}
      <rect x="4" y="12" width="40" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Cabinet body */}
      <rect x="6" y="16" width="36" height="24" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Cabinet doors */}
      <line x1="18" y1="18" x2="18" y2="38" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="30" y1="18" x2="30" y2="38" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <rect x="14" y="26" width="2" height="5" rx="0.5" fill="currentColor"/>
      <rect x="22" y="26" width="2" height="5" rx="0.5" fill="currentColor"/>
      <rect x="32" y="26" width="2" height="5" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  
  "fixture-cabinet-run-30": (className) => ITEM_ICONS["fixture-cabinet-run-24"](className),
  
  "fixture-upper-cabinet-24": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet body (wall-mounted, no legs) */}
      <rect x="6" y="10" width="36" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Cabinet doors */}
      <line x1="24" y1="12" x2="24" y2="28" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <rect x="19" y="18" width="2" height="4" rx="0.5" fill="currentColor"/>
      <rect x="27" y="18" width="2" height="4" rx="0.5" fill="currentColor"/>
      {/* Wall mount indicators */}
      <line x1="6" y1="6" x2="42" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Shelf inside (visible through glass or gap) */}
      <line x1="8" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <line x1="26" y1="20" x2="40" y2="20" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
    </svg>
  ),
  
  "fixture-island-48": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Counter top */}
      <rect x="4" y="12" width="40" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Island body */}
      <rect x="6" y="16" width="36" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Cabinet doors on both sides */}
      <line x1="18" y1="18" x2="18" y2="34" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="30" y1="18" x2="30" y2="34" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <circle cx="12" cy="26" r="1.5" fill="currentColor"/>
      <circle cx="24" cy="26" r="1.5" fill="currentColor"/>
      <circle cx="36" cy="26" r="1.5" fill="currentColor"/>
      {/* Counter overhang indicator */}
      <line x1="4" y1="40" x2="44" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2"/>
    </svg>
  ),
  
  "fixture-table-48": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Table top */}
      <rect x="6" y="16" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.25"/>
      {/* Legs */}
      <line x1="10" y1="20" x2="10" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="38" y1="20" x2="38" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="10" y1="38" x2="38" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  
  "fixture-bench-36": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Seat */}
      <rect x="6" y="24" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Legs */}
      <rect x="8" y="28" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.4"/>
      <rect x="36" y="28" width="4" height="12" rx="1" fill="currentColor" fillOpacity="0.4"/>
      {/* Support bar */}
      <line x1="12" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),

  // ========== SLEEP / BEDROOM FIXTURES ==========
  "fixture-bed-twin": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Mattress */}
      <rect x="6" y="16" width="36" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Headboard */}
      <rect x="6" y="8" width="36" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Pillow */}
      <rect x="10" y="18" width="14" height="6" rx="2" fill="currentColor" fillOpacity="0.4"/>
      {/* Blanket fold */}
      <line x1="8" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1.5"/>
      {/* Frame base */}
      <rect x="4" y="36" width="40" height="4" rx="1" fill="currentColor" fillOpacity="0.15"/>
    </svg>
  ),
  
  "fixture-bed-full": (className) => ITEM_ICONS["fixture-bed-twin"](className),
  "fixture-bed-queen": (className) => ITEM_ICONS["fixture-bed-twin"](className),
  
  "fixture-bunk-twin": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Frame posts */}
      <line x1="8" y1="4" x2="8" y2="44" stroke="currentColor" strokeWidth="2.5"/>
      <line x1="40" y1="4" x2="40" y2="44" stroke="currentColor" strokeWidth="2.5"/>
      {/* Top bunk mattress */}
      <rect x="8" y="8" width="32" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Bottom bunk mattress */}
      <rect x="8" y="30" width="32" height="10" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Top pillow */}
      <rect x="10" y="10" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.4"/>
      {/* Bottom pillow */}
      <rect x="10" y="32" width="8" height="4" rx="1" fill="currentColor" fillOpacity="0.4"/>
      {/* Ladder */}
      <line x1="36" y1="18" x2="36" y2="30" stroke="currentColor" strokeWidth="2"/>
      <line x1="33" y1="21" x2="39" y2="21" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="33" y1="25" x2="39" y2="25" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  
  "fixture-nightstand": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top surface */}
      <rect x="10" y="12" width="28" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Body */}
      <rect x="12" y="16" width="24" height="24" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Drawer */}
      <rect x="14" y="20" width="20" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
      {/* Drawer handle */}
      <rect x="22" y="23" width="4" height="2" rx="0.5" fill="currentColor"/>
      {/* Lower cabinet door */}
      <rect x="14" y="30" width="20" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="24" cy="34" r="1.5" fill="currentColor"/>
    </svg>
  ),
  
  "fixture-dresser-36": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top surface */}
      <rect x="6" y="8" width="36" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Body */}
      <rect x="8" y="12" width="32" height="30" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Drawers */}
      <rect x="10" y="14" width="28" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      <rect x="10" y="24" width="28" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      <rect x="10" y="34" width="28" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      {/* Drawer handles */}
      <rect x="22" y="17" width="4" height="2" rx="0.5" fill="currentColor"/>
      <rect x="22" y="27" width="4" height="2" rx="0.5" fill="currentColor"/>
      <rect x="22" y="36" width="4" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  
  "fixture-sofa-72": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back */}
      <rect x="4" y="10" width="40" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Seat cushions */}
      <rect x="6" y="22" width="36" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.25"/>
      {/* Armrests */}
      <rect x="4" y="18" width="6" height="16" rx="2" fill="currentColor" fillOpacity="0.3"/>
      <rect x="38" y="18" width="6" height="16" rx="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Cushion division */}
      <line x1="24" y1="24" x2="24" y2="30" stroke="currentColor" strokeWidth="1.5"/>
      {/* Feet */}
      <rect x="10" y="34" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.4"/>
      <rect x="34" y="34" width="4" height="4" rx="1" fill="currentColor" fillOpacity="0.4"/>
    </svg>
  ),
  
  "fixture-recliner": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Back (reclined angle) */}
      <path d="M10 8 L10 24 L38 24 L38 8 Q24 14 10 8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Seat */}
      <rect x="10" y="24" width="28" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.25"/>
      {/* Footrest extended */}
      <rect x="12" y="32" width="24" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Armrests */}
      <rect x="6" y="16" width="6" height="18" rx="2" fill="currentColor" fillOpacity="0.3"/>
      <rect x="36" y="16" width="6" height="18" rx="2" fill="currentColor" fillOpacity="0.3"/>
      {/* Base */}
      <ellipse cx="24" cy="42" rx="10" ry="3" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  
  "fixture-coat-rack": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main pole */}
      <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="3"/>
      {/* Hooks */}
      <path d="M16 14 Q12 14 12 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M32 14 Q36 14 36 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M14 22 Q10 22 10 26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M34 22 Q38 22 38 26" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Base */}
      <ellipse cx="24" cy="42" rx="12" ry="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Top finial */}
      <circle cx="24" cy="6" r="3" fill="currentColor"/>
    </svg>
  ),

  // ========== OPENINGS ==========
  "fixture-window-24x36": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Frame */}
      <rect x="8" y="6" width="32" height="36" rx="1" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.05"/>
      {/* Glass panes */}
      <rect x="10" y="8" width="13" height="15" fill="currentColor" fillOpacity="0.15"/>
      <rect x="25" y="8" width="13" height="15" fill="currentColor" fillOpacity="0.15"/>
      <rect x="10" y="25" width="13" height="15" fill="currentColor" fillOpacity="0.15"/>
      <rect x="25" y="25" width="13" height="15" fill="currentColor" fillOpacity="0.15"/>
      {/* Cross bars */}
      <line x1="8" y1="23" x2="40" y2="23" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="6" x2="24" y2="42" stroke="currentColor" strokeWidth="2"/>
      {/* Sill */}
      <rect x="6" y="42" width="36" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
    </svg>
  ),
  
  "fixture-window-36x48": (className) => ITEM_ICONS["fixture-window-24x36"](className),
  
  "fixture-interior-door": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Door frame */}
      <rect x="10" y="4" width="28" height="40" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Door panel */}
      <rect x="12" y="6" width="24" height="36" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15"/>
      {/* Door handle */}
      <ellipse cx="32" cy="26" rx="2" ry="3" fill="currentColor"/>
      {/* Panel details */}
      <rect x="16" y="10" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
      <rect x="16" y="26" width="16" height="12" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/>
    </svg>
  ),

  // ========== STORAGE ==========
  "storage-cabinet": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet body */}
      <rect x="8" y="6" width="32" height="36" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Shelves */}
      <line x1="8" y1="18" x2="40" y2="18" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <rect x="20" y="10" width="8" height="2" rx="0.5" fill="currentColor"/>
      <rect x="20" y="22" width="8" height="2" rx="0.5" fill="currentColor"/>
      <rect x="20" y="34" width="8" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  ),

  // ========== INTERIOR / STRUCTURE ==========
  "fixture-wall": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wall representation */}
      <rect x="4" y="14" width="40" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Texture lines */}
      <line x1="12" y1="14" x2="12" y2="34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <line x1="36" y1="14" x2="36" y2="34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
    </svg>
  ),
  
  "module-vestibule": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Entry area outline */}
      <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Door opening */}
      <rect x="16" y="8" width="16" height="4" fill="currentColor" fillOpacity="0.3"/>
      {/* Interior space */}
      <rect x="12" y="16" width="24" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 2"/>
      {/* Entry arrow */}
      <path d="M24 6 L24 14 M20 10 L24 14 L28 10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// Category fallback icons
const CATEGORY_ICONS: Record<FixtureCategory, (className: string) => JSX.Element> = {
  "shell-structure": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="40" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  "fixture-bath": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bathtub */}
      <path d="M6 24 L6 36 Q6 40 10 40 L38 40 Q42 40 42 36 L42 24" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Water line */}
      <path d="M10 28 Q14 32 18 28 Q22 24 26 28 Q30 32 34 28 Q38 24 38 28" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      {/* Faucet */}
      <circle cx="12" cy="20" r="2" fill="currentColor"/>
      <path d="M12 18 L12 14 Q12 12 14 12 L16 12" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  ),
  "fixture-galley": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Counter */}
      <rect x="4" y="16" width="40" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
      {/* Burners */}
      <circle cx="14" cy="18" r="2" fill="currentColor"/>
      <circle cx="24" cy="18" r="2" fill="currentColor"/>
      {/* Cabinet */}
      <rect x="6" y="20" width="36" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      <line x1="24" y1="22" x2="24" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  "fixture-sleep": (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bed frame */}
      <rect x="6" y="18" width="36" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15"/>
      {/* Headboard */}
      <rect x="6" y="10" width="36" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.25"/>
      {/* Pillow */}
      <rect x="10" y="20" width="12" height="6" rx="2" fill="currentColor" fillOpacity="0.4"/>
      {/* Base */}
      <rect x="4" y="36" width="40" height="4" rx="1" fill="currentColor" fillOpacity="0.2"/>
    </svg>
  ),
  opening: (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Door frame */}
      <rect x="10" y="6" width="28" height="36" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      {/* Door */}
      <rect x="12" y="8" width="24" height="32" rx="1" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1"/>
      {/* Handle */}
      <circle cx="32" cy="26" r="2" fill="currentColor"/>
      {/* Swing arc */}
      <path d="M12 40 Q-4 26 12 8" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="3 2"/>
    </svg>
  ),
  storage: (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cabinet */}
      <rect x="8" y="6" width="32" height="36" rx="1" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
      {/* Shelves */}
      <line x1="8" y1="16" x2="40" y2="16" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="26" x2="40" y2="26" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="36" x2="40" y2="36" stroke="currentColor" strokeWidth="1.5"/>
      {/* Handles */}
      <rect x="18" y="10" width="4" height="2" rx="0.5" fill="currentColor"/>
      <rect x="18" y="20" width="4" height="2" rx="0.5" fill="currentColor"/>
      <rect x="18" y="30" width="4" height="2" rx="0.5" fill="currentColor"/>
    </svg>
  ),
  interior: (className) => (
    <svg className={className} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Room outline */}
      <rect x="8" y="8" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05"/>
      {/* Floor pattern */}
      <line x1="8" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5"/>
      {/* Center marker */}
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
};

export function FixtureIcon({ category, fixtureKey, className = "h-12 w-12" }: FixtureIconProps) {
  // First try to get item-specific icon
  if (fixtureKey && ITEM_ICONS[fixtureKey]) {
    return ITEM_ICONS[fixtureKey](className);
  }
  
  // Fall back to category icon
  const categoryIcon = CATEGORY_ICONS[category];
  if (categoryIcon) {
    return categoryIcon(className);
  }
  
  // Ultimate fallback to interior
  return CATEGORY_ICONS.interior(className);
}
