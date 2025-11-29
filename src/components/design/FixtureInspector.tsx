"use client";

import type {
  DesignAction,
  FixtureConfig,
  ModuleCatalogItem,
  ValidationIssue,
  WallMaterial,
} from "@/types/design";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { rectFromFixture } from "@/lib/design/geometry";

const WALL_MATERIALS: { value: WallMaterial; label: string }[] = [
  { value: "drywall", label: "Drywall" },
  { value: "plywood", label: "Plywood" },
  { value: "wood", label: "Wood" },
  { value: "steel", label: "Steel" },
];

export type FixtureInspectorProps = {
  fixture: FixtureConfig;
  catalogItem: ModuleCatalogItem;
  validationIssues: ValidationIssue[];
  dispatch: (action: DesignAction) => void;
  shellLength: number;
  shellWidth: number;
};

export function FixtureInspector({
  fixture,
  catalogItem,
  validationIssues,
  dispatch,
  shellLength,
  shellWidth,
}: FixtureInspectorProps) {
  const overrides =
    (fixture.properties as {
      lengthOverrideFt?: number;
      widthOverrideFt?: number;
      material?: WallMaterial;
      transparent3D?: boolean;
    }) ?? {};
  const activeRect = rectFromFixture(fixture, catalogItem);
  
  // Check if this is a wall fixture (for special wall controls)
  const isWall = catalogItem.key === "fixture-wall" || catalogItem.key.includes("wall");
  
  // Wall-specific property handlers
  const handleMaterialChange = (material: WallMaterial) => {
    dispatch({
      type: "UPDATE_FIXTURE_PROPERTIES",
      id: fixture.id,
      properties: { material },
    });
  };
  
  const handleTransparent3DChange = (transparent3D: boolean) => {
    dispatch({
      type: "UPDATE_FIXTURE_PROPERTIES",
      id: fixture.id,
      properties: { transparent3D },
    });
  };

  const handlePositionChange = (field: "xFt" | "yFt", value: number) => {
    const newXFt = field === "xFt" ? value : fixture.xFt;
    const newYFt = field === "yFt" ? value : fixture.yFt;

    dispatch({
      type: "UPDATE_FIXTURE_POSITION",
      id: fixture.id,
      xFt: newXFt,
      yFt: newYFt,
      fixtureWidth: activeRect.width,
      fixtureHeight: activeRect.height,
      footprintAnchor: catalogItem.footprintAnchor,
    });
  };

  const handleRotationChange = (rotationDeg: 0 | 90 | 180 | 270) => {
    dispatch({
      type: "UPDATE_FIXTURE_ROTATION",
      id: fixture.id,
      rotationDeg,
    });
  };

  const handleSizeChange = (field: "length" | "width", value: number) => {
    dispatch({
      type: "UPDATE_FIXTURE_SIZE",
      id: fixture.id,
      lengthFt: field === "length" ? value : undefined,
      widthFt: field === "width" ? value : undefined,
    });
  };

  const handleRemove = () => {
    dispatch({ type: "REMOVE_FIXTURE", id: fixture.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground/60">
          Fixture Inspector
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleRemove}
          className="text-red-600"
        >
          Remove
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-surface-muted/80 p-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {catalogItem.label}
          </p>
          <p className="text-xs text-foreground/60">{catalogItem.category}</p>
        </div>

        {catalogItem.requiresUtilities &&
          catalogItem.requiresUtilities.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-foreground/60">
                Utilities Required
              </p>
              <div className="flex flex-wrap gap-1">
                {catalogItem.requiresUtilities.map((util) => (
                  <span
                    key={util}
                    className="rounded bg-forest/10 px-2 py-1 text-xs text-forest"
                  >
                    {util}
                  </span>
                ))}
              </div>
            </div>
          )}

        <div>
          <p className="mb-1 text-xs font-semibold text-foreground/60">
            Dimensions
          </p>
          <p className="text-xs text-foreground/70">
            {activeRect.height.toFixed(1)}' × {activeRect.width.toFixed(1)}'
            {fixture.rotationDeg !== 0 && ` (rotated ${fixture.rotationDeg}°)`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
            Position X (ft)
          </label>
          <Input
            type="number"
            step={0.5}
            min={0}
            max={shellLength}
            value={fixture.xFt.toFixed(1)}
            onChange={(e) =>
              handlePositionChange("xFt", parseFloat(e.target.value) || 0)
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
            Position Y (ft)
          </label>
          <Input
            type="number"
            step={0.5}
            min={0}
            max={shellWidth}
            value={fixture.yFt.toFixed(1)}
            onChange={(e) =>
              handlePositionChange("yFt", parseFloat(e.target.value) || 0)
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
            Rotation
          </label>
          <div className="flex gap-2">
            {([0, 90, 180, 270] as const).map((deg) => (
              <Button
                key={deg}
                type="button"
                size="sm"
                variant={fixture.rotationDeg === deg ? "primary" : "outline"}
                onClick={() => handleRotationChange(deg)}
                className="flex-1"
              >
                {deg}°
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isWall ? (
        /* Wall-specific controls */
        <div className="space-y-3 rounded-xl border border-cyan-200 bg-cyan-50/50 p-3">
          <p className="text-xs font-semibold text-cyan-800">Wall Settings</p>
          
          {/* Wall Length */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Wall Length (ft)
            </label>
            <Input
              type="number"
              min={1}
              max={Math.max(shellLength, shellWidth)}
              step={0.5}
              value={(overrides.lengthOverrideFt ?? catalogItem.footprintFt.length).toString()}
              onChange={(e) => handleSizeChange("length", parseFloat(e.target.value) || catalogItem.footprintFt.length)}
            />
            <p className="text-xs text-foreground/50">
              Rotate 90° to change wall orientation
            </p>
          </div>
          
          {/* Material Type */}
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Material
            </label>
            <select
              className="w-full rounded-lg border border-surface-muted/60 bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              value={overrides.material ?? "drywall"}
              onChange={(e) => handleMaterialChange(e.target.value as WallMaterial)}
            >
              {WALL_MATERIALS.map((mat) => (
                <option key={mat.value} value={mat.value}>
                  {mat.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Semi-Transparent (3D View) */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="transparent3D"
              checked={overrides.transparent3D ?? false}
              onChange={(e) => handleTransparent3DChange(e.target.checked)}
              className="h-4 w-4 rounded border-surface-muted/60 text-forest focus:ring-forest"
            />
            <label htmlFor="transparent3D" className="text-xs text-foreground/70">
              Semi-transparent (3D view only)
            </label>
          </div>
        </div>
      ) : (
        /* Standard fixture size overrides */
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Length override (ft)
            </label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={(overrides.lengthOverrideFt ?? catalogItem.footprintFt.length).toString()}
              onChange={(e) => handleSizeChange("length", parseFloat(e.target.value) || catalogItem.footprintFt.length)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
              Width override (ft)
            </label>
            <Input
              type="number"
              min={1}
              step={0.5}
              value={(overrides.widthOverrideFt ?? catalogItem.footprintFt.width).toString()}
              onChange={(e) => handleSizeChange("width", parseFloat(e.target.value) || catalogItem.footprintFt.width)}
            />
          </div>
        </div>
      )}

      {validationIssues.length > 0 && (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold text-red-800">Validation Issues</p>
          <ul className="space-y-1 text-xs text-red-700">
            {validationIssues.map((issue) => (
              <li key={issue.id}>• {issue.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

