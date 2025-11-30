"use client";

import { useEffect } from "react";

export type HelpOverlayProps = {
  open: boolean;
  onDismiss: () => void;
  viewMode: "2d" | "3d";
  isMobile: boolean;
};

export function HelpOverlay({
  open,
  onDismiss,
  viewMode,
  isMobile,
}: HelpOverlayProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-2xl border border-white/20 bg-gradient-to-b from-slate-800 to-slate-900 p-5 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {isMobile ? "Touch Controls" : "Keyboard & Mouse"}
            </h2>
            <p className="text-xs text-white/50">{viewMode === "2d" ? "2D Plan View" : "3D View"}</p>
          </div>
        </div>

        {/* Tips */}
        <div className="space-y-3">
          {isMobile ? (
            // Mobile tips
            viewMode === "2d" ? (
              <>
                <TipSection title="Navigate">
                  <TipRow icon="✌️" text="2 fingers → Pan" />
                  <TipRow icon="🤏" text="Pinch → Zoom" />
                  <TipRow icon="👆👆" text="Double-tap → Center" />
                </TipSection>
                <TipSection title="Fixtures">
                  <TipRow icon="👆" text="Tap → Select" />
                  <TipRow icon="☝️" text="Drag → Move selected" />
                  <TipRow icon="📍" text="Tap canvas → Place" />
                </TipSection>
              </>
            ) : (
              <>
                <TipSection title="Camera">
                  <TipRow icon="☝️" text="1 finger → Orbit" />
                  <TipRow icon="🤏" text="Pinch → Zoom" />
                </TipSection>
                <TipSection title="Fixtures">
                  <TipRow icon="👆" text="Tap → Select" />
                  <TipRow icon="☝️" text="Drag anywhere → Move" />
                  <TipRow icon="👆" text="Tap empty → Deselect" />
                </TipSection>
              </>
            )
          ) : (
            // Desktop tips
            viewMode === "2d" ? (
              <>
                <TipSection title="Navigate">
                  <TipRow kbd="Scroll" text="Zoom" />
                  <TipRow kbd="Middle-drag" text="Pan" />
                  <TipRow kbd="Ctrl+drag" text="Pan (alt)" />
                </TipSection>
                <TipSection title="Select">
                  <TipRow kbd="Click" text="Select fixture" />
                  <TipRow kbd="Shift+click" text="Multi-select" />
                  <TipRow kbd="Drag empty" text="Marquee select" />
                  <TipRow kbd="Tab" text="Cycle nearby" />
                </TipSection>
                <TipSection title="Edit">
                  <TipRow kbd="Drag" text="Move fixture" />
                  <TipRow kbd="Arrows" text="Nudge selected" />
                  <TipRow kbd="R" text="Rotate 90°" />
                  <TipRow kbd="Del" text="Delete" />
                </TipSection>
                <TipSection title="Tools & History">
                  <TipRow kbd="V H W M A" text="Select/Pan/Wall/Measure/Annotate" />
                  <TipRow kbd="Ctrl+Z / Y" text="Undo / Redo" />
                  <TipRow kbd="Esc" text="Cancel / Deselect" />
                </TipSection>
              </>
            ) : (
              <>
                <TipSection title="Camera">
                  <TipRow kbd="Left-drag" text="Orbit" />
                  <TipRow kbd="Right-drag" text="Pan" />
                  <TipRow kbd="Scroll" text="Zoom" />
                </TipSection>
                <TipSection title="Fixtures">
                  <TipRow kbd="Click" text="Select" />
                  <TipRow kbd="Drag" text="Move on floor" />
                  <TipRow kbd="Arrows" text="Nudge" />
                  <TipRow kbd="R" text="Rotate 90°" />
                  <TipRow kbd="Del" text="Delete" />
                </TipSection>
                <TipSection title="Views">
                  <TipRow text="Use camera panel → Iso / Top / Front / Right" />
                  <TipRow kbd="Ctrl+Z / Y" text="Undo / Redo" />
                </TipSection>
              </>
            )
          )}

          {/* Panels tip - shared */}
          <TipSection title="Panels">
            {isMobile ? (
              <>
                <TipRow icon="📦" text="Carousel → Add fixtures" />
                <TipRow icon="☰" text="Menu button → Open panels" />
              </>
            ) : (
              <TipRow text="Click panel tabs on left/right edges" />
            )}
          </TipSection>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="mt-4 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/30 transition-all active:scale-[0.98] hover:bg-cyan-400"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function TipSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
        {title}
      </p>
      <div className="space-y-1.5 text-sm">
        {children}
      </div>
    </div>
  );
}

function TipRow({ icon, kbd, text }: { icon?: string; kbd?: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-white/80">
      {icon && <span className="w-6 text-center text-base">{icon}</span>}
      {kbd && (
        <span className="inline-flex min-w-[70px] items-center justify-center rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
          {kbd}
        </span>
      )}
      <span className={kbd ? "text-white/70" : ""}>{text}</span>
    </div>
  );
}

