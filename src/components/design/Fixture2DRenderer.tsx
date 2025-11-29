/**
 * 2D SVG Renderers for each fixture type
 * All dimensions are in pixels, scaled from feet
 */

import type { FixtureConfig, ModuleCatalogItem } from "@/types/design";

const BASE_SCALE = 32; // pixels per foot

type Fixture2DProps = {
  fixture: FixtureConfig;
  catalogItem: ModuleCatalogItem;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  hasError: boolean;
  isHovered: boolean;
};

export function Fixture2DRenderer({
  fixture,
  catalogItem,
  x: bboxX,
  y: bboxY,
  width: bboxWidth,
  height: bboxHeight,
  isSelected,
  hasError,
  isHovered,
}: Fixture2DProps) {
  const { rotationDeg } = fixture;
  const isRotated = rotationDeg === 90 || rotationDeg === 270;
  // When fixture is rotated 180 degrees, text appears upside down - need to counter-rotate
  const needs180Fix = rotationDeg === 180;

  // Calculate center of the bounding box
  const cx = bboxX + bboxWidth / 2;
  const cy = bboxY + bboxHeight / 2;

  // Determine the dimensions to use for drawing the UNROTATED shape
  // If rotated, the bbox dimensions are swapped relative to the original shape.
  // So we swap them back to get the original shape's width/height.
  const width = isRotated ? bboxHeight : bboxWidth;
  const height = isRotated ? bboxWidth : bboxHeight;

  // Top-left coordinate to draw the unrotated shape centered at (cx, cy)
  const x = cx - width / 2;
  const y = cy - height / 2;

  // Helper to get text transform for 180-degree fix
  const getTextTransform = (textX: number, textY: number) => 
    needs180Fix ? `rotate(180, ${textX}, ${textY})` : undefined;

  const key = catalogItem.key;
  const fillColor = hasError
    ? "rgba(239,68,68,0.3)"
    : isSelected
      ? "rgba(34,211,238,0.25)"
      : "rgba(100,116,139,0.4)";
  const strokeColor = hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#64748b";
  const strokeWidth = isSelected ? 3 : 2;

  const content = (() => {
    // Toilet
    if (key.includes("toilet")) {
      const textX = x + width / 2;
      const textY = y + height * 0.65;
      return (
        <g>
          {/* Tank */}
          <rect
            x={x + width * 0.2}
            y={y + height * 0.1}
            width={width * 0.6}
            height={height * 0.3}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Bowl */}
          <ellipse
            cx={x + width / 2}
            cy={y + height * 0.65}
            rx={width * 0.35}
            ry={height * 0.3}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Seat */}
          <ellipse
            cx={x + width / 2}
            cy={y + height * 0.65}
            rx={width * 0.25}
            ry={height * 0.2}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.7}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Toilet
          </text>
        </g>
      );
    }

    // Shower
    if (key.includes("shower")) {
      const textX = x + width / 2;
      const textY = y + height * 0.75;
      return (
        <g>
          {/* Shower base */}
          <rect
            x={x + 4}
            y={y + 4}
            width={width - 8}
            height={height - 8}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Drain in center */}
          <circle
            cx={x + width / 2}
            cy={y + height / 2}
            r={Math.min(width, height) * 0.08}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          {/* Drain holes */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const radius = Math.min(width, height) * 0.12;
            return (
              <circle
                key={angle}
                cx={x + width / 2 + Math.cos(rad) * radius}
                cy={y + height / 2 + Math.sin(rad) * radius}
                r={2}
                fill={strokeColor}
              />
            );
          })}
          {/* Shower head indicator */}
          <circle
            cx={x + width * 0.15}
            cy={y + height * 0.15}
            r={6}
            fill={strokeColor}
            opacity={0.6}
          />
          <line
            x1={x + width * 0.15}
            y1={y + height * 0.15}
            x2={x + width * 0.15}
            y2={y + height * 0.25}
            stroke={strokeColor}
            strokeWidth={2}
            opacity={0.6}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Shower
          </text>
        </g>
      );
    }

    // Sink/Vanity
    if (key.includes("sink") || key.includes("vanity")) {
      const textX = x + width / 2;
      const textY = y + height * 0.82;
      // Determine label based on key
      const label = key.includes("vanity") ? "Vanity" : "Sink";
      return (
        <g>
          {/* Cabinet base */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Countertop */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height * 0.15}
            fill={strokeColor}
            opacity={0.3}
          />
          {/* Sink bowl(s) */}
          <ellipse
            cx={x + width / 2}
            cy={y + height * 0.5}
            rx={width * 0.3}
            ry={height * 0.25}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          {/* Faucet */}
          <g transform={`translate(${x + width / 2}, ${y + height * 0.15})`}>
            <circle
              cx={0}
              cy={0}
              r={4}
              fill={strokeColor}
            />
            <rect 
              x={-2} 
              y={0} 
              width={4} 
              height={12} 
              fill={strokeColor}
              opacity={0.8}
            />
          </g>
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            {label}
          </text>
        </g>
      );
    }

    // Bathtub - Enhanced 3D-style rendering
    if (key.includes("tub") || key.includes("bath")) {
      const tubPadding = 6;
      const rimWidth = 10;
      const cornerRadius = 16;
      const innerCornerRadius = 24;
      const textX = x + width * 0.45;
      const textY = y + height * 0.5;
      
      // Colors for 3D effect
      const tubOuterColor = hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#d1d5db";
      const tubInnerColor = hasError ? "rgba(239,68,68,0.15)" : isSelected ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.9)";
      const tubRimHighlight = hasError ? "#f87171" : isSelected ? "#67e8f9" : "#f3f4f6";
      const tubRimShadow = hasError ? "#dc2626" : isSelected ? "#0891b2" : "#9ca3af";
      const chromeColor = hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#71717a";
      const chromeBright = hasError ? "#f87171" : isSelected ? "#a5f3fc" : "#a1a1aa";
      
      return (
        <g>
          {/* Outer tub body with rim - creates depth effect */}
          <rect
            x={x + tubPadding}
            y={y + tubPadding}
            width={width - tubPadding * 2}
            height={height - tubPadding * 2}
            rx={cornerRadius}
            fill={tubRimHighlight}
            stroke={tubOuterColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Rim shadow edge - 3D depth on bottom/right */}
          <path
            d={`
              M ${x + tubPadding + cornerRadius} ${y + height - tubPadding}
              L ${x + width - tubPadding - cornerRadius} ${y + height - tubPadding}
              Q ${x + width - tubPadding} ${y + height - tubPadding} ${x + width - tubPadding} ${y + height - tubPadding - cornerRadius}
              L ${x + width - tubPadding} ${y + tubPadding + cornerRadius}
            `}
            fill="none"
            stroke={tubRimShadow}
            strokeWidth={strokeWidth + 1}
            strokeLinecap="round"
          />
          
          {/* Inner basin - curved contour for realistic tub shape */}
          <rect
            x={x + tubPadding + rimWidth}
            y={y + tubPadding + rimWidth}
            width={width - (tubPadding + rimWidth) * 2}
            height={height - (tubPadding + rimWidth) * 2}
            rx={innerCornerRadius}
            fill={tubInnerColor}
            stroke={tubRimShadow}
            strokeWidth={1.5}
          />
          
          {/* Basin floor contour lines - shows depth of tub */}
          <rect
            x={x + tubPadding + rimWidth + 8}
            y={y + tubPadding + rimWidth + 8}
            width={width - (tubPadding + rimWidth + 8) * 2}
            height={height - (tubPadding + rimWidth + 8) * 2}
            rx={innerCornerRadius - 4}
            fill="none"
            stroke={tubRimShadow}
            strokeWidth={0.5}
            opacity={0.3}
          />
          
          {/* Sloped back rest area indicator */}
          <path
            d={`
              M ${x + width * 0.15} ${y + tubPadding + rimWidth + 4}
              Q ${x + width * 0.08} ${y + height * 0.35} ${x + width * 0.12} ${y + height * 0.65}
              Q ${x + width * 0.08} ${y + height * 0.65} ${x + width * 0.15} ${y + height - tubPadding - rimWidth - 4}
            `}
            fill="none"
            stroke={tubRimShadow}
            strokeWidth={0.75}
            opacity={0.4}
          />
          
          {/* ===== FAUCET ASSEMBLY ===== */}
          {/* Faucet mounting plate */}
          <ellipse
            cx={x + width * 0.82}
            cy={y + height * 0.5}
            rx={12}
            ry={8}
            fill={chromeColor}
            stroke={chromeBright}
            strokeWidth={1}
          />
          
          {/* Faucet spout base */}
          <rect
            x={x + width * 0.78}
            y={y + height * 0.42}
            width={8}
            height={height * 0.16}
            rx={2}
            fill={chromeColor}
            stroke={chromeBright}
            strokeWidth={0.5}
          />
          
          {/* Faucet spout curved neck */}
          <path
            d={`
              M ${x + width * 0.78} ${y + height * 0.5}
              Q ${x + width * 0.72} ${y + height * 0.5} ${x + width * 0.72} ${y + height * 0.5}
              L ${x + width * 0.68} ${y + height * 0.5}
            `}
            fill="none"
            stroke={chromeColor}
            strokeWidth={4}
            strokeLinecap="round"
          />
          
          {/* Spout tip */}
          <circle
            cx={x + width * 0.68}
            cy={y + height * 0.5}
            r={3}
            fill={chromeBright}
            stroke={chromeColor}
            strokeWidth={1}
          />
          
          {/* Hot water handle (left) */}
          <g transform={`translate(${x + width * 0.88}, ${y + height * 0.32})`}>
            <circle
              cx={0}
              cy={0}
              r={6}
              fill={chromeColor}
              stroke={chromeBright}
              strokeWidth={1}
            />
            <circle
              cx={0}
              cy={0}
              r={3}
              fill={chromeBright}
            />
            {/* H indicator */}
            <text
              x={0}
              y={1}
              textAnchor="middle"
              fontSize={4}
              fill="#ef4444"
              fontWeight="bold"
              transform={needs180Fix ? "rotate(180, 0, 1)" : undefined}
            >
              H
            </text>
          </g>
          
          {/* Cold water handle (right) */}
          <g transform={`translate(${x + width * 0.88}, ${y + height * 0.68})`}>
            <circle
              cx={0}
              cy={0}
              r={6}
              fill={chromeColor}
              stroke={chromeBright}
              strokeWidth={1}
            />
            <circle
              cx={0}
              cy={0}
              r={3}
              fill={chromeBright}
            />
            {/* C indicator */}
            <text
              x={0}
              y={1}
              textAnchor="middle"
              fontSize={4}
              fill="#3b82f6"
              fontWeight="bold"
              transform={needs180Fix ? "rotate(180, 0, 1)" : undefined}
            >
              C
            </text>
          </g>
          
          {/* ===== DRAIN ASSEMBLY ===== */}
          {/* Drain housing */}
          <circle
            cx={x + width * 0.22}
            cy={y + height * 0.5}
            r={10}
            fill={tubInnerColor}
            stroke={chromeColor}
            strokeWidth={2}
          />
          
          {/* Drain grate - crosshatch pattern */}
          <circle
            cx={x + width * 0.22}
            cy={y + height * 0.5}
            r={6}
            fill="none"
            stroke={chromeColor}
            strokeWidth={1.5}
          />
          
          {/* Drain grate slots */}
          {[0, 45, 90, 135].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const cx_drain = x + width * 0.22;
            const cy_drain = y + height * 0.5;
            const slotLen = 4;
            return (
              <line
                key={angle}
                x1={cx_drain + Math.cos(rad) * slotLen}
                y1={cy_drain + Math.sin(rad) * slotLen}
                x2={cx_drain - Math.cos(rad) * slotLen}
                y2={cy_drain - Math.sin(rad) * slotLen}
                stroke={chromeColor}
                strokeWidth={1}
              />
            );
          })}
          
          {/* Center drain hole */}
          <circle
            cx={x + width * 0.22}
            cy={y + height * 0.5}
            r={2}
            fill={chromeColor}
          />
          
          {/* ===== OVERFLOW DRAIN ===== */}
          {/* Overflow plate near faucet end */}
          <ellipse
            cx={x + width * 0.78}
            cy={y + height * 0.2}
            rx={5}
            ry={4}
            fill="none"
            stroke={chromeColor}
            strokeWidth={1.5}
          />
          <circle
            cx={x + width * 0.78}
            cy={y + height * 0.2}
            r={2}
            fill={chromeColor}
            opacity={0.6}
          />
          
          {/* ===== GRAB BARS / SAFETY ===== */}
          {/* Safety grab bar on long side */}
          <rect
            x={x + width * 0.35}
            y={y + tubPadding + 2}
            width={width * 0.3}
            height={3}
            rx={1.5}
            fill={chromeColor}
            opacity={0.7}
          />
          
          {/* Grab bar mounting points */}
          <circle
            cx={x + width * 0.38}
            cy={y + tubPadding + 3.5}
            r={2}
            fill={chromeBright}
          />
          <circle
            cx={x + width * 0.62}
            cy={y + tubPadding + 3.5}
            r={2}
            fill={chromeBright}
          />
          
          {/* ===== WATER LINE INDICATOR ===== */}
          {/* Subtle water line showing typical fill level */}
          <ellipse
            cx={x + width * 0.45}
            cy={y + height * 0.5}
            rx={width * 0.28}
            ry={height * 0.32}
            fill="none"
            stroke="#60a5fa"
            strokeWidth={0.5}
            strokeDasharray="4 3"
            opacity={0.25}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={tubRimShadow}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Bathtub
          </text>
        </g>
      );
    }

    // Refrigerator
    if (key.includes("fridge") || key.includes("refrigerator")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Fridge body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Door separation line (vertical) for side-by-side or French door hint */}
          {width > height * 0.8 && (
            <line
              x1={x + width / 2}
              y1={y + height * 0.9}
              x2={x + width / 2}
              y2={y + height}
              stroke={strokeColor}
              strokeWidth={1}
            />
          )}
          {/* Handle hints (small rectangles on the front edge) */}
          <rect
            x={x + width / 2 - 2}
            y={y + height - 4}
            width={4}
            height={4}
            fill={strokeColor}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Fridge
          </text>
        </g>
      );
    }

    // Stove/Range
    if (key.includes("stove") || key.includes("range") || key.includes("cooktop")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Range body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Burners (4 burners) */}
          <circle
            cx={x + width * 0.3}
            cy={y + height * 0.3}
            r={Math.min(width, height) * 0.12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={x + width * 0.7}
            cy={y + height * 0.3}
            r={Math.min(width, height) * 0.12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={x + width * 0.3}
            cy={y + height * 0.7}
            r={Math.min(width, height) * 0.12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={x + width * 0.7}
            cy={y + height * 0.7}
            r={Math.min(width, height) * 0.12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Control panel */}
          <rect
            x={x + width * 0.1}
            y={y + height * 0.05}
            width={width * 0.8}
            height={height * 0.08}
            rx={2}
            fill={strokeColor}
            opacity={0.3}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Range
          </text>
        </g>
      );
    }

    // Dishwasher
    if (key.includes("dishwasher")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Dishwasher body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray="4 2"
          />
          {/* Hidden line indicator (since it's under counter) */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.3}
            fill={strokeColor}
            opacity={0.7}
            fontFamily="monospace"
            transform={getTextTransform(textX, textY)}
          >
            DW
          </text>
        </g>
      );
    }

    // Bed
    if (key.includes("bed")) {
      const textX = x + width / 2;
      const textY = y + height * 0.65;
      // Determine bed size from key
      let label = "Bed";
      if (key.includes("twin")) {
        label = "Twin Bed";
      } else if (key.includes("full")) {
        label = "Full Bed";
      } else if (key.includes("queen")) {
        label = "Queen Bed";
      } else if (key.includes("king")) {
        label = "King Bed";
      } else if (key.includes("bunk")) {
        label = "Bunk Bed";
      }
      return (
        <g>
          {/* Bed frame */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Mattress */}
          <rect
            x={x + 6}
            y={y + 6}
            width={width - 12}
            height={height - 12}
            rx={3}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.7}
          />
          {/* Pillows */}
          <rect
            x={x + width * 0.15}
            y={y + height * 0.15}
            width={width * 0.3}
            height={height * 0.2}
            rx={2}
            fill={strokeColor}
            opacity={0.3}
          />
          <rect
            x={x + width * 0.55}
            y={y + height * 0.15}
            width={width * 0.3}
            height={height * 0.2}
            rx={2}
            fill={strokeColor}
            opacity={0.3}
          />
          {/* Bedding lines */}
          {[0.5, 0.65, 0.8].map((ratio) => (
            <line
              key={ratio}
              x1={x + width * 0.1}
              y1={y + height * ratio}
              x2={x + width * 0.9}
              y2={y + height * ratio}
              stroke={strokeColor}
              strokeWidth={1}
              opacity={0.2}
            />
          ))}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.12}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            {label}
          </text>
        </g>
      );
    }

    // Desk/Table
    if (key.includes("desk") || key.includes("table")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      const label = key.includes("desk") ? "Desk" : "Table";
      return (
        <g>
          {/* Table top */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.2}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            {label}
          </text>
        </g>
      );
    }

    // Recliner
    if (key.includes("recliner")) {
      const textX = x + width / 2;
      const textY = y + height * 0.6;
      return (
        <g>
          {/* Main seat base */}
          <rect
            x={x + width * 0.1}
            y={y + height * 0.35}
            width={width * 0.8}
            height={height * 0.55}
            rx={6}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Seat cushion */}
          <rect
            x={x + width * 0.2}
            y={y + height * 0.45}
            width={width * 0.6}
            height={height * 0.35}
            rx={4}
            fill={strokeColor}
            opacity={0.2}
          />
          {/* Backrest (high, slightly reclined look) */}
          <path
            d={`M ${x + width * 0.1} ${y + height * 0.35}
               L ${x + width * 0.08} ${y + height * 0.1}
               Q ${x + width * 0.5} ${y} ${x + width * 0.92} ${y + height * 0.1}
               L ${x + width * 0.9} ${y + height * 0.35}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Backrest cushion */}
          <ellipse
            cx={x + width * 0.5}
            cy={y + height * 0.2}
            rx={width * 0.25}
            ry={height * 0.12}
            fill={strokeColor}
            opacity={0.15}
          />
          {/* Left armrest */}
          <rect
            x={x}
            y={y + height * 0.25}
            width={width * 0.15}
            height={height * 0.55}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          {/* Right armrest */}
          <rect
            x={x + width * 0.85}
            y={y + height * 0.25}
            width={width * 0.15}
            height={height * 0.55}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          {/* Footrest (folded position indicator) */}
          <rect
            x={x + width * 0.25}
            y={y + height * 0.88}
            width={width * 0.5}
            height={height * 0.08}
            rx={2}
            fill={strokeColor}
            opacity={0.3}
          />
          {/* Recline lever indicator */}
          <circle
            cx={x + width * 0.12}
            cy={y + height * 0.75}
            r={3}
            fill={strokeColor}
            opacity={0.5}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Recliner
          </text>
        </g>
      );
    }

    // Chair/Seating
    if (key.includes("chair") || key.includes("seat")) {
      const textX = x + width / 2;
      const textY = y + height * 0.6;
      return (
        <g>
          {/* Seat */}
          <rect
            x={x + width * 0.15}
            y={y + height * 0.3}
            width={width * 0.7}
            height={height * 0.6}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Backrest */}
          <path
            d={`M ${x + width * 0.15} ${y + height * 0.3} 
             L ${x + width * 0.15} ${y + height * 0.15} 
             Q ${x + width * 0.5} ${y} ${x + width * 0.85} ${y + height * 0.15}
             L ${x + width * 0.85} ${y + height * 0.3}`}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Chair
          </text>
        </g>
      );
    }

    // Washer/Dryer
    if (key.includes("washer") || key.includes("dryer") || key.includes("laundry")) {
      const textX = x + width / 2;
      const textY = y + height / 2 + 5;
      return (
        <g>
          {/* Machine body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Back control panel strip (common in plan view) */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height * 0.15}
            fill={strokeColor}
            opacity={0.3}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            fontSize={12}
            fill={strokeColor}
            fontFamily="monospace"
            transform={getTextTransform(textX, textY)}
          >
            {key.includes("washer") ? "W" : key.includes("dryer") ? "D" : "L"}
          </text>
        </g>
      );
    }

    // Door - standard floor plan representation
    if (key.includes("door") || key.includes("opening")) {
      // For doors, we show a simple opening with door swing arc
      // The door frame is just an outline, the swing shows the door
      const isExterior = key.includes("exterior");
      const doorStrokeColor = isExterior ? "#f97316" : strokeColor; // Orange for exterior
      const textX = x + width / 2;
      const textY = y + height / 2;
      const label = isExterior ? "Ext Door" : "Door";
      
      return (
        <g>
          {/* Door frame/jamb - simple outline */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={isSelected ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)"}
            stroke={doorStrokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Door swing arc - shows where door swings */}
          <path
            d={width > height 
              ? `M ${x} ${y + height} A ${height} ${height} 0 0 1 ${x + height} ${y}`
              : `M ${x + width} ${y} A ${width} ${width} 0 0 1 ${x} ${y + width}`
            }
            fill="none"
            stroke={doorStrokeColor}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.7}
          />
          {/* Door panel line - shows door position */}
          {width > height ? (
            <line
              x1={x}
              y1={y + height}
              x2={x + height * 0.7}
              y2={y + height * 0.3}
              stroke={doorStrokeColor}
              strokeWidth={strokeWidth}
            />
          ) : (
            <line
              x1={x + width}
              y1={y}
              x2={x + width * 0.3}
              y2={y + width * 0.7}
              stroke={doorStrokeColor}
              strokeWidth={strokeWidth}
            />
          )}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.5}
            fill={doorStrokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            {label}
          </text>
        </g>
      );
    }

    // Window - thin wall opening indicator
    // Windows are wall openings, so we render them as thin strips to indicate position on wall
    if (key.includes("window")) {
      const windowColor = hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#60a5fa";
      const windowFill = hasError ? "rgba(239,68,68,0.3)" : isSelected ? "rgba(34,211,238,0.4)" : "rgba(96,165,250,0.3)";
      
      // Render as a thin strip (wall opening indicator)
      // The longer dimension represents the window width along the wall
      const isHorizontal = width > height;
      const stripThickness = 8; // Fixed thin thickness for wall opening
      const textX = x + width / 2;
      const textY = y + height / 2;
      
      return (
        <g>
          {/* Window opening - thin strip */}
          <rect
            x={isHorizontal ? x : x + width / 2 - stripThickness / 2}
            y={isHorizontal ? y + height / 2 - stripThickness / 2 : y}
            width={isHorizontal ? width : stripThickness}
            height={isHorizontal ? stripThickness : height}
            rx={2}
            fill={windowFill}
            stroke={windowColor}
            strokeWidth={strokeWidth}
          />
          {/* Glass indication - center line */}
          {isHorizontal ? (
            <line
              x1={x + 4}
              y1={y + height / 2}
              x2={x + width - 4}
              y2={y + height / 2}
              stroke={windowColor}
              strokeWidth={1.5}
              opacity={0.7}
            />
          ) : (
            <line
              x1={x + width / 2}
              y1={y + 4}
              x2={x + width / 2}
              y2={y + height - 4}
              stroke={windowColor}
              strokeWidth={1.5}
              opacity={0.7}
            />
          )}
          {/* Small tick marks to indicate it's a window */}
          {isHorizontal ? (
            <>
              <line x1={x + width * 0.25} y1={y + height / 2 - 4} x2={x + width * 0.25} y2={y + height / 2 + 4} stroke={windowColor} strokeWidth={1} opacity={0.5} />
              <line x1={x + width * 0.5} y1={y + height / 2 - 4} x2={x + width * 0.5} y2={y + height / 2 + 4} stroke={windowColor} strokeWidth={1} opacity={0.5} />
              <line x1={x + width * 0.75} y1={y + height / 2 - 4} x2={x + width * 0.75} y2={y + height / 2 + 4} stroke={windowColor} strokeWidth={1} opacity={0.5} />
            </>
          ) : (
            <>
              <line x1={x + width / 2 - 4} y1={y + height * 0.25} x2={x + width / 2 + 4} y2={y + height * 0.25} stroke={windowColor} strokeWidth={1} opacity={0.5} />
              <line x1={x + width / 2 - 4} y1={y + height * 0.5} x2={x + width / 2 + 4} y2={y + height * 0.5} stroke={windowColor} strokeWidth={1} opacity={0.5} />
              <line x1={x + width / 2 - 4} y1={y + height * 0.75} x2={x + width / 2 + 4} y2={y + height * 0.75} stroke={windowColor} strokeWidth={1} opacity={0.5} />
            </>
          )}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.max(width, height) * 0.12}
            fill={windowColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Window
          </text>
        </g>
      );
    }

    // Sofa
    if (key.includes("sofa") || key.includes("couch") || key.includes("loveseat")) {
      const textX = x + width / 2;
      const textY = y + height * 0.6;
      return (
        <g>
          {/* Sofa base */}
          <rect
            x={x}
            y={y + height * 0.25}
            width={width}
            height={height * 0.65}
            rx={6}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Seat cushions */}
          <rect
            x={x + width * 0.08}
            y={y + height * 0.35}
            width={width * 0.4}
            height={height * 0.45}
            rx={4}
            fill={strokeColor}
            opacity={0.15}
          />
          <rect
            x={x + width * 0.52}
            y={y + height * 0.35}
            width={width * 0.4}
            height={height * 0.45}
            rx={4}
            fill={strokeColor}
            opacity={0.15}
          />
          {/* Backrest */}
          <rect
            x={x + width * 0.05}
            y={y}
            width={width * 0.9}
            height={height * 0.3}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Armrests */}
          <rect
            x={x - width * 0.02}
            y={y + height * 0.15}
            width={width * 0.12}
            height={height * 0.7}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          <rect
            x={x + width * 0.9}
            y={y + height * 0.15}
            width={width * 0.12}
            height={height * 0.7}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth * 0.8}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Sofa
          </text>
        </g>
      );
    }

    // Bench
    if (key.includes("bench")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Bench top */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Seat cushion indication */}
          <rect
            x={x + width * 0.1}
            y={y + height * 0.1}
            width={width * 0.8}
            height={height * 0.5}
            rx={3}
            fill={strokeColor}
            opacity={0.15}
          />
          {/* Storage indication (line) */}
          <line
            x1={x + width * 0.1}
            y1={y + height * 0.7}
            x2={x + width * 0.9}
            y2={y + height * 0.7}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.3}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Bench
          </text>
        </g>
      );
    }

    // Kitchen Island
    if (key.includes("island")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Island body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={4}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Countertop edge */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height * 0.12}
            fill={strokeColor}
            opacity={0.25}
          />
          {/* Cabinet divisions */}
          <line
            x1={x + width * 0.5}
            y1={y + height * 0.2}
            x2={x + width * 0.5}
            y2={y + height * 0.9}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.4}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Island
          </text>
        </g>
      );
    }

    // Nightstand
    if (key.includes("nightstand")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Nightstand body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={3}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Top surface */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height * 0.15}
            fill={strokeColor}
            opacity={0.2}
          />
          {/* Drawer line */}
          <line
            x1={x + width * 0.15}
            y1={y + height * 0.5}
            x2={x + width * 0.85}
            y2={y + height * 0.5}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.4}
          />
          {/* Drawer handle */}
          <rect
            x={x + width * 0.4}
            y={y + height * 0.6}
            width={width * 0.2}
            height={height * 0.08}
            rx={1}
            fill={strokeColor}
            opacity={0.4}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.2}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Nightstand
          </text>
        </g>
      );
    }

    // Dresser
    if (key.includes("dresser")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Dresser body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={3}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Top surface */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height * 0.1}
            fill={strokeColor}
            opacity={0.2}
          />
          {/* Drawer lines */}
          {[0.3, 0.5, 0.7].map((ratio) => (
            <line
              key={ratio}
              x1={x + width * 0.1}
              y1={y + height * ratio}
              x2={x + width * 0.9}
              y2={y + height * ratio}
              stroke={strokeColor}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Dresser
          </text>
        </g>
      );
    }

    // Closet System
    if (key.includes("closet")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Closet body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Hanging rod */}
          <line
            x1={x + width * 0.1}
            y1={y + height * 0.2}
            x2={x + width * 0.9}
            y2={y + height * 0.2}
            stroke={strokeColor}
            strokeWidth={2}
            opacity={0.5}
          />
          {/* Shelf lines */}
          <line
            x1={x + width * 0.1}
            y1={y + height * 0.6}
            x2={x + width * 0.9}
            y2={y + height * 0.6}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.3}
          />
          <line
            x1={x + width * 0.1}
            y1={y + height * 0.8}
            x2={x + width * 0.9}
            y2={y + height * 0.8}
            stroke={strokeColor}
            strokeWidth={1}
            opacity={0.3}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.15}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Closet
          </text>
        </g>
      );
    }

    // Coat Rack
    if (key.includes("coat") || key.includes("rack")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Rack body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Hooks indication */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <circle
              key={ratio}
              cx={x + width * ratio}
              cy={y + height * 0.3}
              r={3}
              fill={strokeColor}
              opacity={0.5}
            />
          ))}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.2}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Coat Rack
          </text>
        </g>
      );
    }

    // Linen Cabinet
    if (key.includes("linen")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      return (
        <g>
          {/* Cabinet body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Shelf lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={x + width * 0.1}
              y1={y + height * ratio}
              x2={x + width * 0.9}
              y2={y + height * ratio}
              stroke={strokeColor}
              strokeWidth={1}
              opacity={0.3}
            />
          ))}
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.18}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            Linen
          </text>
        </g>
      );
    }

    // Cabinet/Storage
    if (key.includes("cabinet") || key.includes("storage") || key.includes("shelf")) {
      const textX = x + width / 2;
      const textY = y + height / 2;
      // Determine label based on cabinet type
      let label = "Cabinet";
      if (key.includes("upper")) {
        label = "Upper Cab";
      } else if (key.includes("base") || key.includes("run")) {
        label = "Base Cab";
      } else if (key.includes("storage")) {
        label = "Storage";
      } else if (key.includes("shelf")) {
        label = "Shelf";
      }
      return (
        <g>
          {/* Cabinet body */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={2}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Label */}
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={Math.min(width, height) * 0.22}
            fill={strokeColor}
            fontFamily="sans-serif"
            fontWeight="600"
            style={{ pointerEvents: "none" }}
            transform={getTextTransform(textX, textY)}
          >
            {label}
          </text>
        </g>
      );
    }

    // Entry Wall (vestibule) - Plan view (top-down)
    // Styled to match other fixtures: wall sections + door opening + window opening
    if (key.includes("vestibule")) {
      // Door and window positions along wall span (height dimension in 2D)
      // Door: ~3ft wide opening on left side of wall
      const doorSpan = height * 0.375;  // ~3ft of the 8ft wall span
      const doorStart = y + height * 0.15;
      
      // Window: ~2.5ft opening on right side of wall  
      const windowSpan = height * 0.3;  // ~2.5ft of the 8ft wall span
      const windowStart = y + height * 0.6;
      
      // Wall sections (cedar/wood colored) - match interior wall styling
      const wallFill = hasError ? "rgba(239,68,68,0.3)" : isSelected ? "rgba(34,211,238,0.15)" : "rgba(184,148,111,0.3)";
      const wallStroke = hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#8b6f47";
      
      return (
        <g>
          {/* Wall section: left edge to door */}
          <rect
            x={x}
            y={y}
            width={width}
            height={doorStart - y}
            fill={wallFill}
            stroke={wallStroke}
            strokeWidth={strokeWidth}
          />
          
          {/* Wall section: between door and window */}
          <rect
            x={x}
            y={doorStart + doorSpan}
            width={width}
            height={windowStart - (doorStart + doorSpan)}
            fill={wallFill}
            stroke={wallStroke}
            strokeWidth={strokeWidth}
          />
          
          {/* Wall section: window to right edge */}
          <rect
            x={x}
            y={windowStart + windowSpan}
            width={width}
            height={(y + height) - (windowStart + windowSpan)}
            fill={wallFill}
            stroke={wallStroke}
            strokeWidth={strokeWidth}
          />
          
          {/* Door opening - clear opening in wall */}
          <rect
            x={x}
            y={doorStart}
            width={width}
            height={doorSpan}
            fill={isSelected ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.02)"}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Door hinge side indicator - small filled circle at hinge */}
          <circle
            cx={x + width}
            cy={doorStart}
            r={3}
            fill={hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#6b4423"}
          />
          
          {/* Door panel (closed position) - solid line showing door */}
          <line
            x1={x + width}
            y1={doorStart}
            x2={x + width}
            y2={doorStart + doorSpan}
            stroke={hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#6b4423"}
            strokeWidth={3}
          />
          
          {/* Door swing arc - 90 degree arc showing swing direction */}
          <path
            d={`M ${x + width} ${doorStart + doorSpan} A ${doorSpan} ${doorSpan} 0 0 1 ${x + width + doorSpan} ${doorStart}`}
            fill="none"
            stroke={hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#6b4423"}
            strokeWidth={1.5}
            strokeDasharray="8 4"
            opacity={0.8}
          />
          
          {/* Door panel (open position) - showing where door swings to */}
          <line
            x1={x + width}
            y1={doorStart}
            x2={x + width + doorSpan * 0.85}
            y2={doorStart}
            stroke={hasError ? "#ef4444" : isSelected ? "#22d3ee" : "#6b4423"}
            strokeWidth={2}
            strokeDasharray="4 2"
            opacity={0.6}
          />
          
          {/* Window opening - styled like standard window fixture */}
          <rect
            x={x}
            y={windowStart}
            width={width}
            height={windowSpan}
            rx={2}
            fill={isSelected ? "rgba(34,211,238,0.3)" : "rgba(135,206,235,0.3)"}
            stroke={isSelected ? "#22d3ee" : "#64b5f6"}
            strokeWidth={strokeWidth}
          />
          {/* Window glass line */}
          <line
            x1={x + width / 2}
            y1={windowStart + 2}
            x2={x + width / 2}
            y2={windowStart + windowSpan - 2}
            stroke={isSelected ? "#22d3ee" : "#64b5f6"}
            strokeWidth={1.5}
            opacity={0.7}
          />
          {/* Window mullions */}
          <line
            x1={x + 2}
            y1={windowStart + windowSpan * 0.33}
            x2={x + width - 2}
            y2={windowStart + windowSpan * 0.33}
            stroke={isSelected ? "#22d3ee" : "#64b5f6"}
            strokeWidth={0.5}
            opacity={0.5}
          />
          <line
            x1={x + 2}
            y1={windowStart + windowSpan * 0.67}
            x2={x + width - 2}
            y2={windowStart + windowSpan * 0.67}
            stroke={isSelected ? "#22d3ee" : "#64b5f6"}
            strokeWidth={0.5}
            opacity={0.5}
          />
        </g>
      );
    }

    // Interior Wall
    if (key.includes("wall")) {
      // Get material from fixture properties (default to drywall)
      const material = (fixture.properties as { material?: string })?.material ?? "drywall";
      
      // Material-specific colors
      const materialColors: Record<string, { fill: string; stroke: string; pattern?: string }> = {
        drywall: { fill: "#e5e7eb", stroke: "#9ca3af", pattern: "none" },
        plywood: { fill: "#d4a574", stroke: "#8b6f47", pattern: "plywood" },
        wood: { fill: "#8b6f47", stroke: "#5c4a32", pattern: "wood" },
        steel: { fill: "#9ca3af", stroke: "#6b7280", pattern: "steel" },
      };
      
      const matStyle = materialColors[material] || materialColors.drywall;
      
      // Override colors for error/selection states
      const wallFillColor = hasError
        ? "rgba(239,68,68,0.3)"
        : isSelected
          ? "rgba(34,211,238,0.4)"
          : matStyle.fill;
      const wallStrokeColor = hasError ? "#ef4444" : isSelected ? "#22d3ee" : matStyle.stroke;
      
      return (
        <g>
          {/* Wall base rectangle */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={wallFillColor}
            stroke={wallStrokeColor}
            strokeWidth={strokeWidth}
          />
          
          {/* Material-specific patterns */}
          {material === "plywood" && !hasError && !isSelected && (
            // Plywood grain lines
            <>
              {width > height ? (
                // Horizontal wall - horizontal grain lines
                Array.from({ length: Math.floor(height / 4) }).map((_, i) => (
                  <line
                    key={i}
                    x1={x + 2}
                    y1={y + (i + 1) * 4}
                    x2={x + width - 2}
                    y2={y + (i + 1) * 4}
                    stroke="#c4956a"
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                ))
              ) : (
                // Vertical wall - vertical grain lines
                Array.from({ length: Math.floor(width / 4) }).map((_, i) => (
                  <line
                    key={i}
                    x1={x + (i + 1) * 4}
                    y1={y + 2}
                    x2={x + (i + 1) * 4}
                    y2={y + height - 2}
                    stroke="#c4956a"
                    strokeWidth={0.5}
                    opacity={0.4}
                  />
                ))
              )}
            </>
          )}
          
          {material === "wood" && !hasError && !isSelected && (
            // Wood planks pattern
            <>
              {width > height ? (
                // Horizontal wall - vertical plank divisions
                Array.from({ length: Math.floor(width / 24) }).map((_, i) => (
                  <line
                    key={i}
                    x1={x + (i + 1) * 24}
                    y1={y}
                    x2={x + (i + 1) * 24}
                    y2={y + height}
                    stroke="#4a3728"
                    strokeWidth={1}
                    opacity={0.6}
                  />
                ))
              ) : (
                // Vertical wall - horizontal plank divisions
                Array.from({ length: Math.floor(height / 24) }).map((_, i) => (
                  <line
                    key={i}
                    x1={x}
                    y1={y + (i + 1) * 24}
                    x2={x + width}
                    y2={y + (i + 1) * 24}
                    stroke="#4a3728"
                    strokeWidth={1}
                    opacity={0.6}
                  />
                ))
              )}
            </>
          )}
          
          {material === "steel" && !hasError && !isSelected && (
            // Steel rivet/panel pattern
            <>
              {/* Horizontal center line */}
              <line
                x1={x + 4}
                y1={cy}
                x2={x + width - 4}
                y2={cy}
                stroke="#7c8591"
                strokeWidth={1}
                opacity={0.5}
              />
              {/* Metallic highlight */}
              <line
                x1={x + 2}
                y1={y + 2}
                x2={width > height ? x + width - 2 : x + 2}
                y2={width > height ? y + 2 : y + height - 2}
                stroke="white"
                strokeWidth={1}
                opacity={0.3}
              />
            </>
          )}
          
          {material === "drywall" && !hasError && !isSelected && (
            // Subtle drywall texture - just edge highlights
            <line
              x1={x + 1}
              y1={y + 1}
              x2={width > height ? x + width - 1 : x + 1}
              y2={width > height ? y + 1 : y + height - 1}
              stroke="white"
              strokeWidth={1}
              opacity={0.2}
            />
          )}
        </g>
      );
    }

    // Default fallback - simple rectangle
    const fallbackTextX = x + width / 2;
    const fallbackTextY = y + height / 2 + 5;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={4}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        <text
          x={fallbackTextX}
          y={fallbackTextY}
          textAnchor="middle"
          fontSize={13}
          fill={isSelected ? "#ffffff" : "#e2e8f0"}
          fontFamily="monospace"
          style={{ fontWeight: 600, pointerEvents: "none" }}
          transform={getTextTransform(fallbackTextX, fallbackTextY)}
        >
          {catalogItem.label}
        </text>
      </g>
    );
  })();

  return (
    <g transform={rotationDeg ? `rotate(${rotationDeg} ${cx} ${cy})` : undefined}>
      {content}
    </g>
  );
}
