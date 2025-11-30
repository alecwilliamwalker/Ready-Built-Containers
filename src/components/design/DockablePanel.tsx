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
  // Mobile-specific props for external control
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
  mobileOpen,
  onMobileClose,
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
    if (hasMounted && !isMobile) {
      localStorage.setItem(panelKey, isOpen.toString());
    }
  }, [isOpen, panelKey, hasMounted, isMobile]);

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

  // On mobile, panels become bottom sheets controlled externally
  if (isMobile) {
    const isMobileOpen = mobileOpen ?? false;
    const handleClose = () => {
      onMobileClose?.();
    };

    // Only render if open on mobile
    if (!isMobileOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-[65] bg-slate-950/70 backdrop-blur-sm" 
          onClick={handleClose} 
        />
        
        {/* Mobile Bottom Sheet */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] rounded-t-3xl border-t-2 border-slate-200 bg-white shadow-2xl overflow-hidden"
          onTouchStart={(e) => { startY.current = e.touches[0].clientY; }}
          onTouchMove={(e) => {
            const deltaY = e.touches[0].clientY - startY.current;
            // Swipe down to dismiss (positive deltaY = moving finger down)
            if (deltaY > 100) handleClose();
          }}
        >
          {/* Drag handle pill */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-slate-300" />
          </div>
          
          {/* Mobile header */}
          <div className="flex items-center justify-between border-b border-surface-muted/40 px-4 py-2">
            <h2 className="text-lg font-bold text-foreground">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-all flex items-center justify-center"
              onClick={handleClose}
              title="Close Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          {/* Content */}
          <div className="max-h-[calc(80vh-80px)] overflow-y-auto p-4">{children}</div>
        </div>
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
