"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  DesignConfig,
  DesignEditorState,
  ModuleCatalogEntry,
  ModuleCatalogItem,
} from "@/types/design";
import type { BOMSelections } from "@/types/bom";
import { DEFAULT_BOM_SELECTIONS } from "@/types/bom";
import { useToast } from "@/components/providers/ToastProvider";
import { FixtureCanvas } from "./FixtureCanvas";
import { FixtureLibrary } from "./FixtureLibrary";
import { FixtureInspector } from "./FixtureInspector";
import { LayersPanel } from "./LayersPanel";
import { Toolbar, ToolType } from "./Toolbar";
import { StatusBar } from "./StatusBar";
import { DockablePanel } from "./DockablePanel";
import { MobilePanelMenu, PanelConfig } from "./MobilePanelMenu";
import { MobileFixtureCarousel } from "./MobileFixtureCarousel";
import { MobileLayersPanel } from "./MobileLayersPanel";
import { MobilePropertiesPanel } from "./MobilePropertiesPanel";
import { HelpOverlay } from "./HelpOverlay";
import { ThreeViewport } from "./ThreeViewport";
import { DebugPanel, DebugLog } from "./DebugPanel";
import { BOMPanel } from "./BOMPanel";
import { AuthModal } from "./AuthModal";
import { SaveConfirmModal } from "./SaveConfirmModal";
import { LeaveConfirmModal } from "./LeaveConfirmModal";
import { designEditorReducer } from "@/lib/design/editor-reducer";
import { generatePDF } from "@/lib/design/pdf-export";
import { entriesToCatalogMap } from "@/lib/design/catalog-utils";
import { validateDesign } from "@/lib/design/validation";
import { priceDesign } from "@/lib/design/pricing";
import { rectFromFixture } from "@/lib/design/geometry";
import { Button } from "@/components/ui/Button";

export type DesignStudioProps = {
  modules: ModuleCatalogEntry[];
  userEmail?: string | null;
  initialDesign: DesignConfig;
  initialDesignName?: string | null;
  designId?: string | null;
  initialBomSelections?: BOMSelections | null;
};

export function DesignStudio({
  modules,
  userEmail,
  initialDesign,
  initialDesignName,
  designId,
  initialBomSelections,
}: DesignStudioProps) {
  const [designName, setDesignName] = useState(
    initialDesignName ?? "Untitled Design"
  );
  const [currentDesignId, setCurrentDesignId] = useState(designId);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [zoneEditMode, setZoneEditMode] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [pendingPlacement, setPendingPlacement] = useState<ModuleCatalogItem | null>(null);
  const [pendingPlacementRotation, setPendingPlacementRotation] = useState<0 | 90 | 180 | 270>(0);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [bomSelections, setBomSelections] = useState<BOMSelections>(
    initialBomSelections ?? DEFAULT_BOM_SELECTIONS
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState(false);
  const [pendingSubmitAfterSave, setPendingSubmitAfterSave] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(userEmail);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [activeMobilePanel, setActiveMobilePanel] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  // Detect mobile for carousel vs panel
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show help overlay for non-signed-in users on first visit (mobile or desktop)
  useEffect(() => {
    if (currentUserEmail) return; // Don't show for signed-in users
    
    // Check if user has dismissed the help before (separate keys for mobile/desktop)
    const storageKey = isMobile ? "mobileHelpDismissed" : "desktopHelpDismissed";
    const helpDismissed = localStorage.getItem(storageKey);
    if (!helpDismissed) {
      setShowHelp(true);
    }
  }, [isMobile, currentUserEmail]);

  // Handler to dismiss help and remember the preference
  const handleDismissHelp = useCallback(() => {
    setShowHelp(false);
    const storageKey = isMobile ? "mobileHelpDismissed" : "desktopHelpDismissed";
    localStorage.setItem(storageKey, "true");
  }, [isMobile]);

  // Handler to show help again (from toolbar button)
  const handleShowHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  // Warn user before page refresh/close to prevent losing unsaved changes
  // Note: Mobile Safari does not support beforeunload - this is a browser limitation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Setting returnValue is required for Chrome/Edge compatibility
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
  
  // Mobile panel configurations
  const mobilePanelConfigs: PanelConfig[] = [
    {
      id: "fixture-library",
      title: "Fixture Library",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "properties",
      title: "Properties",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "bom",
      title: "Quote & Order",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "layers",
      title: "Layers",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
  ];

  // Debug logging function
  const addDebugLog = useCallback((type: DebugLog["type"], message: string, data?: Record<string, unknown>) => {
    if (!debugEnabled) return;
    setDebugLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), type, message, data },
    ].slice(-500)); // Keep last 500 logs
  }, [debugEnabled]);

  const clearDebugLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  const catalog = useMemo(() => entriesToCatalogMap(modules), [modules]);

  const [editorState, dispatch] = useReducer(
    designEditorReducer,
    {
      design: initialDesign,
      primarySelectedId: undefined,
      selectedIds: [],
      history: [],
      future: [],
      viewport: { scale: 1, offsetX: 0, offsetY: 0 },
      snapIncrement: 0.25, // 0.25ft allows placing 0.5ft-deep fixtures flush against walls
    } as DesignEditorState
  );

  const { design } = editorState;

  const validationIssues = useMemo(
    () => validateDesign(design, catalog),
    [design, catalog]
  );

  const priceSummary = useMemo(
    () => priceDesign(design, catalog),
    [design, catalog]
  );

  const selectedFixture = design.fixtures.find(
    (f) => f.id === editorState.primarySelectedId
  );
  const selectedCatalogItem = selectedFixture
    ? catalog[selectedFixture.catalogKey]
    : undefined;
  const selectedFixtureIssues = selectedFixture
    ? validationIssues.filter((i) => i.fixtureId === selectedFixture.id)
    : [];

  const handleAddFixture = useCallback(
    (item: any) => {
      const defaultZone = design.zones[0];
      let xFt = design.shell.lengthFt / 2;
      let yFt = design.shell.widthFt / 2;
      if (defaultZone) {
        xFt = defaultZone.xFt + defaultZone.lengthFt / 2;
        yFt = defaultZone.yFt + defaultZone.widthFt / 2;
      }
      dispatch({
        type: "ADD_FIXTURE",
        catalogKey: item.key,
        zoneId: defaultZone?.id,
        xFt,
        yFt,
      });
    },
    [design.shell, design.zones]
  );

  // Toggle placement mode for a fixture from the library
  const handleSetPendingPlacement = useCallback((item: ModuleCatalogItem | null) => {
    // If clicking the same item, toggle off
    if (item && pendingPlacement?.key === item.key) {
      setPendingPlacement(null);
    } else {
      setPendingPlacement(item);
    }
  }, [pendingPlacement]);

  // Place fixture at specific coordinates and clear pending state
  const handlePlaceFixture = useCallback((catalogKey: string, coords: { xFt: number; yFt: number }) => {
    const zoneId = design.zones.find(
      (zone) =>
        coords.xFt >= zone.xFt &&
        coords.xFt <= zone.xFt + zone.lengthFt &&
        coords.yFt >= zone.yFt &&
        coords.yFt <= zone.yFt + zone.widthFt
    )?.id;
    dispatch({
      type: "ADD_FIXTURE",
      catalogKey,
      zoneId,
      xFt: coords.xFt,
      yFt: coords.yFt,
      rotationDeg: pendingPlacementRotation,
    });
    setPendingPlacement(null);
    setPendingPlacementRotation(0);
  }, [design.zones, pendingPlacementRotation]);

  const handleUndo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const handleDelete = useCallback(() => {
    // Delete all selected fixtures
    editorState.selectedIds.forEach((id) => {
      dispatch({ type: "REMOVE_FIXTURE", id });
    });
  }, [editorState.selectedIds]);

  const handleRotate = useCallback(() => {
    // Rotate all selected fixtures by 90 degrees
    editorState.selectedIds.forEach((id) => {
      const fixture = design.fixtures.find((f) => f.id === id);
      if (fixture) {
        const newRotation = ((fixture.rotationDeg || 0) + 90) % 360 as 0 | 90 | 180 | 270;
        dispatch({ type: "UPDATE_FIXTURE_ROTATION", id, rotationDeg: newRotation });
      }
    });
  }, [editorState.selectedIds, design.fixtures]);

  // Track the "anchor" fixture for Tab cycling (the fixture we started cycling from)
  const [tabCycleAnchorId, setTabCycleAnchorId] = useState<string | null>(null);
  const [tabCycleIndex, setTabCycleIndex] = useState(0);

  // Reset cycle anchor when selection changes via click (not Tab)
  useEffect(() => {
    // If selection changed and it's not from cycling, reset the anchor
    if (editorState.primarySelectedId !== tabCycleAnchorId) {
      setTabCycleAnchorId(null);
      setTabCycleIndex(0);
    }
  }, [editorState.primarySelectedId, tabCycleAnchorId]);

  // Tab cycling through nearby fixtures - sorted by distance from anchor fixture
  const handleTabCycle = useCallback((reverse: boolean) => {
    const fixtures = design.fixtures;
    if (fixtures.length === 0) return;

    const currentId = editorState.primarySelectedId;

    // If nothing selected, select the first fixture (sorted by position)
    if (!currentId) {
      const sortedByPosition = [...fixtures].sort((a, b) => {
        const yDiff = a.yFt - b.yFt;
        if (Math.abs(yDiff) > 1) return yDiff;
        return a.xFt - b.xFt;
      });
      dispatch({ type: "SELECT_FIXTURE", id: sortedByPosition[0].id });
      setTabCycleAnchorId(sortedByPosition[0].id);
      setTabCycleIndex(0);
      return;
    }

    // Determine the anchor fixture (where we started cycling from)
    const anchorId = tabCycleAnchorId || currentId;
    const anchorFixture = fixtures.find(f => f.id === anchorId);

    if (!anchorFixture) {
      dispatch({ type: "SELECT_FIXTURE", id: fixtures[0].id });
      return;
    }

    // Sort all fixtures by distance from the anchor
    const sortedByDistance = [...fixtures]
      .map(f => ({
        fixture: f,
        distance: Math.sqrt(
          Math.pow(f.xFt - anchorFixture.xFt, 2) +
          Math.pow(f.yFt - anchorFixture.yFt, 2)
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.fixture);

    // If this is a new cycle (anchor not set), start from the current fixture
    if (!tabCycleAnchorId) {
      setTabCycleAnchorId(currentId);
      // Current fixture is at index 0 (distance 0), so next is index 1
      const nextIndex = reverse ? sortedByDistance.length - 1 : 1;
      if (sortedByDistance[nextIndex]) {
        dispatch({ type: "SELECT_FIXTURE", id: sortedByDistance[nextIndex].id });
        setTabCycleIndex(nextIndex);
      }
      return;
    }

    // Continue cycling from current position
    const newIndex = reverse
      ? (tabCycleIndex - 1 + sortedByDistance.length) % sortedByDistance.length
      : (tabCycleIndex + 1) % sortedByDistance.length;

    dispatch({ type: "SELECT_FIXTURE", id: sortedByDistance[newIndex].id });
    setTabCycleIndex(newIndex);
  }, [design.fixtures, editorState.primarySelectedId, tabCycleAnchorId, tabCycleIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug log ALL keyboard events when debug is enabled
      addDebugLog("info", `KeyDown: ${e.key}`, {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        target: (e.target as HTMLElement).tagName,
        targetId: (e.target as HTMLElement).id || "none",
      });

      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        addDebugLog("info", "KeyDown ignored - input field focused");
        return;
      }

      // Tab = Cycle to next nearby fixture, Shift+Tab = Cycle backwards
      if (e.key === "Tab") {
        e.preventDefault();
        handleTabCycle(e.shiftKey);
        return;
      }

      // Ctrl+Z / Cmd+Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        addDebugLog("action", "Ctrl+Z detected - calling handleUndo");
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z = Redo
      // Ctrl+Y / Cmd+Y = Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        addDebugLog("action", "Ctrl+Y/Ctrl+Shift+Z detected - calling handleRedo");
        e.preventDefault();
        handleRedo();
        return;
      }

      // Escape = Cancel placement mode, wall drawing, annotation editing, or deselect
      if (e.key === "Escape") {
        e.preventDefault();
        if (editingAnnotationId) {
          setEditingAnnotationId(null);
        } else if (pendingPlacement) {
          setPendingPlacement(null);
          setPendingPlacementRotation(0);
        } else if (editorState.wallDraw) {
          dispatch({ type: "CANCEL_WALL_DRAW" });
        } else if (editorState.selectedAnnotationId) {
          dispatch({ type: "SELECT_ANNOTATION", id: undefined });
        } else {
          dispatch({ type: "CLEAR_SELECTION" });
          setActiveTool("select");
        }
        return;
      }

      // Tool shortcuts
      if (e.key === "v" || e.key === "V") {
        setActiveTool("select");
        return;
      }
      if (e.key === "h" || e.key === "H") {
        setActiveTool("pan");
        return;
      }
      if (e.key === "w" || e.key === "W") {
        setActiveTool("wall");
        return;
      }
      if (e.key === "m" || e.key === "M") {
        setActiveTool("measure");
        return;
      }
      if (e.key === "a" || e.key === "A") {
        setActiveTool("annotate");
        return;
      }

      // Delete/Backspace = Remove selected fixture(s) or annotation
      if (e.key === "Delete" || e.key === "Backspace") {
        if (editorState.selectedAnnotationId) {
          e.preventDefault();
          dispatch({ type: "REMOVE_ANNOTATION", id: editorState.selectedAnnotationId });
          return;
        }
        if (editorState.selectedIds.length > 0) {
          e.preventDefault();
          editorState.selectedIds.forEach(id => {
            dispatch({ type: "REMOVE_FIXTURE", id });
          });
          return;
        }
      }

      // Arrow keys = Move selected fixtures (2D view only, 3D has its own handler)
      if (viewMode === "2d" && editorState.selectedIds.length > 0 &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();

        const increment = editorState.snapIncrement; // Use the current snap increment
        let deltaX = 0;
        let deltaY = 0;

        // In 2D plan view: X is horizontal (left/right), Y is vertical
        // Note: In SVG/screen coords, Y increases downward, so:
        // - ArrowUp = decrease Y (move visually up)
        // - ArrowDown = increase Y (move visually down)
        if (e.key === "ArrowLeft") deltaX = -increment;
        if (e.key === "ArrowRight") deltaX = increment;
        if (e.key === "ArrowUp") deltaY = -increment;   // Move up on screen (decrease Y)
        if (e.key === "ArrowDown") deltaY = increment;  // Move down on screen (increase Y)

        // Move each selected fixture
        editorState.selectedIds.forEach(fixtureId => {
          const fixture = design.fixtures.find(f => f.id === fixtureId);
          if (!fixture || fixture.locked) return;

          const catalogItem = catalog[fixture.catalogKey];
          if (!catalogItem) return;

          // Get fixture dimensions for proper clamping
          const rect = rectFromFixture(fixture, catalogItem);

          dispatch({
            type: "UPDATE_FIXTURE_POSITION",
            id: fixtureId,
            xFt: fixture.xFt + deltaX,
            yFt: fixture.yFt + deltaY,
            fixtureWidth: rect.width,
            fixtureHeight: rect.height,
            footprintAnchor: "center",
          });
        });
        return;
      }

      // R = Rotate pending placement by 90 degrees
      if ((e.key === "r" || e.key === "R") && pendingPlacement) {
        e.preventDefault();
        setPendingPlacementRotation(prev => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
        return;
      }

      // R = Rotate selected fixture(s) by 90 degrees
      if ((e.key === "r" || e.key === "R") && editorState.selectedIds.length > 0) {
        e.preventDefault();
        editorState.selectedIds.forEach(fixtureId => {
          const fixture = design.fixtures.find(f => f.id === fixtureId);
          if (!fixture || fixture.locked) return;

          // Cycle through 0, 90, 180, 270
          const currentRotation = fixture.rotationDeg || 0;
          const newRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;

          dispatch({
            type: "UPDATE_FIXTURE_ROTATION",
            id: fixtureId,
            rotationDeg: newRotation,
          });
        });
        return;
      }
    };

    // Use capture: true to catch events before they're consumed by browser/extensions
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [handleUndo, handleRedo, handleTabCycle, editorState.selectedIds, editorState.selectedAnnotationId, editorState.snapIncrement, editorState.wallDraw, viewMode, design.fixtures, catalog, addDebugLog, pendingPlacement, editingAnnotationId]);

  const handleSaveDesign = async () => {
    // Show auth modal if user is not logged in
    if (!currentUserEmail) {
      setShowAuthModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        currentDesignId ? `/api/designs/${currentDesignId}` : "/api/designs",
        {
          method: currentDesignId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: designName,
            configJson: design,
            bomSelectionsJson: bomSelections,
            priceCents: priceSummary.subtotalCents,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save design");

      const data = await response.json();
      if (!currentDesignId && data.design?.id) {
        setCurrentDesignId(data.design.id);
        router.push(`/design?id=${data.design.id}`);
      }

      showToast({ variant: "success", title: "Design saved", description: "Your design has been saved successfully." });
    } catch (error) {
      console.error("Save error:", error);
      showToast({ variant: "error", title: "Save failed", description: "Failed to save design. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle successful authentication - auto-save the design
  const handleAuthSuccess = async (email: string) => {
    setCurrentUserEmail(email);
    setShowAuthModal(false);
    
    const shouldSubmitAfterSave = pendingSubmitAfterSave;
    setPendingSubmitAfterSave(false);
    
    // Auto-save after successful auth
    setIsSaving(true);
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: designName,
          configJson: design,
          bomSelectionsJson: bomSelections,
          priceCents: priceSummary.subtotalCents,
        }),
      });

      if (!response.ok) throw new Error("Failed to save design");

      const data = await response.json();
      if (data.design?.id) {
        setCurrentDesignId(data.design.id);
        router.push(`/design?id=${data.design.id}`);
      }

      showToast({ variant: "success", title: "Design saved", description: "Your design has been saved successfully." });

      // If there was a pending submission, submit the proposal now
      if (shouldSubmitAfterSave && data.design?.id) {
        setIsSubmittingProposal(true);
        try {
          const submitResponse = await fetch(`/api/designs/${data.design.id}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!submitResponse.ok) {
            throw new Error("Failed to submit proposal");
          }

          showToast({ 
            variant: "success", 
            title: "Proposal submitted!", 
            description: "Our team will review your design and contact you shortly." 
          });
        } catch (submitError) {
          console.error("Submit error:", submitError);
          showToast({ variant: "error", title: "Submission failed", description: "Design saved, but submission failed. Please try again." });
        } finally {
          setIsSubmittingProposal(false);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast({ variant: "error", title: "Save failed", description: "Failed to save design. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportTemplate = () => {
    // Group fixtures by zone
    const zoneFixtures: Record<string, any[]> = {};
    const shellFixtures: any[] = []; // Fixtures without a zone (exterior doors, windows, etc.)

    design.zones.forEach((zone) => {
      zoneFixtures[zone.id] = [];
    });

    design.fixtures.forEach((fixture) => {
      const zone = design.zones.find((z) => z.id === fixture.zone);

      const exportedFixture: Record<string, unknown> = {
        id: fixture.id,
        catalogKey: fixture.catalogKey,
        xFt: zone ? fixture.xFt - zone.xFt : fixture.xFt, // Relative to zone, or absolute if no zone
        yFt: zone ? fixture.yFt - zone.yFt : fixture.yFt,
        rotationDeg: fixture.rotationDeg,
      };

      // Include properties if they exist (e.g., lengthOverrideFt for walls)
      if (fixture.properties && Object.keys(fixture.properties).length > 0) {
        exportedFixture.properties = fixture.properties;
      }

      if (zone) {
        zoneFixtures[zone.id].push(exportedFixture);
      } else {
        // Capture unzoned fixtures (exterior doors, windows on shell, etc.)
        shellFixtures.push(exportedFixture);
      }
    });

    const exportData: Record<string, unknown> = {
      shell: design.shell,
      zones: design.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        xFt: zone.xFt,
        yFt: zone.yFt,
        lengthFt: zone.lengthFt,
        widthFt: zone.widthFt,
        fixtures: zoneFixtures[zone.id] || [],
      })),
    };

    // Include shell fixtures if any exist (exterior doors, windows, etc.)
    if (shellFixtures.length > 0) {
      exportData.shellFixtures = shellFixtures;
    }

    const json = JSON.stringify(exportData, null, 2);
    navigator.clipboard.writeText(json);

    const shellMsg = shellFixtures.length > 0 ? `, ${shellFixtures.length} shell fixtures` : "";
    showToast({ variant: "success", title: "Template exported!", description: `${design.zones.length} zones, ${design.fixtures.length} fixtures${shellMsg}` });

    // Also log to console for easy viewing
    console.log("=== EXPORTED TEMPLATE ===");
    console.log(json);
    console.log("=========================");
  };

  // Handle Submit for Proposal
  const handleSubmitProposal = async () => {
    // If design is not saved, show save confirmation modal
    if (!currentDesignId) {
      setShowSaveConfirmModal(true);
      return;
    }

    // Design is saved, proceed with submission
    setIsSubmittingProposal(true);
    try {
      // First, save the latest changes
      await fetch(`/api/designs/${currentDesignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: designName,
          configJson: design,
          bomSelectionsJson: bomSelections,
          priceCents: priceSummary.subtotalCents,
        }),
      });

      // Then submit for proposal
      const response = await fetch(`/api/designs/${currentDesignId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to submit proposal");
      }

      showToast({ 
        variant: "success", 
        title: "Proposal submitted!", 
        description: "Our team will review your design and contact you shortly." 
      });
    } catch (error) {
      console.error("Submit error:", error);
      showToast({ variant: "error", title: "Submission failed", description: "Please try again or contact support." });
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  // Handle save confirmation from SaveConfirmModal
  const handleSaveConfirm = async () => {
    // If not logged in, show auth modal (which will auto-save after login)
    if (!currentUserEmail) {
      setPendingSubmitAfterSave(true);
      setShowSaveConfirmModal(false);
      setShowAuthModal(true);
      return;
    }

    // User is logged in, save the design and then submit
    setIsSaving(true);
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: designName,
          configJson: design,
          bomSelectionsJson: bomSelections,
          priceCents: priceSummary.subtotalCents,
        }),
      });

      if (!response.ok) throw new Error("Failed to save design");

      const data = await response.json();
      if (data.design?.id) {
        setCurrentDesignId(data.design.id);
        router.push(`/design?id=${data.design.id}`);
        
        setShowSaveConfirmModal(false);
        showToast({ variant: "success", title: "Design saved", description: "Your design has been saved successfully." });

        // Now submit the proposal with the new design ID
        setIsSubmittingProposal(true);
        try {
          const submitResponse = await fetch(`/api/designs/${data.design.id}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });

          if (!submitResponse.ok) {
            throw new Error("Failed to submit proposal");
          }

          showToast({ 
            variant: "success", 
            title: "Proposal submitted!", 
            description: "Our team will review your design and contact you shortly." 
          });
        } catch (submitError) {
          console.error("Submit error:", submitError);
          showToast({ variant: "error", title: "Submission failed", description: "Design saved, but submission failed. Please try again." });
        } finally {
          setIsSubmittingProposal(false);
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast({ variant: "error", title: "Save failed", description: "Failed to save design. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle PDF Export
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Find the canvas element
      const canvasElement = document.querySelector('[data-canvas="fixture-canvas"]') as HTMLElement | null;
      
      await generatePDF({
        designName,
        design,
        catalog,
        bomSelections,
        canvasElement,
      });

      showToast({ variant: "success", title: "PDF exported!", description: "Your proposal PDF has been downloaded." });
    } catch (error) {
      console.error("PDF export error:", error);
      showToast({ variant: "error", title: "Export failed", description: "Failed to generate PDF. Please try again." });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col">
      {/* Header stack - Toolbar + Mobile Carousel (not transformed) */}
      <div className="relative z-50 flex-shrink-0">
        <Toolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={editorState.history.length > 0}
          canRedo={editorState.future.length > 0}
          onDelete={handleDelete}
          canDelete={editorState.selectedIds.length > 0}
          onRotate={handleRotate}
          canRotate={editorState.selectedIds.length > 0}
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onToggleDebug={() => setDebugEnabled((prev) => !prev)}
          debugEnabled={debugEnabled}
          onHomeClick={() => setShowLeaveConfirmModal(true)}
          onShowHelp={handleShowHelp}
        />

        {/* Mobile Fixture Carousel - rendered here, outside any transformed container */}
        {isMobile && activeMobilePanel === "fixture-library" && (
          <MobileFixtureCarousel
            catalog={catalog}
            pendingPlacement={pendingPlacement}
            onSetPendingPlacement={handleSetPendingPlacement}
            onClose={() => setActiveMobilePanel(null)}
          />
        )}

        {/* Mobile Layers Panel - compact top panel */}
        {isMobile && activeMobilePanel === "layers" && (
          <MobileLayersPanel
            design={design}
            dispatch={dispatch}
            zoneEditMode={zoneEditMode}
            onZoneEditModeChange={setZoneEditMode}
            selectedZoneId={editorState.selectedZoneId}
            onClose={() => setActiveMobilePanel(null)}
          />
        )}

        {/* Mobile Properties Panel - compact top panel */}
        {isMobile && activeMobilePanel === "properties" && (
          <MobilePropertiesPanel
            design={design}
            selectedFixture={selectedFixture}
            catalogItem={selectedCatalogItem}
            validationIssues={validationIssues}
            dispatch={dispatch}
            onSave={handleSaveDesign}
            isSaving={isSaving}
            onClose={() => setActiveMobilePanel(null)}
          />
        )}
      </div>

      {/* Main Canvas Area - fills remaining space */}
      <div className="flex-1 relative pb-[28px] md:pb-[32px]">
        {viewMode === "2d" ? (
          <FixtureCanvas
            design={design}
            catalog={catalog}
            selectedIds={editorState.selectedIds}
            selectedZoneId={editorState.selectedZoneId}
            selectedAnnotationId={editorState.selectedAnnotationId}
            validationIssues={validationIssues}
            viewport={editorState.viewport}
            snapIncrement={editorState.snapIncrement}
            dragState={editorState.drag}
            zoneDragState={editorState.zoneDrag}
            zoneResizeState={editorState.zoneResize}
            marqueeState={editorState.marquee}
            wallDrawState={editorState.wallDraw}
            wallLengthDragState={editorState.wallLengthDrag}
            annotationDragState={editorState.annotationDrag}
            dispatch={dispatch}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            zoneEditMode={zoneEditMode}
            onDebugLog={addDebugLog}
            pendingPlacement={pendingPlacement}
            pendingPlacementRotation={pendingPlacementRotation}
            onPlaceFixture={handlePlaceFixture}
            onEditAnnotation={(id) => setEditingAnnotationId(id)}
            onAnnotationPlaced={() => setActiveTool("select")}
            onAddFixtureAt={(catalogKey, coords) => {
              const zoneId = design.zones.find(
                (zone) =>
                  coords.xFt >= zone.xFt &&
                  coords.xFt <= zone.xFt + zone.lengthFt &&
                  coords.yFt >= zone.yFt &&
                  coords.yFt <= zone.yFt + zone.widthFt
              )?.id;
              dispatch({
                type: "ADD_FIXTURE",
                catalogKey,
                zoneId,
                xFt: coords.xFt,
                yFt: coords.yFt,
              });
            }}
          />
        ) : (
          <ThreeViewport
            design={design}
            catalog={catalog}
            selectedIds={editorState.selectedIds}
            pendingPlacement={pendingPlacement}
            pendingPlacementRotation={pendingPlacementRotation}
            onPlaceFixture={handlePlaceFixture}
            onSelectFixture={(id) => dispatch({ type: "SELECT_FIXTURE", id })}
            onUpdateFixture={(id, updates) => {
              const fixture = design.fixtures.find((f) => f.id === id);
              if (!fixture) return;
              const catalogItem = catalog[fixture.catalogKey];
              if (!catalogItem) return;

              if (updates.xFt !== undefined && updates.yFt !== undefined) {
                // Get current dimensions for clamping
                const rect = rectFromFixture(fixture, catalogItem);
                const anchor = catalogItem.footprintAnchor;

                // 3D viewport always reports CENTER position of the object
                // Convert to anchor position for storage (non-center fixtures store corner position)
                let anchorX = updates.xFt;
                let anchorY = updates.yFt;
                if (anchor === "front-left" || anchor === "back-left") {
                  anchorX = updates.xFt - rect.width / 2;
                  anchorY = updates.yFt - rect.height / 2;
                }

                dispatch({
                  type: "UPDATE_FIXTURE_POSITION",
                  id,
                  xFt: anchorX,
                  yFt: anchorY,
                  fixtureWidth: rect.width,
                  fixtureHeight: rect.height,
                  footprintAnchor: anchor,
                });
              }
              if (updates.rotationDeg !== undefined) {
                dispatch({
                  type: "UPDATE_FIXTURE_ROTATION",
                  id,
                  rotationDeg: updates.rotationDeg,
                });
              }
            }}
          />
        )}
      </div>

      {/* Left Panel: Fixture Library - Desktop only, mobile uses carousel */}
      {!isMobile && (
        <DockablePanel
          title="Fixture Library"
          position="left"
          defaultOpen={false}
          width="320px"
          panelIndex={0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        >
          <FixtureLibrary 
            catalog={catalog} 
            onAddFixture={handleAddFixture}
            pendingPlacement={pendingPlacement}
            onSetPendingPlacement={handleSetPendingPlacement}
          />
        </DockablePanel>
      )}


      {/* Right Panel: Properties - Desktop only, mobile uses compact top panel */}
      {!isMobile && (
        <DockablePanel
          title="Properties"
          position="right"
          defaultOpen={false}
          width="320px"
          panelIndex={0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          }
        >
        <div className="space-y-4">
          {/* Save Button */}
          <div className="rounded-xl border border-surface-muted/60 bg-white p-4">
            <Button
              onClick={handleSaveDesign}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving 
                ? "Saving..." 
                : currentUserEmail 
                  ? (currentDesignId ? "Save Changes" : "Save Design")
                  : "Save Design"
              }
            </Button>
            {currentUserEmail && (
              <p className="mt-2 text-xs text-center text-foreground/60">
                Signed in as {currentUserEmail}
              </p>
            )}
          </div>

          {/* Export Template Button */}
          <div className="rounded-xl border border-surface-muted/60 bg-white p-4">
            <Button
              onClick={handleExportTemplate}
              variant="outline"
              className="w-full"
            >
              📋 Export Template
            </Button>
            <p className="mt-2 text-xs text-center text-foreground/60">
              Copy zones & fixtures to clipboard
            </p>
          </div>

          {/* Inspector */}
          {selectedFixture && selectedCatalogItem ? (
            <FixtureInspector
              fixture={selectedFixture}
              catalogItem={selectedCatalogItem}
              validationIssues={selectedFixtureIssues}
              dispatch={dispatch}
              shellLength={design.shell.lengthFt}
              shellWidth={design.shell.widthFt}
            />
          ) : (
            <div className="rounded-xl border border-surface-muted/60 bg-surface p-4 text-center text-sm text-foreground/60">
              No fixture selected. Click a fixture to edit properties.
            </div>
          )}
        </div>
        </DockablePanel>
      )}

      {/* Right Panel 2: Quote & Order */}
      <DockablePanel
        title="Quote & Order"
        position="right"
        defaultOpen={false}
        width="340px"
        panelIndex={1}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        mobileOpen={activeMobilePanel === "bom"}
        onMobileClose={() => setActiveMobilePanel(null)}
      >
        <BOMPanel 
          design={design} 
          catalog={catalog} 
          selections={bomSelections}
          onSelectionsChange={setBomSelections}
          designName={designName}
          onSubmitProposal={handleSubmitProposal}
          onExportPDF={handleExportPDF}
          isSubmitting={isSubmittingProposal}
          isExportingPDF={isExportingPDF}
        />
      </DockablePanel>

      {/* Left Panel 2: Layers - Desktop only, mobile uses compact top panel */}
      {!isMobile && (
        <DockablePanel
          title="Layers"
          position="left"
          defaultOpen={false}
          width="280px"
          panelIndex={1}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        >
          <LayersPanel
            design={design}
            dispatch={dispatch}
            zoneEditMode={zoneEditMode}
            onZoneEditModeChange={setZoneEditMode}
            selectedZoneId={editorState.selectedZoneId}
          />
        </DockablePanel>
      )}

      {/* Status Bar */}
      <StatusBar
        cursorX={cursorPos?.x}
        cursorY={cursorPos?.y}
        snapIncrement={editorState.snapIncrement}
        zoom={editorState.viewport.scale}
        selectionCount={editorState.selectedIds.length}
        totalFixtures={design.fixtures.length}
      />

      {/* Debug Panel */}
      {debugEnabled && (
        <DebugPanel
          logs={debugLogs}
          onClear={clearDebugLogs}
          onClose={() => setDebugEnabled(false)}
        />
      )}

      {/* Annotation Edit Modal */}
      {editingAnnotationId && (
        <AnnotationEditModal
          annotation={design.annotations?.find((a) => a.id === editingAnnotationId)}
          onSave={(text) => {
            if (editingAnnotationId) {
              dispatch({ type: "UPDATE_ANNOTATION", id: editingAnnotationId, text });
            }
            setEditingAnnotationId(null);
          }}
          onCancel={() => setEditingAnnotationId(null)}
          onDelete={() => {
            if (editingAnnotationId) {
              dispatch({ type: "REMOVE_ANNOTATION", id: editingAnnotationId });
            }
            setEditingAnnotationId(null);
          }}
        />
      )}

      {/* Save Confirmation Modal */}
      <SaveConfirmModal
        open={showSaveConfirmModal}
        onClose={() => setShowSaveConfirmModal(false)}
        onConfirm={handleSaveConfirm}
        isLoggedIn={!!currentUserEmail}
        isProcessing={isSaving}
      />

      {/* Leave Confirmation Modal */}
      <LeaveConfirmModal
        open={showLeaveConfirmModal}
        onClose={() => setShowLeaveConfirmModal(false)}
        onConfirm={() => router.push("/")}
      />

      {/* Auth Modal for Save */}
      <AuthModal
        open={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingSubmitAfterSave(false);
        }}
        onSuccess={handleAuthSuccess}
      />

      {/* Mobile Panel Menu */}
      <MobilePanelMenu
        panels={mobilePanelConfigs}
        activePanel={activeMobilePanel}
        onSelectPanel={setActiveMobilePanel}
      />

      {/* Help Overlay (mobile & desktop) */}
      <HelpOverlay
        open={showHelp}
        onDismiss={handleDismissHelp}
        viewMode={viewMode}
        isMobile={isMobile}
      />
    </div>
  );
}

// Annotation Edit Modal Component
function AnnotationEditModal({
  annotation,
  onSave,
  onCancel,
  onDelete,
}: {
  annotation?: { id: string; text: string; color?: string };
  onSave: (text: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(annotation?.text ?? "");

  if (!annotation) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter to save
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onSave(text);
    }
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-white">Edit Annotation</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your note..."
          className="mb-4 w-full resize-none rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          rows={4}
          autoFocus
        />
        <p className="mb-4 text-xs text-gray-400">
          Tip: Press Ctrl+Enter to save, Escape to cancel
        </p>
        <div className="flex items-center justify-between">
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(text)}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
