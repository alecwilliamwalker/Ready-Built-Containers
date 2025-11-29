"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type FAQItem = {
  question: string;
  answer: string;
};

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={item.question}
            className="rounded-2xl border border-slate-800/70 bg-slate-950/80 shadow-[0_18px_60px_-50px_rgba(15,23,42,0.9)]"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-6 px-6 py-4 text-left text-base font-semibold text-slate-100"
              onClick={() => setActiveIndex(isActive ? null : index)}
            >
              <span>{item.question}</span>
              <span className={cn("text-2xl transition", isActive ? "text-emerald-300" : "text-slate-500")}>{
                isActive ? "-" : "+"
              }</span>
            </button>
            <div className={cn("grid overflow-hidden px-6 transition-all", isActive ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]")}>
              <p className="min-h-0 text-sm text-slate-300">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
