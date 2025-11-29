"use client";

import type { DesignAction, ValidationIssue } from "@/types/design";

export type ValidationPanelProps = {
  issues: ValidationIssue[];
  dispatch: (action: DesignAction) => void;
};

export function ValidationPanel({ issues, dispatch }: ValidationPanelProps) {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const handleFocusFixture = (fixtureId?: string) => {
    if (fixtureId) {
      dispatch({ type: "SELECT_FIXTURE", id: fixtureId });
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
        Validation
      </p>
      {issues.length === 0 ? (
        <p className="text-xs text-forest">Layout is valid.</p>
      ) : (
        <div className="space-y-3">
          {errors.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-red-600">
                Errors ({errors.length})
              </p>
              <ul className="space-y-1 text-xs text-red-700">
                {errors.map((issue) => (
                  <li key={issue.id}>
                    <button
                      type="button"
                      onClick={() => handleFocusFixture(issue.fixtureId)}
                      className="text-left underline hover:no-underline"
                    >
                        {issue.message}
                      </button>
                    {issue.fixtureId && (
                      <span className="ml-1 text-red-500">
                        (Fixture {issue.fixtureId.slice(0, 8)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold text-amber-600">
                Warnings ({warnings.length})
              </p>
              <ul className="space-y-1 text-xs text-amber-700">
                {warnings.map((issue) => (
                  <li key={issue.id}>
                    <button
                      type="button"
                      onClick={() => handleFocusFixture(issue.fixtureId)}
                      className="text-left underline hover:no-underline"
                    >
                      {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

