"use client";

import type { PriceSummary } from "@/types/design";
import { formatCurrencyCents } from "@/lib/format";

export type PriceSummaryPanelProps = {
  summary: PriceSummary;
};

export function PriceSummaryPanel({ summary }: PriceSummaryPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
        Price Summary
      </p>
      <div className="space-y-2">
        {summary.lines.length === 0 ? (
          <p className="text-xs text-foreground/60">No fixtures added.</p>
        ) : (
          <>
            <ul className="space-y-1 text-xs text-foreground/70">
              {summary.lines.map((line) => (
                <li
                  key={line.fixtureId}
                  className="flex items-center justify-between"
                >
                  <span>{line.label}</span>
                  <span className="font-medium">
                    {formatCurrencyCents(line.lineCents)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-surface-muted/60 pt-2">
              <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                <span>Subtotal</span>
                <span>{formatCurrencyCents(summary.subtotalCents)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

