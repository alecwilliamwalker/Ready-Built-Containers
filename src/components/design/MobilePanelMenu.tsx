"use client";

import { useState, useEffect } from "react";

export type PanelConfig = {
  id: string;
  title: string;
  icon: React.ReactNode;
};

export type MobilePanelMenuProps = {
  panels: PanelConfig[];
  activePanel: string | null;
  onSelectPanel: (panelId: string | null) => void;
};

export function MobilePanelMenu({
  panels,
  activePanel,
  onSelectPanel,
}: MobilePanelMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Don't render on desktop
  if (!isMobile) return null;

  // Close menu when a panel is selected
  const handleSelectPanel = (panelId: string) => {
    if (activePanel === panelId) {
      onSelectPanel(null);
    } else {
      onSelectPanel(panelId);
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Main FAB Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-2xl bg-gradient-to-r from-forest to-emerald-600 shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all text-white text-xl font-bold flex items-center justify-center"
        aria-label={isMenuOpen ? "Close panel menu" : "Open panel menu"}
      >
        {isMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Panel Selection Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[55] bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Items */}
          <div className="fixed bottom-36 right-4 z-[60] flex flex-col gap-2">
            {panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => handleSelectPanel(panel.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all ${
                  activePanel === panel.id
                    ? "bg-forest text-white"
                    : "bg-white text-foreground hover:bg-surface"
                }`}
              >
                <span className={`w-6 h-6 flex items-center justify-center ${
                  activePanel === panel.id ? "text-white" : "text-forest"
                }`}>
                  {panel.icon}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {panel.title}
                </span>
                {activePanel === panel.id && (
                  <span className="ml-2 text-xs opacity-70">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

