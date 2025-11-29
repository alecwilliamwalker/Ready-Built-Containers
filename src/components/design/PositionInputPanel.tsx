"use client";

import { useState, useEffect, useCallback } from "react";
import type { FixtureConfig } from "@/types/design";

export type PositionInputPanelProps = {
  fixture: FixtureConfig | null;
  shellBounds: { lengthFt: number; widthFt: number };
  onUpdatePosition: (id: string, updates: { xFt?: number; yFt?: number; rotationDeg?: 0 | 90 | 180 | 270 }) => void;
};

/**
 * Panel for numerical position/rotation input of selected fixture
 */
export function PositionInputPanel({
  fixture,
  shellBounds,
  onUpdatePosition,
}: PositionInputPanelProps) {
  const [xInput, setXInput] = useState("");
  const [yInput, setYInput] = useState("");

  // Sync inputs when fixture changes
  useEffect(() => {
    if (fixture) {
      setXInput(fixture.xFt.toFixed(2));
      setYInput(fixture.yFt.toFixed(2));
    }
  }, [fixture?.id, fixture?.xFt, fixture?.yFt]);

  const handleXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setXInput(e.target.value);
  }, []);

  const handleYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setYInput(e.target.value);
  }, []);

  const handleXBlur = useCallback(() => {
    if (!fixture) return;
    const value = parseFloat(xInput);
    if (!isNaN(value)) {
      const clamped = Math.max(0, Math.min(shellBounds.lengthFt, value));
      onUpdatePosition(fixture.id, { xFt: clamped });
      setXInput(clamped.toFixed(2));
    } else {
      setXInput(fixture.xFt.toFixed(2));
    }
  }, [fixture, xInput, shellBounds.lengthFt, onUpdatePosition]);

  const handleYBlur = useCallback(() => {
    if (!fixture) return;
    const value = parseFloat(yInput);
    if (!isNaN(value)) {
      const clamped = Math.max(0, Math.min(shellBounds.widthFt, value));
      onUpdatePosition(fixture.id, { yFt: clamped });
      setYInput(clamped.toFixed(2));
    } else {
      setYInput(fixture.yFt.toFixed(2));
    }
  }, [fixture, yInput, shellBounds.widthFt, onUpdatePosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const handleRotation = useCallback((deg: 0 | 90 | 180 | 270) => {
    if (!fixture) return;
    onUpdatePosition(fixture.id, { rotationDeg: deg });
  }, [fixture, onUpdatePosition]);

  if (!fixture) {
    return (
      <div className="rounded-lg border border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs text-white/40 italic">Select a fixture to edit position</p>
      </div>
    );
  }

  const currentRotation = fixture.rotationDeg || 0;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-sm space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
        Position (ft)
      </p>

      {/* X/Y Position Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">X (Length)</label>
          <input
            type="text"
            value={xInput}
            onChange={handleXChange}
            onBlur={handleXBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded bg-white/10 border border-white/20 px-2 py-1 text-xs text-white font-mono
                       focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500
                       hover:border-white/30 transition-colors"
            placeholder="0.00"
          />
          <span className="text-[9px] text-white/30">0 - {shellBounds.lengthFt}</span>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Y (Width)</label>
          <input
            type="text"
            value={yInput}
            onChange={handleYChange}
            onBlur={handleYBlur}
            onKeyDown={handleKeyDown}
            className="w-full rounded bg-white/10 border border-white/20 px-2 py-1 text-xs text-white font-mono
                       focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500
                       hover:border-white/30 transition-colors"
            placeholder="0.00"
          />
          <span className="text-[9px] text-white/30">0 - {shellBounds.widthFt}</span>
        </div>
      </div>

      {/* Rotation Buttons */}
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Rotation</label>
        <div className="grid grid-cols-4 gap-1">
          {([0, 90, 180, 270] as const).map((deg) => (
            <button
              key={deg}
              onClick={() => handleRotation(deg)}
              className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                currentRotation === deg
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>

      {/* Quick position buttons */}
      <div>
        <label className="block text-[10px] text-white/40 mb-1">Quick Position</label>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onUpdatePosition(fixture.id, { xFt: 0, yFt: 0 })}
            className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/20 transition-colors"
          >
            Origin
          </button>
          <button
            onClick={() => onUpdatePosition(fixture.id, { 
              xFt: shellBounds.lengthFt / 2, 
              yFt: shellBounds.widthFt / 2 
            })}
            className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/20 transition-colors"
          >
            Center
          </button>
          <button
            onClick={() => {
              // Snap to nearest 0.25ft (allows placing flush against walls)
              const snappedX = Math.round(fixture.xFt * 4) / 4;
              const snappedY = Math.round(fixture.yFt * 4) / 4;
              onUpdatePosition(fixture.id, { xFt: snappedX, yFt: snappedY });
            }}
            className="rounded bg-white/10 px-2 py-1 text-[10px] text-white/70 hover:bg-white/20 transition-colors"
          >
            Snap
          </button>
        </div>
      </div>
    </div>
  );
}






