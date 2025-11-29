"use client";

import { useState, useRef, useEffect } from "react";
import type { DesignConfig, DesignAction } from "@/types/design";

export type LayersPanelProps = {
  design: DesignConfig;
  dispatch: (action: DesignAction) => void;
  zoneEditMode?: boolean;
  onZoneEditModeChange?: (enabled: boolean) => void;
  selectedZoneId?: string;
};

export function LayersPanel({ 
  design, 
  dispatch,
  zoneEditMode = false,
  onZoneEditModeChange,
  selectedZoneId,
}: LayersPanelProps) {
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus the name input when editing starts
  useEffect(() => {
    if (editingZoneId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingZoneId]);

  const startEditingName = (zone: { id: string; name: string }) => {
    setEditingZoneId(zone.id);
    setEditingName(zone.name);
  };

  const saveZoneName = () => {
    if (editingZoneId && editingName.trim()) {
      dispatch({ type: "RENAME_ZONE", id: editingZoneId, name: editingName.trim() });
    }
    setEditingZoneId(null);
    setEditingName("");
  };

  const cancelEditing = () => {
    setEditingZoneId(null);
    setEditingName("");
  };

  const handleAddZone = () => {
    // Calculate position for new zone (at the end of existing zones)
    const lastZone = design.zones[design.zones.length - 1];
    const newXFt = lastZone ? lastZone.xFt + lastZone.lengthFt : 0;
    const defaultLength = 8;
    
    // Make sure it fits within the shell
    const availableLength = design.shell.lengthFt - newXFt;
    const actualLength = Math.min(defaultLength, Math.max(2, availableLength));
    
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
  };

  const toggleFixtureLock = (fixtureId: string) => {
    dispatch({ type: "TOGGLE_FIXTURE_LOCK", id: fixtureId });
  };

  return (
    <div className="space-y-4">
      {/* Zones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
            Zones
          </h3>
          <button
            onClick={() => onZoneEditModeChange?.(!zoneEditMode)}
            className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
              zoneEditMode
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-surface text-foreground/60 hover:bg-surface-muted hover:text-foreground"
            }`}
            title={zoneEditMode ? "Exit zone edit mode" : "Edit zones"}
          >
            {zoneEditMode ? "✓ Editing" : "Edit Zones"}
          </button>
        </div>
        
        {zoneEditMode && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              <span className="font-semibold">Zone Edit Mode:</span> Click zones to select. 
              Drag to move, drag edges to resize. Double-click name to edit.
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          {design.zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const isEditing = editingZoneId === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => zoneEditMode && dispatch({ type: "SELECT_ZONE", id: zone.id })}
                className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all ${
                  zoneEditMode ? "cursor-pointer" : ""
                } ${
                  isSelected 
                    ? "border-amber-500 bg-amber-50 shadow-sm" 
                    : "border-surface-muted/60 bg-white hover:border-forest hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg className={`flex-shrink-0 w-4 h-4 ${isSelected ? "text-amber-500" : "text-forest"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                  </svg>

                  {isEditing ? (
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={saveZoneName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveZoneName();
                        if (e.key === "Escape") cancelEditing();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 text-sm font-semibold bg-white border border-amber-400 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        if (zoneEditMode) {
                          e.stopPropagation();
                          startEditingName(zone);
                        }
                      }}
                      className={`flex-1 min-w-0 truncate text-sm font-semibold ${isSelected ? "text-amber-700" : "text-foreground"} ${
                        zoneEditMode ? "cursor-text hover:bg-amber-100/50 rounded px-1 -mx-1" : ""
                      }`}
                      title={zoneEditMode ? "Double-click to edit name" : zone.name}
                    >
                      {zone.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    isSelected ? "bg-amber-100 text-amber-700" : "bg-surface text-foreground/60"
                  }`}>
                    {zone.lengthFt}' × {zone.widthFt}'
                  </span>
                  
                  {zoneEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete zone "${zone.name}"?`)) {
                          dispatch({ type: "REMOVE_ZONE", id: zone.id });
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                      title="Delete zone"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Add Zone button - only show in edit mode */}
          {zoneEditMode && (
            <button
              onClick={handleAddZone}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-amber-300 rounded-lg text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-semibold">Add Zone</span>
            </button>
          )}
        </div>
      </div>

      {/* Fixtures */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Fixtures ({design.fixtures.length})
        </h3>
        <div className="max-h-[400px] space-y-1 overflow-y-auto">
          {design.fixtures.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground/60">
              No fixtures added yet
            </p>
          ) : (
            design.fixtures.map((fixture) => (
              <div
                key={fixture.id}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  fixture.locked 
                    ? "border-amber-300 bg-amber-50" 
                    : "border-surface-muted/60 bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFixtureLock(fixture.id)}
                    className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                      fixture.locked
                        ? "text-amber-600 bg-amber-100 hover:bg-amber-200"
                        : "text-foreground/40 hover:bg-surface hover:text-foreground/60"
                    }`}
                    title={fixture.locked ? "Unlock fixture" : "Lock fixture"}
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
                  <button
                    onClick={() => dispatch({ type: "SELECT_FIXTURE", id: fixture.id })}
                    className={`min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-forest ${
                      fixture.locked ? "text-amber-700" : "text-foreground"
                    }`}
                  >
                    {fixture.name || fixture.catalogKey}
                  </button>
                </div>
                <button
                  onClick={() => dispatch({ type: "REMOVE_FIXTURE", id: fixture.id })}
                  className="text-sm text-red-600 hover:text-red-700"
                  title="Remove fixture"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
