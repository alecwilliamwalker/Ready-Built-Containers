"use client";

import { useRef, useEffect, useState } from "react";
import type { AnnotationConfig, DesignAction, ViewportState } from "@/types/design";

type AnnotationLayerProps = {
  annotations: AnnotationConfig[];
  selectedAnnotationId?: string;
  viewport: ViewportState;
  scalePxPerFt: number;
  dispatch: (action: DesignAction) => void;
  onStartDrag: (id: string, target: "anchor" | "label", pointerStartPx: { x: number; y: number }) => void;
  onEditText: (id: string) => void;
};

const ANCHOR_RADIUS = 6;
const LABEL_PADDING_X = 12;
const LABEL_PADDING_Y = 8;
const LABEL_MIN_WIDTH = 80;
const LABEL_MIN_HEIGHT = 28;
const LEADER_STROKE_WIDTH = 2;
const FONT_SIZE = 12;
const LINE_HEIGHT = 16;

// Individual annotation component to handle text measurement
function Annotation({
  annotation,
  isSelected,
  scalePxPerFt,
  dispatch,
  onStartDrag,
  onEditText,
}: {
  annotation: AnnotationConfig;
  isSelected: boolean;
  scalePxPerFt: number;
  dispatch: (action: DesignAction) => void;
  onStartDrag: (id: string, target: "anchor" | "label", pointerStartPx: { x: number; y: number }) => void;
  onEditText: (id: string) => void;
}) {
  const textRef = useRef<SVGTextElement>(null);
  const [labelSize, setLabelSize] = useState({ width: LABEL_MIN_WIDTH, height: LABEL_MIN_HEIGHT });
  
  const ftToPx = (ft: number) => ft * scalePxPerFt;
  const accentColor = annotation.color || "#f59e0b";
  
  const anchorPx = {
    x: ftToPx(annotation.anchorFt.x),
    y: ftToPx(annotation.anchorFt.y),
  };
  const labelPx = {
    x: ftToPx(annotation.labelFt.x),
    y: ftToPx(annotation.labelFt.y),
  };

  const textLines = annotation.text ? annotation.text.split("\n") : [""];
  const displayText = annotation.text || "Double-click to edit";

  // Measure actual text size after render
  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      setLabelSize({
        width: Math.max(LABEL_MIN_WIDTH, bbox.width + LABEL_PADDING_X * 2),
        height: Math.max(LABEL_MIN_HEIGHT, bbox.height + LABEL_PADDING_Y * 2),
      });
    }
  }, [annotation.text]);

  return (
    <g className="annotation">
      {/* Leader line from anchor to label */}
      <line
        x1={anchorPx.x}
        y1={anchorPx.y}
        x2={labelPx.x}
        y2={labelPx.y}
        stroke={accentColor}
        strokeWidth={LEADER_STROKE_WIDTH}
        strokeDasharray={isSelected ? "none" : "4 2"}
        opacity={0.8}
        pointerEvents="none"
      />

      {/* Anchor point (where the callout points to) */}
      <circle
        cx={anchorPx.x}
        cy={anchorPx.y}
        r={ANCHOR_RADIUS}
        fill={accentColor}
        stroke={isSelected ? "#fff" : "none"}
        strokeWidth={2}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartDrag(annotation.id, "anchor", { x: e.clientX, y: e.clientY });
        }}
      />
      
      {/* Inner dot on anchor */}
      <circle
        cx={anchorPx.x}
        cy={anchorPx.y}
        r={2}
        fill="#fff"
        pointerEvents="none"
      />

      {/* Label background */}
      <rect
        x={labelPx.x - labelSize.width / 2}
        y={labelPx.y - labelSize.height / 2}
        width={labelSize.width}
        height={labelSize.height}
        rx={4}
        fill={isSelected ? accentColor : "#1f2937"}
        stroke={accentColor}
        strokeWidth={isSelected ? 2 : 1}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartDrag(annotation.id, "label", { x: e.clientX, y: e.clientY });
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEditText(annotation.id);
        }}
      />

      {/* Label text */}
      <text
        ref={textRef}
        x={labelPx.x}
        y={labelPx.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isSelected ? "#1f2937" : "#fff"}
        fontSize={FONT_SIZE}
        fontFamily="system-ui, sans-serif"
        pointerEvents="none"
        style={{ userSelect: "none" }}
      >
        {textLines.length === 1 ? (
          displayText
        ) : (
          textLines.map((line, i) => (
            <tspan
              key={i}
              x={labelPx.x}
              dy={i === 0 ? `${-(textLines.length - 1) * LINE_HEIGHT / 2}px` : `${LINE_HEIGHT}px`}
            >
              {line}
            </tspan>
          ))
        )}
      </text>

      {/* Delete button when selected */}
      {isSelected && (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "REMOVE_ANNOTATION", id: annotation.id });
          }}
        >
          <circle
            cx={labelPx.x + labelSize.width / 2 + 8}
            cy={labelPx.y - labelSize.height / 2 - 8}
            r={10}
            fill="#ef4444"
            stroke="#fff"
            strokeWidth={1}
          />
          <text
            x={labelPx.x + labelSize.width / 2 + 8}
            y={labelPx.y - labelSize.height / 2 - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#fff"
            fontSize={14}
            fontWeight="bold"
            pointerEvents="none"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
}

export function AnnotationLayer({
  annotations,
  selectedAnnotationId,
  viewport,
  scalePxPerFt,
  dispatch,
  onStartDrag,
  onEditText,
}: AnnotationLayerProps) {
  return (
    <g className="annotation-layer">
      {annotations.map((annotation) => (
        <Annotation
          key={annotation.id}
          annotation={annotation}
          isSelected={annotation.id === selectedAnnotationId}
          scalePxPerFt={scalePxPerFt}
          dispatch={dispatch}
          onStartDrag={onStartDrag}
          onEditText={onEditText}
        />
      ))}
    </g>
  );
}

