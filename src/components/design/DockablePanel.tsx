"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export type DockablePanelProps = {
  title: string;
  position: "left" | "right" | "bottom";
  defaultOpen?: boolean;
  children: React.ReactNode;
  width?: string;
  maxHeight?: string;
  panelIndex?: number;
  icon?: React.ReactNode;
};

export function DockablePanel({
  title,
  position,
  defaultOpen = true,
  children,
  width = "320px",
  maxHeight = "calc(100vh - 120px)",
  panelIndex = 0,
  icon,
}: DockablePanelProps) {
  const panelKey = `${title}-${panelIndex}`;
  // Always initialize with defaultOpen to avoid hydration mismatch
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const startY = useRef(0);

  // Sync with localStorage after hydration (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(panelKey);
    if (stored !== null) {
      setIsOpen(stored !== 'false');
    }
    setHasMounted(true);
  }, [panelKey]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Persist to localStorage when isOpen changes (only after initial mount)
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(panelKey, isOpen.toString());
    }
  }, [isOpen, panelKey, hasMounted]);

  const positionClasses = {
    left: "left-0 top-0 bottom-0",
    right: "right-0 top-0 bottom-0",
    bottom: "left-0 right-0 bottom-0",
  };

  const transformClasses = {
    left: isOpen ? "translate-x-0" : "-translate-x-full",
    right: isOpen ? "translate-x-0" : "translate-x-full",
    bottom: isOpen ? "translate-y-0" : "translate-y-full",
  };

  const sizeClasses = {
    left: `w-[${width}]`,
    right: `w-[${width}]`,
    bottom: "h-[300px]",
  };

  // On mobile, panels become bottom sheets
  if (isMobile) {
    return (
      <>
        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="fixed bottom-16 right-4 z-[60] w-14 h-14 rounded-2xl bg-gradient-to-r from-forest to-emerald-600 shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all text-white text-xl font-bold flex items-center justify-center"
        >
          {isOpen ? '✕' : '☰'}
        </button>

        {/* Mobile Bottom Sheet */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            <div 
              className="fixed bottom-0 left-0 right-0 z-[70] max-h-[75vh] rounded-t-3xl border-t-2 border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden"
              onTouchStart={(e) => { startY.current = e.touches[0].clientY; }}
              onTouchMove={(e) => {
                const deltaY = e.touches[0].clientY - startY.current;
                if (deltaY > 100) setIsOpen(false); // Swipe up dismiss
              }}
            >
              {/* Mobile header (~78-92): */}
              <div className="flex items-center justify-between border-b border-surface-muted/40 px-4 py-3">
                <h2 className="text-lg font-bold text-foreground">  // Larger title
                  {title}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className="h-12 w-12 p-3 ml-auto mr-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-500 font-bold text-2xl shadow-lg rounded-full transition-all flex items-center justify-center group hover:scale-105"
                  onClick={() => setIsOpen(false)}
                  title="Close Panel"
                >
                  ✕
                  <span className="text-xs font-medium block mt-1 group-hover:block hidden">Close</span>
                </Button>
              </div>
              <div className="max-h-[calc(70vh-52px)] overflow-y-auto p-4">{children}</div>
            </div>
          </>
        )}
      </>
    );
  }

  // Desktop panels
  // Calculate toggle button position dynamically with vertical offset
  const getToggleButtonStyle = () => {
    const baseStyle: React.CSSProperties = {
      position: "fixed",
      zIndex: 40,
      transition: "all 0.3s ease-in-out",
    };

    // Calculate vertical offset based on panel index
    const verticalOffset = panelIndex * 60;
    const baseTop = 80 + verticalOffset;

    if (position === "left") {
      return {
        ...baseStyle,
        left: isOpen ? `calc(${width} + 16px)` : "16px",
        top: `${baseTop}px`,
      };
    } else if (position === "right") {
      return {
        ...baseStyle,
        right: isOpen ? `calc(${width} + 16px)` : "16px",
        top: `${baseTop}px`,
      };
    } else {
      return {
        ...baseStyle,
        bottom: isOpen ? "316px" : "16px",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
  };

  return (
    <>
      {/* Toggle Button - Fixed positioning that works when panel is open/closed */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={getToggleButtonStyle()}
        className={`rounded-lg bg-white shadow-lg hover:bg-surface hover:shadow-xl transition-all ${isOpen ? "p-2" : "p-2.5"
          } ${!isOpen && icon ? "w-12 h-12" : "w-10 h-10"} flex flex-col items-center justify-center gap-0.5`}
        title={isOpen ? `Hide ${title}` : `Show ${title}`}
      >
        {!isOpen && icon ? (
          // Collapsed state with icon
          <>
            <div className="text-forest">{icon}</div>
            <span className="text-xs text-foreground/60">
              {position === "left" && "→"}
              {position === "right" && "←"}
              {position === "bottom" && "↑"}
            </span>
          </>
        ) : (
          // Open state or no icon - just arrow
          <>
            {position === "left" && (isOpen ? "←" : "→")}
            {position === "right" && (isOpen ? "→" : "←")}
            {position === "bottom" && (isOpen ? "↓" : "↑")}
          </>
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed z-30 ${positionClasses[position]} ${transformClasses[position]} transition-transform duration-300 ease-in-out pointer-events-none`}
        style={{
          width: position !== "bottom" ? width : "auto",
          maxHeight: position !== "bottom" ? maxHeight : "300px",
        }}
      >
        <div className="h-full overflow-hidden rounded-r-2xl border-r border-t border-b border-surface-muted/60 bg-white/95 shadow-2xl backdrop-blur-md pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-muted/40 px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-52px)] overflow-y-auto p-4">{children}</div>
        </div>
      </div>
    </>
  );
}

