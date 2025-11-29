/**
 * Generate SVG placeholder images for container cabin models
 * Run with: node scripts/generate-placeholder-images.js
 */

const fs = require('fs');
const path = require('path');

// Ensure output directories exist
const outputDirs = [
  'public/images/models',
  'public/images/floorplans'
];

outputDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Brand colors
const colors = {
  forest: '#314c3a',
  emerald: '#10b981',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  cyan: '#06b6d4',
  amber: '#f59e0b',
  sky: '#0ea5e9'
};

/**
 * Generate exterior view SVG
 */
function generateExterior(modelSlug, modelName, lengthFt, accentColor) {
  const width = 1200;
  const height = 600;
  const containerWidth = lengthFt === 20 ? 400 : 800;
  const containerHeight = 200;
  const containerX = (width - containerWidth) / 2;
  const containerY = height / 2 - containerHeight / 2 + 50;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[200]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="ground-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[700]};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${colors.slate[800]};stop-opacity:0.5" />
    </linearGradient>
    <filter id="shadow-${modelSlug}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="0" dy="12" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Sky background -->
  <rect width="${width}" height="${height}" fill="url(#sky-${modelSlug})"/>
  
  <!-- Ground -->
  <rect x="0" y="${containerY + containerHeight}" width="${width}" height="${height - (containerY + containerHeight)}" fill="url(#ground-${modelSlug})"/>
  
  <!-- Container shadow -->
  <rect x="${containerX}" y="${containerY + containerHeight}" width="${containerWidth}" height="20" fill="${colors.slate[900]}" opacity="0.2" rx="4"/>
  
  <!-- Main container body -->
  <g filter="url(#shadow-${modelSlug})">
    <rect x="${containerX}" y="${containerY}" width="${containerWidth}" height="${containerHeight}" 
          fill="${colors.slate[800]}" stroke="${colors.slate[700]}" stroke-width="3" rx="4"/>
    
    <!-- Corrugated texture lines -->
    ${Array.from({ length: Math.floor(containerWidth / 30) }, (_, i) => 
      `<line x1="${containerX + i * 30}" y1="${containerY}" x2="${containerX + i * 30}" y2="${containerY + containerHeight}" 
             stroke="${colors.slate[700]}" stroke-width="1" opacity="0.4"/>`
    ).join('\n    ')}
    
    <!-- Vestibule -->
    <rect x="${containerX - 60}" y="${containerY + 40}" width="60" height="120" 
          fill="${accentColor}" stroke="${colors.slate[900]}" stroke-width="2" rx="2"/>
    
    <!-- Door -->
    <rect x="${containerX - 50}" y="${containerY + 60}" width="40" height="80" 
          fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2" rx="2"/>
    <circle cx="${containerX - 20}" cy="${containerY + 100}" r="3" fill="${colors.emerald}"/>
    
    <!-- Windows -->
    ${lengthFt === 40 ? `
    <rect x="${containerX + 150}" y="${containerY + 60}" width="80" height="60" 
          fill="${colors.slate[100]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2" opacity="0.7"/>
    <rect x="${containerX + 400}" y="${containerY + 60}" width="80" height="60" 
          fill="${colors.slate[100]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2" opacity="0.7"/>
    <rect x="${containerX + 650}" y="${containerY + 60}" width="80" height="60" 
          fill="${colors.slate[100]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2" opacity="0.7"/>
    ` : `
    <rect x="${containerX + 100}" y="${containerY + 60}" width="80" height="60" 
          fill="${colors.slate[100]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2" opacity="0.7"/>
    <rect x="${containerX + 220}" y="${containerY + 60}" width="80" height="60" 
          fill="${colors.slate[100]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2" opacity="0.7"/>
    `}
    
    <!-- Accent stripe -->
    <rect x="${containerX}" y="${containerY + containerHeight - 30}" width="${containerWidth}" height="8" 
          fill="${accentColor}" opacity="0.8"/>
  </g>
  
  <!-- Model label -->
  <text x="${width / 2}" y="50" font-family="system-ui, -apple-system, sans-serif" 
        font-size="32" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">
    ${modelName}
  </text>
  <text x="${width / 2}" y="80" font-family="system-ui, -apple-system, sans-serif" 
        font-size="16" font-weight="400" fill="${colors.slate[700]}" text-anchor="middle" letter-spacing="2">
    ${lengthFt}' CONTAINER CABIN
  </text>
</svg>`;
}

/**
 * Generate interior view SVG
 */
function generateInterior(modelSlug, modelName, lengthFt) {
  const width = 1200;
  const height = 600;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[50]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="floor-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[800]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Floor -->
  <rect width="${width}" height="${height}" fill="url(#floor-${modelSlug})"/>
  
  <!-- Floor planks -->
  ${Array.from({ length: 15 }, (_, i) => 
    `<line x1="0" y1="${i * 40}" x2="${width}" y2="${i * 40}" 
           stroke="${colors.slate[900]}" stroke-width="1" opacity="0.2"/>`
  ).join('\n  ')}
  
  <!-- Back wall -->
  <rect x="0" y="0" width="${width}" height="300" fill="url(#wall-${modelSlug})"/>
  
  <!-- Living area -->
  <g opacity="0.9">
    <!-- Kitchen counter -->
    <rect x="100" y="350" width="300" height="80" fill="${colors.forest}" stroke="${colors.slate[900]}" stroke-width="2" rx="4"/>
    <rect x="120" y="360" width="60" height="60" fill="${colors.slate[800]}" stroke="${colors.slate[700]}" stroke-width="1" rx="2"/>
    <rect x="200" y="360" width="60" height="60" fill="${colors.slate[800]}" stroke="${colors.slate[700]}" stroke-width="1" rx="2"/>
    
    <!-- Table -->
    <ellipse cx="600" cy="420" rx="120" ry="80" fill="${colors.slate[700]}" stroke="${colors.slate[900]}" stroke-width="2"/>
    
    <!-- Bunk indication -->
    <rect x="900" y="320" width="200" height="100" fill="${colors.slate[800]}" stroke="${colors.slate[700]}" stroke-width="2" rx="4"/>
    <rect x="900" y="200" width="200" height="100" fill="${colors.slate[800]}" stroke="${colors.slate[700]}" stroke-width="2" rx="4" opacity="0.7"/>
    <text x="1000" y="375" font-family="system-ui" font-size="14" fill="${colors.slate[100]}" text-anchor="middle">BUNKS</text>
  </g>
  
  <!-- Windows on back wall -->
  <rect x="300" y="80" width="120" height="160" fill="${colors.sky}" opacity="0.3" stroke="${colors.slate[700]}" stroke-width="2" rx="4"/>
  <rect x="780" y="80" width="120" height="160" fill="${colors.sky}" opacity="0.3" stroke="${colors.slate[700]}" stroke-width="2" rx="4"/>
  
  <!-- Title -->
  <text x="${width / 2}" y="50" font-family="system-ui, -apple-system, sans-serif" 
        font-size="24" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">
    ${modelName} Interior View
  </text>
</svg>`;
}

/**
 * Generate enhanced floorplan SVG
 */
function generateFloorplan(modelSlug, modelName, lengthFt, zones) {
  const width = 1200;
  const height = 400;
  const totalLength = zones.reduce((sum, z) => sum + z.lengthFt, 0);
  const scale = (width - 100) / totalLength;
  
  let currentX = 50;
  const zoneRects = zones.map((zone, i) => {
    const zoneWidth = zone.lengthFt * scale;
    const rect = {
      x: currentX,
      y: 100,
      width: zoneWidth,
      height: 200,
      fill: zone.color,
      name: zone.name,
      lengthFt: zone.lengthFt
    };
    currentX += zoneWidth;
    return rect;
  });
  
  // Door in first zone (front-left)
  const firstZone = zoneRects[0];
  const doorX = firstZone.x + 10;
  const doorY = firstZone.y + firstZone.height - 40;
  const doorWidth = 20 * (scale / 10); // Scale door size
  const doorHeight = 35 * (scale / 10);

  // Hall beside bath (assume bath is index 1, adjust if needed)
  const bathIndex = 1; // Bath is second zone
  const bathZone = zoneRects[bathIndex];
  const hallWidth = 2 * scale;
  const hallX = bathZone.x - hallWidth - 5;
  const hallY = bathZone.y + 20;
  const hallHeight = bathZone.height - 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
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
  </defs>
  
  <!-- Title -->
  <text x="${width / 2}" y="40" font-family="system-ui, -apple-system, sans-serif" 
        font-size="20" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">
    ${modelName} Floor Plan
  </text>
  <text x="${width / 2}" y="65" font-family="system-ui, -apple-system, sans-serif" 
        font-size="12" font-weight="400" fill="${colors.slate[700]}" text-anchor="middle" letter-spacing="2">
    ${lengthFt}' × 8' SCHEMATIC LAYOUT
  </text>
  
  <!-- Zones -->
  ${zoneRects.map((rect, i) => `
  <g filter="url(#zone-shadow)">
    <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
          fill="${rect.fill}" stroke="${colors.slate[900]}" stroke-width="2" rx="4" opacity="0.85"/>
    <text x="${rect.x + rect.width / 2}" y="${rect.y + rect.height / 2 - 10}" 
          font-family="system-ui" font-size="14" font-weight="600" 
          fill="${colors.slate[50]}" text-anchor="middle">
      ${rect.name}
    </text>
    <text x="${rect.x + rect.width / 2}" y="${rect.y + rect.height / 2 + 15}" 
          font-family="system-ui" font-size="12" font-weight="400" 
          fill="${colors.slate[200]}" text-anchor="middle">
      ${rect.lengthFt}'
    </text>
  </g>
  `).join('\n  ')}

  <!-- Door -->
  <g>
    <rect x="${doorX}" y="${doorY}" width="${doorWidth}" height="${doorHeight}" fill="#1e293b" stroke="#0f172a" stroke-width="1.5" rx="2"/>
    <text x="${doorX + doorWidth/2}" y="${doorY - 5}" font-family="system-ui" font-size="10" font-weight="600" fill="#334155" text-anchor="middle">DOOR</text>
  </g>

  <!-- Hall beside bath -->
  <g>
    <rect x="${hallX}" y="${hallY}" width="${hallWidth}" height="${hallHeight}" fill="#64748b" stroke="#475569" stroke-width="1.5" rx="2" opacity="0.8"/>
    <text x="${hallX + hallWidth/2}" y="${hallY - 8}" font-family="system-ui" font-size="11" font-weight="500" fill="#1e293b" text-anchor="middle">Hall</text>
    <text x="${hallX + hallWidth/2}" y="${hallY + hallHeight + 12}" font-family="system-ui" font-size="10" font-weight="400" fill="#475569" text-anchor="middle">2'</text>
  </g>

  <!-- Overall dimension line -->
  <line x1="50" y1="330" x2="${currentX}" y2="330" stroke="${colors.slate[700]}" stroke-width="2" marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <text x="${width / 2}" y="360" font-family="system-ui" font-size="14" font-weight="600" 
        fill="${colors.slate[700]}" text-anchor="middle">
    Total Length: ${lengthFt} feet
  </text>
  
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.slate[700]}"/>
    </marker>
  </defs>
</svg>`;
}

// Model configurations
const models = [
  {
    slug: 'basecamp-20',
    name: 'Basecamp 20',
    lengthFt: 20,
    accentColor: colors.emerald,
    zones: [
      { name: 'Living / Kitchen', lengthFt: 12, color: colors.forest },  // 9+3
      { name: 'Optional Bath', lengthFt: 4, color: colors.cyan },
      { name: 'Bunks', lengthFt: 4, color: colors.sky }
    ]
  },
  {
    slug: 'basecamp-40',
    name: 'Basecamp 40',
    lengthFt: 40,
    accentColor: colors.emerald,
    zones: [
      { name: 'Living / Kitchen', lengthFt: 20, color: colors.forest },  // 17+3
      { name: 'Hall + Bath', lengthFt: 7, color: colors.cyan },
      { name: '4-Bunk Cabin', lengthFt: 13, color: colors.sky }
    ]
  },
  {
    slug: 'outfitter-40-plus',
    name: 'Outfitter 40 Plus',
    lengthFt: 40,
    accentColor: colors.amber,
    zones: [
      { name: 'Entry / Galley', lengthFt: 20, color: colors.forest },  // 16+4 gear vestibule merged
      { name: 'Full Bath', lengthFt: 6, color: colors.cyan },
      { name: '6-Bunk Bay', lengthFt: 14, color: colors.sky }
    ]
  }
];

// Generate all images
console.log('Generating placeholder images...\n');

models.forEach(model => {
  // Exterior
  const exteriorSvg = generateExterior(model.slug, model.name, model.lengthFt, model.accentColor);
  const exteriorPath = path.join('public', 'images', 'models', `${model.slug}-exterior.svg`);
  fs.writeFileSync(exteriorPath, exteriorSvg);
  console.log(`✓ Generated ${exteriorPath}`);
  
  // Interior (only for Basecamp 40)
  if (model.slug === 'basecamp-40') {
    const interiorSvg = generateInterior(model.slug, model.name, model.lengthFt);
    const interiorPath = path.join('public', 'images', 'models', `${model.slug}-interior.svg`);
    fs.writeFileSync(interiorPath, interiorSvg);
    console.log(`✓ Generated ${interiorPath}`);
  }
  
  // Floorplan
  const floorplanSvg = generateFloorplan(model.slug, model.name, model.lengthFt, model.zones);
  const floorplanPath = path.join('public', 'images', 'floorplans', `${model.slug}-plan.svg`);
  fs.writeFileSync(floorplanPath, floorplanSvg);
  console.log(`✓ Generated ${floorplanPath}`);
  
  console.log('');
});

console.log('✅ All placeholder images generated successfully!');


