"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import icon2D from "@/../public/2d_plan_icon_17640339828 84.png";
import icon3D from "@/../public/3d_view_icon_1764033993826.png";

export type ToolType = "select" | "pan" | "measure" | "annotate" | "wall";

export type ToolbarProps = {
  viewMode: "2d" | "3d";
  onViewModeChange: (mode: "2d" | "3d") => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeTool?: ToolType;
  onToolChange?: (tool: ToolType) => void;
  onToggleDebug?: () => void;
  debugEnabled?: boolean;
};

export function Toolbar({
  viewMode,
  onViewModeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeTool = "select",
  onToolChange,
  onToggleDebug,
  debugEnabled = false,
}: ToolbarProps) {
  const tools = [
    { id: "select" as const, label: "Select", icon: "⌖", shortcut: "V" },
    { id: "pan" as const, label: "Pan", icon: "✋", shortcut: "H" },
    { id: "wall" as const, label: "Wall", icon: "🧱", shortcut: "W" },
    { id: "measure" as const, label: "Measure", icon: "📏", shortcut: "M" },
    { id: "annotate" as const, label: "Annotate", icon: "✎", shortcut: "A" },
  ];

  return (
    <div className="fixed left-0 right-0 top-0 z-50 border-b border-surface-muted/40 bg-white/95 shadow-md backdrop-blur-md px-3 md:px-6 py-2.5 h-16 flex items-center">
      {/* Left: Home + Tools + Undo/Redo - flex-shrink-0 */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {/* Home Button */}
        <Link
          href="/"
          className="flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl text-foreground hover:bg-surface hover:shadow-md transition-all mr-1 md:mr-2"
          title="Home"
        >
          <span className="text-xl md:text-2xl">🏠</span>
        </Link>

        {/* Tools (compact mobile/desktop) */}
        <div className="flex gap-1">
          {tools.map(tool => (
            <button key={tool.id} onClick={() => onToolChange?.(tool.id)} className={`group relative flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-xl transition-all ${activeTool === tool.id ? "bg-forest text-white shadow-md ring-2 ring-forest/50" : "text-foreground hover:bg-surface hover:shadow-md"}`} title={`${tool.label} (${tool.shortcut})`}>
              <span className="text-lg md:text-xl">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <div className="flex gap-1 ml-1 md:ml-2">
          <button onClick={onUndo} disabled={!canUndo} className="h-11 w-11 flex items-center justify-center rounded-xl text-foreground hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent shadow-sm transition-all" title="Undo (Ctrl+Z)">
            <span className="text-xl">↶</span>
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="h-11 w-11 flex items-center justify-center rounded-xl text-foreground hover:bg-surface disabled:opacity-40 disabled:hover:bg-transparent shadow-sm transition-all" title="Redo (Ctrl+Y)">
            <span className="text-xl">↷</span>
          </button>
        </div>
      </div>

      {/* Center: Title - flex-1 justify-center */}
      <div className="flex-1 flex justify-center items-center mx-4 md:mx-8">
        <h1 className="text-base md:text-lg font-bold uppercase tracking-wider text-foreground/90">
          Design Studio
        </h1>
      </div>

      {/* Right: Debug + View Toggle - flex-shrink-0 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Debug */}
        <button onClick={onToggleDebug} className={`h-11 w-11 md:h-12 md:w-12 flex items-center justify-center rounded-xl transition-all shadow-sm ${debugEnabled ? "bg-amber-500 text-white ring-2 ring-amber-400/50" : "text-foreground hover:bg-surface hover:shadow-md"}`} title="Toggle Debug">
          <span className="text-xl md:text-2xl">🐛</span>
        </button>

        {/* View Toggle */}
        <div className="flex rounded-xl border border-surface-muted/60 p-1 md:p-1.5 bg-white shadow-sm">
          <button onClick={() => onViewModeChange("2d")} className={`flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 text-sm md:text-base rounded-lg font-semibold transition-all whitespace-nowrap ${viewMode === "2d" ? "bg-forest text-white shadow-md ring-2 ring-forest/50" : "text-foreground hover:bg-surface hover:shadow-md"}`} title="2D Plan View">
            <div className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center ${viewMode === "2d" ? "brightness-0 invert" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="hidden md:inline">2D</span>
          </button>
          <button onClick={() => onViewModeChange("3d")} className={`flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 text-sm md:text-base rounded-lg font-semibold transition-all whitespace-nowrap ${viewMode === "3d" ? "bg-forest text-white shadow-md ring-2 ring-forest/50" : "text-foreground hover:bg-surface hover:shadow-md"}`} title="3D View">
            <div className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center ${viewMode === "3d" ? "brightness-0 invert" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <span className="hidden md:inline">3D</span>
          </button>
        </div>
      </div>
    </div>
  );
}
