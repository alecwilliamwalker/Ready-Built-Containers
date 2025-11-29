const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  forest: '#314c3a',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  }
};

// Helper to generate SVG
function generateFloorPlan(filename, title, lengthFt, zones) {
  const width = 1200;
  const height = 400;
  // Scale: 40ft fits in 1100px (approx). 
  // Let's use a fixed scale of 27.5 px/ft to match Basecamp 40.
  const scale = 27.5;

  // Calculate total width based on length
  // 20ft * 27.5 = 550px
  // 40ft * 27.5 = 1100px

  // Center the container in the 1200px width
  const containerWidthPx = lengthFt * scale;
  const startX = (width - containerWidthPx) / 2;
  const startY = 100;

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="zone-shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.slate[700]}"/>
    </marker>
  </defs>
  
  <!-- Title -->
  <text x="${width / 2}" y="40" font-family="system-ui, -apple-system, sans-serif" 
        font-size="20" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">
    ${title}
  </text>
  <text x="${width / 2}" y="65" font-family="system-ui, -apple-system, sans-serif" 
        font-size="12" font-weight="400" fill="${colors.slate[700]}" text-anchor="middle" letter-spacing="2">
    ${lengthFt}' × 8' SCHEMATIC LAYOUT
  </text>
  
  <!-- ZONES -->
  `;

  let currentX = startX;

  zones.forEach(zone => {
    // Zone properties
    const zoneLengthPx = zone.length * scale;
    const zoneHeight = zone.fullWidth ? 200 : 150; // 200px = 8ft approx. 150px = ~6ft.
    const zoneY = startY;

    // Hall properties (if applicable)
    // Hall is 2ft wide (~50px).
    // If zone has side hall, it sits at the bottom (y=250).
    // Zone sits at top (y=100).

    svgContent += `
  <g filter="url(#zone-shadow)">`;

    if (zone.hasSideHall) {
      // Hallway
      svgContent += `
    <rect x="${currentX}" y="${startY + 150}" width="${zoneLengthPx}" height="50" 
          fill="${colors.slate[500]}" stroke="${colors.slate[900]}" stroke-width="2" rx="0" opacity="0.85"/>
    <text x="${currentX + zoneLengthPx / 2}" y="${startY + 180}" font-family="system-ui" font-size="11" font-weight="500" fill="${colors.slate[900]}" text-anchor="middle">Hall</text>`;

      // Main Zone (Bath/etc)
      svgContent += `
    <rect x="${currentX}" y="${startY}" width="${zoneLengthPx}" height="150" 
          fill="${zone.color}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>`;
    } else {
      // Full width zone
      svgContent += `
    <rect x="${currentX}" y="${startY}" width="${zoneLengthPx}" height="200" 
          fill="${zone.color}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>`;
    }

    // Labels
    svgContent += `
    <text x="${currentX + zoneLengthPx / 2}" y="${startY + 90}" 
          font-family="system-ui" font-size="14" font-weight="600" 
          fill="${colors.slate[50]}" text-anchor="middle">
      ${zone.label}
    </text>
    <text x="${currentX + zoneLengthPx / 2}" y="${startY + 115}" 
          font-family="system-ui" font-size="12" font-weight="400" 
          fill="${colors.slate[200]}" text-anchor="middle">
      ${zone.subLabel || (zone.length + "'")}
    </text>
  </g>`;

    currentX += zoneLengthPx;
  });

  // Dimension Line
  svgContent += `
  <!-- Overall dimension line -->
  <line x1="${startX}" y1="330" x2="${startX + containerWidthPx}" y2="330" stroke="${colors.slate[700]}" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <text x="${width / 2}" y="360" font-family="system-ui" font-size="14" font-weight="600" 
        fill="${colors.slate[700]}" text-anchor="middle">
    Total Length: ${lengthFt} feet
  </text>
</svg>`;

  const outputPath = path.join('public', 'images', 'floorplans', filename);
  fs.writeFileSync(outputPath, svgContent);
  console.log(`Generated ${filename}`);
}

// DEFINITIONS

// Basecamp 20
// [Kitchen 12'] [Bath 4' (Side Hall)] [Bunks 4' (Full Width)]
// Removed Vestibule (3'), added to Kitchen.
const basecamp20Zones = [
  { label: 'Kitchen', length: 12, color: colors.forest, fullWidth: true },
  { label: 'Bath', length: 4, color: colors.cyan, hasSideHall: true, subLabel: "4' × 5'" },
  { label: 'Bunks', length: 4, color: colors.sky, fullWidth: true }
];

// Basecamp 40 (Refined)
// [Kitchen 20'] [Bath 7' (Side Hall)] [Bunks 13' (Full Width)]
const basecamp40Zones = [
  { label: 'Living / Kitchen', length: 20, color: colors.forest, fullWidth: true },
  { label: 'Bath', length: 7, color: colors.cyan, hasSideHall: true, subLabel: "7' × 5'" },
  { label: 'Bunk Room', length: 13, color: colors.sky, fullWidth: true }
];

// Outfitter 40 Plus
// [Galley 20'] [Bath 6' (Side Hall)] [Bunks 14' (Full Width)]
// Removed Vestibule (4'), added to Galley.
const outfitter40PlusZones = [
  { label: 'Extended Galley', length: 20, color: colors.forest, fullWidth: true },
  { label: 'Full Bath', length: 6, color: colors.cyan, hasSideHall: true, subLabel: "6' × 5'" },
  { label: '6-Bunk Bay', length: 14, color: colors.sky, fullWidth: true }
];

// Generate
generateFloorPlan('basecamp-20-plan.svg', 'Basecamp 20 Floor Plan', 20, basecamp20Zones);
generateFloorPlan('basecamp-40-plan.svg', 'Basecamp 40 Floor Plan', 40, basecamp40Zones);
generateFloorPlan('outfitter-40-plus-plan.svg', 'Outfitter 40 Plus Floor Plan', 40, outfitter40PlusZones);
