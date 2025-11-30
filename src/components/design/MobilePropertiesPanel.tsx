"use client";

import type {
  DesignAction,
  DesignConfig,
  FixtureConfig,
  ModuleCatalogItem,
  ValidationIssue,
} from "@/types/design";
import { rectFromFixture } from "@/lib/design/geometry";

export type MobilePropertiesPanelProps = {
  design: DesignConfig;
  selectedFixture?: FixtureConfig;
  catalogItem?: ModuleCatalogItem;
  validationIssues: ValidationIssue[];
  dispatch: (action: DesignAction) => void;
  onSave: () => void;
  isSaving: boolean;
  onClose: () => void;
};

export function MobilePropertiesPanel({
  design,
  selectedFixture,
  catalogItem,
  validationIssues,
  dispatch,
  onSave,
  isSaving,
  onClose,
}: MobilePropertiesPanelProps) {
  const activeRect = selectedFixture && catalogItem
    ? rectFromFixture(selectedFixture, catalogItem)
    : null;

  const handlePositionChange = (field: "xFt" | "yFt", delta: number) => {
    if (!selectedFixture || !catalogItem || !activeRect) return;
    
    const newXFt = field === "xFt" ? selectedFixture.xFt + delta : selectedFixture.xFt;
    const newYFt = field === "yFt" ? selectedFixture.yFt + delta : selectedFixture.yFt;

    dispatch({
      type: "UPDATE_FIXTURE_POSITION",
      id: selectedFixture.id,
      xFt: newXFt,
      yFt: newYFt,
      fixtureWidth: activeRect.width,
      fixtureHeight: activeRect.height,
      footprintAnchor: catalogItem.footprintAnchor,
    });
  };

  const handleRotationChange = (rotationDeg: 0 | 90 | 180 | 270) => {
    if (!selectedFixture) return;
    dispatch({
      type: "UPDATE_FIXTURE_ROTATION",
      id: selectedFixture.id,
      rotationDeg,
    });
  };

  const handleRemove = () => {
    if (!selectedFixture) return;
    dispatch({ type: "REMOVE_FIXTURE", id: selectedFixture.id });
  };

  const selectedIssues = selectedFixture
    ? validationIssues.filter((i) => i.fixtureId === selectedFixture.id)
    : [];

  return (
    <div className="relative z-[60] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 border-b border-slate-700 shadow-2xl">
      {/* Header Row */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Properties
        </h3>

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white transition-all disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {selectedFixture && catalogItem ? (
        <div className="px-3 pb-3">
          {/* Fixture Info */}
          <div className="flex items-center gap-3 mb-3 bg-slate-800/60 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">
                {catalogItem.label}
              </div>
              <div className="text-[10px] text-slate-400">
                {activeRect ? `${activeRect.height.toFixed(1)}' × ${activeRect.width.toFixed(1)}'` : ""}
                {selectedFixture.rotationDeg !== 0 && ` • ${selectedFixture.rotationDeg}°`}
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="flex-shrink-0 px-2 py-1 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Remove
            </button>
          </div>

          {/* Position Controls - Horizontal */}
          <div className="flex gap-2 mb-3">
            {/* X Position */}
            <div className="flex-1 bg-slate-800/60 rounded-lg p-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                X Position
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange("xFt", -0.5)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1 text-center text-sm font-mono text-white">
                  {selectedFixture.xFt.toFixed(1)}'
                </div>
                <button
                  onClick={() => handlePositionChange("xFt", 0.5)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Y Position */}
            <div className="flex-1 bg-slate-800/60 rounded-lg p-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Y Position
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePositionChange("yFt", -0.5)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <div className="flex-1 text-center text-sm font-mono text-white">
                  {selectedFixture.yFt.toFixed(1)}'
                </div>
                <button
                  onClick={() => handlePositionChange("yFt", 0.5)}
                  className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Rotation Controls */}
          <div className="bg-slate-800/60 rounded-lg p-2">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Rotation
            </div>
            <div className="flex gap-1">
              {([0, 90, 180, 270] as const).map((deg) => (
                <button
                  key={deg}
                  onClick={() => handleRotationChange(deg)}
                  className={`flex-1 py-2 rounded text-xs font-semibold transition-all ${
                    selectedFixture.rotationDeg === deg
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Validation Issues */}
          {selectedIssues.length > 0 && (
            <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
              <div className="text-[10px] font-bold text-red-400 mb-1">Issues</div>
              <div className="space-y-1">
                {selectedIssues.map((issue) => (
                  <div key={issue.id} className="text-xs text-red-300">
                    • {issue.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Fixture Selected */
        <div className="px-3 pb-3">
          <div className="bg-slate-800/40 rounded-lg px-4 py-6 text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <div className="text-sm text-slate-400">
              No fixture selected
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Tap a fixture on the canvas to edit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

