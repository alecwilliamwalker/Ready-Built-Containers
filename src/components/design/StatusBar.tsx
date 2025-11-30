"use client";

export type StatusBarProps = {
  cursorX?: number;
  cursorY?: number;
  snapIncrement: number;
  zoom: number;
  selectionCount: number;
  totalFixtures: number;
};

export function StatusBar({
  cursorX,
  cursorY,
  snapIncrement,
  zoom,
  selectionCount,
  totalFixtures,
}: StatusBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-muted/40 bg-slate-900 px-2 md:px-4 py-1.5 md:py-2 text-xs font-mono text-white/80">
      <div className="flex items-center justify-between">
        {/* Left: Coordinates - hidden on mobile (not useful without mouse) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white/50">X:</span>
            <span className="font-semibold text-white">
              {cursorX !== undefined ? `${cursorX.toFixed(2)}ft` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50">Y:</span>
            <span className="font-semibold text-white">
              {cursorY !== undefined ? `${cursorY.toFixed(2)}ft` : "—"}
            </span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <span className="text-white/50">Snap:</span>
            <span className="font-semibold text-white">{snapIncrement}ft</span>
          </div>
        </div>

        {/* Mobile: Simplified left section */}
        <div className="flex md:hidden items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-white/50">Snap:</span>
            <span className="font-semibold text-white">{snapIncrement}'</span>
          </div>
        </div>

        {/* Center: Selection Info */}
        <div className="flex items-center">
          <div className="flex items-center gap-1 md:gap-2">
            <span className="text-white/50 hidden sm:inline">Selected:</span>
            <span className="text-white/50 sm:hidden">Sel:</span>
            <span className="font-semibold text-white">
              {selectionCount}/{totalFixtures}
            </span>
          </div>
        </div>

        {/* Right: Zoom */}
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-white/50 hidden sm:inline">Zoom:</span>
          <span className="font-semibold text-white">{(zoom * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
