"use client";

import { useState } from "react";
import type { DesignConfig, DesignAction } from "@/types/design";

export type MobileLayersPanelProps = {
  design: DesignConfig;
  dispatch: (action: DesignAction) => void;
  zoneEditMode?: boolean;
  onZoneEditModeChange?: (enabled: boolean) => void;
  selectedZoneId?: string;
  onClose: () => void;
};

export function MobileLayersPanel({
  design,
  dispatch,
  zoneEditMode = false,
  onZoneEditModeChange,
  selectedZoneId,
  onClose,
}: MobileLayersPanelProps) {
  const [showFixtures, setShowFixtures] = useState(false);

  const handleZoneSelect = (zoneId: string) => {
    if (zoneEditMode) {
      dispatch({ type: "SELECT_ZONE", id: zoneId });
    }
  };

  const toggleFixtureLock = (fixtureId: string) => {
    dispatch({ type: "TOGGLE_FIXTURE_LOCK", id: fixtureId });
  };

  return (
    <div className="relative z-[60] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 border-b border-slate-700 shadow-2xl">
      {/* Header Row */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Layers
        </h3>

        {/* Action Buttons */}
        <div className="flex-1 mx-3 flex items-center gap-2">
          {/* Zone Edit Toggle */}
          <button
            onClick={() => onZoneEditModeChange?.(!zoneEditMode)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              zoneEditMode
                ? "bg-amber-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {zoneEditMode ? "✓ Editing" : "Edit Zones"}
          </button>

          {/* Fixtures Toggle */}
          <button
            onClick={() => setShowFixtures(!showFixtures)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              showFixtures
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Fixtures ({design.fixtures.length})
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Zone Edit Mode Hint */}
      {zoneEditMode && (
        <div className="px-3 pb-1">
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-amber-300">
              Tap zones to select. Drag to move, drag edges to resize.
            </span>
          </div>
        </div>
      )}

      {/* Zones Carousel */}
      <div className="px-2 pb-2 pt-1 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2" style={{ minWidth: "max-content" }}>
          {design.zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => handleZoneSelect(zone.id)}
                className={`flex-shrink-0 min-w-[100px] rounded-xl p-2 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-amber-500 ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900"
                    : zoneEditMode
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-slate-800/60"
                }`}
              >
                {/* Zone Icon */}
                <div
                  className={`w-full aspect-[2/1] rounded-lg flex items-center justify-center mb-1.5 ${
                    isSelected
                      ? "bg-amber-600"
                      : "bg-gradient-to-br from-emerald-600 to-teal-700"
                  }`}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>
                </div>

                {/* Zone Name */}
                <div
                  className={`text-[10px] font-semibold leading-tight truncate ${
                    isSelected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {zone.name}
                </div>

                {/* Zone Dimensions */}
                <div
                  className={`text-[9px] ${
                    isSelected ? "text-amber-200" : "text-slate-500"
                  }`}
                >
                  {zone.lengthFt}' × {zone.widthFt}'
                </div>
              </button>
            );
          })}

          {/* Add Zone Button (only in edit mode) */}
          {zoneEditMode && (
            <button
              onClick={() => {
                const lastZone = design.zones[design.zones.length - 1];
                const newXFt = lastZone ? lastZone.xFt + lastZone.lengthFt : 0;
                const availableLength = design.shell.lengthFt - newXFt;
                const actualLength = Math.min(8, Math.max(2, availableLength));
                if (actualLength >= 2) {
                  dispatch({
                    type: "ADD_ZONE",
                    name: `Zone ${design.zones.length + 1}`,
                    xFt: newXFt,
                    yFt: 0,
                    lengthFt: actualLength,
                    widthFt: design.shell.widthFt,
                  });
                }
              }}
              className="flex-shrink-0 min-w-[100px] rounded-xl p-2 border-2 border-dashed border-amber-500/50 hover:border-amber-400 transition-all active:scale-95"
            >
              <div className="w-full aspect-[2/1] rounded-lg flex items-center justify-center mb-1.5 bg-amber-500/20">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-[10px] font-semibold text-amber-400 text-center">
                Add Zone
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Fixtures Section (collapsible) */}
      {showFixtures && (
        <div className="px-2 pb-3 border-t border-slate-700/50">
          <div className="pt-2 max-h-[200px] overflow-y-auto scrollbar-hide">
            {design.fixtures.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">
                No fixtures added yet
              </div>
            ) : (
              <div className="space-y-1">
                {design.fixtures.map((fixture) => (
                  <div
                    key={fixture.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      fixture.locked
                        ? "bg-amber-500/20 border border-amber-500/30"
                        : "bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Lock Toggle */}
                      <button
                        onClick={() => toggleFixtureLock(fixture.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-colors ${
                          fixture.locked
                            ? "text-amber-400 bg-amber-500/30"
                            : "text-slate-500 hover:text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {fixture.locked ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        )}
                      </button>

                      {/* Fixture Name */}
                      <button
                        onClick={() => dispatch({ type: "SELECT_FIXTURE", id: fixture.id })}
                        className={`truncate text-sm font-medium text-left ${
                          fixture.locked ? "text-amber-300" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {fixture.name || fixture.catalogKey}
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => dispatch({ type: "REMOVE_FIXTURE", id: fixture.id })}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

