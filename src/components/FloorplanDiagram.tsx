"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

type Segment = {
  name: string;
  lengthFt: number;
  fill: string;
};

type FloorplanDiagramProps = {
  widthFt: number;
  heightFt: number;
  segments: Segment[];
  className?: string;
};

function toInches(ft: number) {
  return Math.round(ft * 12);
}

function formatFeet(ft: number) {
  return `${ft.toFixed(0)}'-0"`;
}

export const FloorplanDiagram = memo(function FloorplanDiagram({
  widthFt,
  heightFt,
  segments,
  className,
}: FloorplanDiagramProps) {
  const widthIn = toInches(widthFt);
  const heightIn = toInches(heightFt);

  const xPositions = useMemo(() => {
    const xs: number[] = [0];
    let acc = 0;
    for (const seg of segments) {
      acc += seg.lengthFt;
      xs.push((acc / widthFt) * widthIn);
    }
    return xs;
  }, [segments, widthFt, widthIn]);

  // Keep drawing inside a padded box for callouts and dimensions
  const pad = 28; // svg units (px) for margin around the container

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${widthIn + pad * 2} ${heightIn + pad * 2 + 110}`}
        role="img"
        aria-label="Scaled schematic plan with overall and segment dimensions"
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" viewBox="0 0 8 8">
            <path d="M0,0 L8,4 L0,8 z" fill="#2f5139" />
          </marker>
        </defs>

        {/* Container background */}
        <rect x={pad} y={pad} width={widthIn} height={heightIn} fill="#ffffff" rx="4" />
        <rect
          x={pad}
          y={pad}
          width={widthIn}
          height={heightIn}
          fill="url(#bg)"
          stroke="#1f2937"
          strokeWidth="3"
          rx="6"
        />

        {/* Vertical partitions by segments */}
        {segments.map((seg, idx) => {
          const xStart = pad + xPositions[idx];
          const xEnd = pad + xPositions[idx + 1];
          const w = xEnd - xStart;
          return (
            <g key={seg.name}>
              <rect
                x={xStart + 1.5}
                y={pad + 1.5}
                width={w - 3}
                height={heightIn - 3}
                fill={seg.fill}
                opacity={0.18}
              />
              {idx > 0 && (
                <line
                  x1={xStart}
                  y1={pad}
                  x2={xStart}
                  y2={pad + heightIn}
                  stroke="#9aa6b2"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          );
        })}

        {/* Overall dimensions (top and right) */}
        <line
          x1={pad}
          y1={pad - 16}
          x2={pad + widthIn}
          y2={pad - 16}
          stroke="#314c3a"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        <text x={pad + widthIn / 2} y={pad - 22} textAnchor="middle" fontSize="14" fill="#314c3a">
          {formatFeet(widthFt)}
        </text>
        <line
          x1={pad + widthIn + 16}
          y1={pad}
          x2={pad + widthIn + 16}
          y2={pad + heightIn}
          stroke="#314c3a"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        <text
          x={pad + widthIn + 24}
          y={pad + heightIn / 2}
          transform={`rotate(-90 ${pad + widthIn + 24} ${pad + heightIn / 2})`}
          textAnchor="middle"
          fontSize="14"
          fill="#314c3a"
        >
          {formatFeet(heightFt)}
        </text>

        {/* Segment callouts below the drawing - staggered for readability */}
        {segments.map((seg, idx) => {
          const xStart = pad + xPositions[idx];
          const xEnd = pad + xPositions[idx + 1];
          const cx = (xStart + xEnd) / 2;
          // Stagger labels: even indices at lower position, odd at higher
          const yOffset = idx % 2 === 0 ? 0 : 20;
          const yBase = pad + heightIn + 18 + yOffset;
          const label = `${seg.name} · ${formatFeet(seg.lengthFt)}`;
          return (
            <g key={`label-${seg.name}`}>
              <line x1={cx} y1={pad + heightIn} x2={cx} y2={yBase} stroke="#9aa6b2" strokeWidth="1" />
              <circle cx={cx} cy={pad + heightIn} r={2} fill="#9aa6b2" />
              <text x={cx} y={yBase + 16} textAnchor="middle" fontSize="12" fontWeight="500" fill="#334155">
                {seg.name}
              </text>
              <text x={cx} y={yBase + 30} textAnchor="middle" fontSize="11" fill="#64748b">
                {formatFeet(seg.lengthFt)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export type { FloorplanDiagramProps };


