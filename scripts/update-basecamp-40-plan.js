const fs = require('fs');
const path = require('path');

const outputPath = path.join('public', 'images', 'floorplans', 'basecamp-40-plan.svg');

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

// Dimensions
const width = 1200;
const height = 400;
const scale = 1200 / 40; // 30px per foot

// Zones
// 1. Kitchen: 20ft (Green)
// 2. Hall: 2ft wide (Gray)
// 3. Bath: 5ft wide x 7ft long (Cyan)
// 4. Bunks: 13ft long (Blue)

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
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
    Basecamp 40 Floor Plan
  </text>
  <text x="${width / 2}" y="65" font-family="system-ui, -apple-system, sans-serif" 
        font-size="12" font-weight="400" fill="${colors.slate[700]}" text-anchor="middle" letter-spacing="2">
    40' × 8' SCHEMATIC LAYOUT
  </text>
  
  <!-- Container Outline (Reference) -->
  <!-- 40ft * 30px = 1200px. 8ft * 30px = 240px. -->
  <!-- Centered vertically: (400 - 240) / 2 = 80 -->
  <!-- But we have margins. Let's start x=50. Width=1100 (36.6ft?). No, let's stick to scale. -->
  <!-- Previous SVG used x=50, width=1100 for 40ft? 1100/40 = 27.5px/ft. -->
  <!-- Let's use the previous scale for consistency. -->
  <!-- Total Length line was x1=50 x2=1150. Length = 1100px. -->
  <!-- 1100px = 40ft. 1ft = 27.5px. -->
  <!-- 8ft width = 220px. -->
  <!-- Top Y = 100. Height = 200 (Wait, 200/27.5 = 7.27ft? Maybe it's not perfectly to scale or container is wider?) -->
  <!-- Let's use 200px height for 8ft to match previous style. -->
  
  <!-- ZONES -->
  <g filter="url(#zone-shadow)">
    <!-- 1. GREEN KITCHEN (20ft full-wide) -->
    <!-- x=50, width=20*27.5 = 550 -->
    <rect x="50" y="100" width="550" height="200" 
          fill="${colors.forest}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>
    <text x="${50 + 275}" y="190" 
          font-family="system-ui" font-size="14" font-weight="600" 
          fill="${colors.slate[50]}" text-anchor="middle">
      Living / Kitchen
    </text>
    <text x="${50 + 275}" y="215" 
          font-family="system-ui" font-size="12" font-weight="400" 
          fill="${colors.slate[200]}" text-anchor="middle">
      20'
    </text>
  </g>
  
  <!-- 2. GRAY HALL (Starts kitchen rear, full span to bunks) -->
  <!-- Kitchen ends at 50+550 = 600. -->
  <!-- Hall is 2ft wide. 2 * 27.5 = 55px. -->
  <!-- Hall length: Bath is 7ft long. So Hall is 7ft long here. -->
  <!-- Hall x=600. Length = 7ft * 27.5 = 192.5px. -->
  
  <g filter="url(#zone-shadow)">
    <!-- Hallway -->
    <rect x="600" y="250" width="192.5" height="50" 
          fill="${colors.slate[500]}" stroke="${colors.slate[900]}" stroke-width="2" rx="0" opacity="0.85"/>
    <text x="${600 + 96}" y="280" font-family="system-ui" font-size="11" font-weight="500" fill="${colors.slate[900]}" text-anchor="middle">Hall</text>
    
    <!-- Bath (Beside Hall) -->
    <!-- Bath takes the rest of the width? 8ft - 2ft = 6ft. -->
    <!-- User said Bath is 5ft. Maybe 1ft wall. -->
    <!-- Let's fill the rest for visual simplicity or leave a gap? -->
    <!-- "Cyan Bath Off-Set Right". -->
    <!-- If Hall is bottom, Bath is Top. -->
    <!-- Bath Y = 100. Height = 150 (200 - 50). -->
    <!-- Bath X = 600. Width = 192.5. -->
    <rect x="600" y="100" width="192.5" height="150" 
          fill="${colors.cyan}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>
    <text x="${600 + 96}" y="165" 
          font-family="system-ui" font-size="14" font-weight="600" 
          fill="${colors.slate[50]}" text-anchor="middle">
      Bath
    </text>
    <text x="${600 + 96}" y="190" 
          font-family="system-ui" font-size="12" font-weight="400" 
          fill="${colors.slate[200]}" text-anchor="middle">
      7' × 5'
    </text>
  </g>
  
  <!-- 3. BLUE BUNKS (13ft full-wide) -->
  <!-- "Hall should NOT extend into the bunk room" -->
  <!-- So Bunks take full width (8ft). -->
  <!-- Bunks Start X = 600 + 192.5 = 792.5. -->
  <!-- Bunks Length = 13ft * 27.5 = 357.5. -->
  
  <g filter="url(#zone-shadow)">
    <!-- Bunks (Full Width) -->
    <rect x="792.5" y="100" width="357.5" height="200" 
          fill="${colors.sky}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>
    <text x="${792.5 + 178}" y="190" 
          font-family="system-ui" font-size="14" font-weight="600" 
          fill="${colors.slate[50]}" text-anchor="middle">
      Bunk Room
    </text>
    <text x="${792.5 + 178}" y="215" 
          font-family="system-ui" font-size="12" font-weight="400" 
          fill="${colors.slate[200]}" text-anchor="middle">
      13'
    </text>
  </g>
  
  <!-- Overall dimension line -->
  <line x1="50" y1="330" x2="1150" y2="330" stroke="${colors.slate[700]}" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <text x="600" y="360" font-family="system-ui" font-size="14" font-weight="600" 
        fill="${colors.slate[700]}" text-anchor="middle">
    Total Length: 40 feet
  </text>
</svg>`;

fs.writeFileSync(outputPath, svgContent);
console.log('Generated updated Basecamp 40 floor plan at ' + outputPath);
