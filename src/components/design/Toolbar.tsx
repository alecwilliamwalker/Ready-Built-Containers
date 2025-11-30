"use client";

import { useState } from "react";

export type ToolType = "select" | "pan" | "measure" | "annotate" | "wall";

export type ToolbarProps = {
  viewMode: "2d" | "3d";
  onViewModeChange: (mode: "2d" | "3d") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDelete?: () => void;
  canDelete?: boolean;
  onRotate?: () => void;
  canRotate?: boolean;
  activeTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
  onToggleDebug?: () => void;
  debugEnabled?: boolean;
  onHomeClick?: () => void;
  onShowHelp?: () => void;
};

export function Toolbar({
  viewMode,
  onViewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onDelete,
  canDelete = false,
  onRotate,
  canRotate = false,
  activeTool = "select",
  onToolChange,
  onToggleDebug,
  debugEnabled = false,
  onHomeClick,
  onShowHelp,
}: ToolbarProps) {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  const tools = [
    { id: "select" as const, label: "Select", icon: "⌖", shortcut: "V" },
    { id: "pan" as const, label: "Pan", icon: "✋", shortcut: "H" },
    { id: "wall" as const, label: "Wall", icon: "🧱", shortcut: "W" },
    { id: "measure" as const, label: "Measure", icon: "📏", shortcut: "M" },
    { id: "annotate" as const, label: "Annotate", icon: "✎", shortcut: "A" },
  ];

  // Tools shown in the mobile dropdown (select/pan only)
  const mobileDropdownTools = tools.filter(t => t.id === "select" || t.id === "pan");
  
  // Tools shown in the mobile second row (wall, measure, annotate)
  const mobileSecondRowTools = tools.filter(t => t.id === "wall" || t.id === "measure" || t.id === "annotate");

  const activeToolData = tools.find(t => t.id === activeTool);

  return (
    <div className="relative z-50 border-b border-surface-muted/40 bg-white/95 shadow-md backdrop-blur-md flex flex-col px-2 sm:px-3 md:px-6 py-2 md:py-2.5">
      {/* First Row */}
      <div className="flex items-center h-10 sm:h-12 md:h-12">
        {/* Left: Home + Tools + Undo/Redo */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
        {/* Home Button */}
        <button
          onClick={onHomeClick}
          className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl text-foreground hover:bg-surface hover:shadow-md transition-all"
          title="Home"
        >
          <span className="text-lg md:text-2xl">🏠</span>
        </button>

        {/* Mobile: Collapsed tools menu (select/pan only) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
              showToolsMenu ? "bg-forest text-white" : 
              (activeTool === "select" || activeTool === "pan") ? "bg-forest text-white" : "bg-surface text-foreground"
            }`}
            title="Tools"
          >
            <span className="text-lg">
              {activeTool === "select" ? "⌖" : activeTool === "pan" ? "✋" : "⌖"}
            </span>
          </button>
          
          {/* Mobile tools dropdown (select/pan only) */}
          {showToolsMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowToolsMenu(false)} 
              />
              <div className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-xl border border-surface-muted/60 p-1.5 flex flex-col gap-1">
                {mobileDropdownTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      onToolChange?.(tool.id);
                      setShowToolsMenu(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                      activeTool === tool.id
                        ? "bg-forest text-white"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    <span className="text-lg">{tool.icon}</span>
                    <span className="text-sm font-medium">{tool.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Desktop/Tablet: Full tools row */}
        <div className="hidden sm:flex gap-1">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => onToolChange?.(tool.id)}
              className={`group relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-all ${
                activeTool === tool.id
                  ? "bg-forest text-white shadow-md ring-2 ring-forest/50"
                  : "text-foreground hover:bg-surface hover:shadow-md"
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <span className="text-lg md:text-xl">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1" />

        {/* Undo/Redo with arrow icons */}
        <div className="flex gap-0.5 sm:gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-foreground hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 14L4 9l5-5" />
              <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-foreground hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14l5-5-5-5" />
              <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1" />

        {/* Rotate & Delete */}
        <div className="flex gap-0.5 sm:gap-1">
          <button
            onClick={onRotate}
            disabled={!canRotate}
            className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-foreground hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Rotate (R)"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            disabled={!canDelete}
            className="h-10 w-10 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            title="Delete (Del)"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center: Title - hidden on mobile, visible on tablet+ */}
      <div className="flex-1 hidden sm:flex justify-center items-center mx-2 md:mx-8">
        <h1 className="text-sm md:text-lg font-bold uppercase tracking-wider text-foreground/90 truncate">
          Design Studio
        </h1>
      </div>

      {/* Spacer for mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Right: Help + Debug + View Toggle */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Help button - desktop only (mobile has it in second row) */}
        {onShowHelp && (
          <button
            onClick={onShowHelp}
            className="hidden sm:flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 transition-all"
            title="Keyboard & Mouse Shortcuts"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* Debug toggle - visible on all screen sizes for debugging touch issues */}
        <button
          onClick={onToggleDebug}
          className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl transition-all shadow-sm ${
            debugEnabled
              ? "bg-amber-500 text-white ring-2 ring-amber-400/50"
              : "text-foreground hover:bg-surface hover:shadow-md"
          }`}
          title="Toggle Debug"
        >
          <span className="text-lg md:text-2xl">🐛</span>
        </button>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-surface-muted/60 p-0.5 sm:p-1 md:p-1.5 bg-white shadow-sm">
          <button
            onClick={() => onViewModeChange("2d")}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5 text-xs sm:text-sm md:text-base rounded-lg font-semibold transition-all whitespace-nowrap ${
              viewMode === "2d"
                ? "bg-forest text-white shadow-md ring-2 ring-forest/50"
                : "text-foreground hover:bg-surface hover:shadow-md"
            }`}
            title="2D Plan View"
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center ${viewMode === "2d" ? "brightness-0 invert" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="text-xs md:text-base">2D</span>
          </button>
          <button
            onClick={() => onViewModeChange("3d")}
            className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5 text-xs sm:text-sm md:text-base rounded-lg font-semibold transition-all whitespace-nowrap ${
              viewMode === "3d"
                ? "bg-forest text-white shadow-md ring-2 ring-forest/50"
                : "text-foreground hover:bg-surface hover:shadow-md"
            }`}
            title="3D View"
          >
            <div className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center ${viewMode === "3d" ? "brightness-0 invert" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="text-xs md:text-base">3D</span>
          </button>
        </div>
      </div>
      </div>

      {/* Second Row: Mobile-only tools (wall, measure, annotate) + Help */}
      <div className="flex sm:hidden items-center justify-center gap-2 mt-2 pb-1">
        {mobileSecondRowTools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange?.(tool.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTool === tool.id
                ? "bg-forest text-white shadow-md"
                : "bg-surface text-foreground hover:bg-surface-muted"
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="text-base">{tool.icon}</span>
            <span className="text-xs font-medium">{tool.label}</span>
          </button>
        ))}

        {/* Help Button */}
        {onShowHelp && (
          <button
            onClick={onShowHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-600 hover:bg-cyan-500/25 transition-all"
            title="Touch Controls Help"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Help</span>
          </button>
        )}
      </div>
    </div>
  );
}
