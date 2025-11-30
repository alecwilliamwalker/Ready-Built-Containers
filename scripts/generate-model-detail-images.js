/**
 * Generate enhanced model detail images
 * Run with: node scripts/generate-model-detail-images.js
 */

const fs = require('fs');
const path = require('path');

// Ensure output directories exist
const outputDirs = ['public/images/models'];
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
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
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
 * Generate detailed exterior view with environment
 */
function generateDetailedExterior(modelSlug, modelName, lengthFt, features) {
  const width = 1400;
  const height = 800;
  const containerWidth = lengthFt === 20 ? 500 : 900;
  const containerHeight = 240;
  const containerX = (width - containerWidth) / 2;
  const containerY = height / 2 - containerHeight / 2 + 80;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sky-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="ground-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#334155;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:0.4" />
    </linearGradient>
    <linearGradient id="container-${modelSlug}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.slate[800]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow-${modelSlug}">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
      <feOffset dx="0" dy="20" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.4"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="trees-${modelSlug}" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
      <path d="M50,180 L40,150 L30,180 L20,150 L10,180 L0,150" fill="none" stroke="${colors.forest}" stroke-width="2" opacity="0.3"/>
      <circle cx="25" cy="130" r="15" fill="${colors.forest}" opacity="0.2"/>
      <circle cx="15" cy="125" r="12" fill="${colors.forest}" opacity="0.25"/>
      <circle cx="35" cy="125" r="10" fill="${colors.forest}" opacity="0.2"/>
    </pattern>
  </defs>
  
  <!-- Sky background -->
  <rect width="${width}" height="${height}" fill="url(#sky-${modelSlug})"/>
  
  <!-- Distant trees -->
  <rect x="0" y="300" width="${width}" height="200" fill="url(#trees-${modelSlug})"/>
  
  <!-- Ground/gravel pad -->
  <ellipse cx="${width/2}" cy="${containerY + containerHeight + 40}" rx="${containerWidth + 100}" ry="60" fill="url(#ground-${modelSlug})"/>
  <rect x="0" y="${containerY + containerHeight + 20}" width="${width}" height="${height - (containerY + containerHeight + 20)}" fill="url(#ground-${modelSlug})"/>
  
  <!-- Foundation piers -->
  ${Array.from({ length: lengthFt === 20 ? 3 : 5 }, (_, i) => {
    const spacing = containerWidth / (lengthFt === 20 ? 2 : 4);
    const x = containerX + (i * spacing);
    return `
    <rect x="${x - 15}" y="${containerY + containerHeight - 20}" width="30" height="40" fill="${colors.slate[700]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2"/>
    <rect x="${x - 12}" y="${containerY + containerHeight - 15}" width="24" height="10" fill="${colors.slate[600]}"/>
    `;
  }).join('')}
  
  <!-- Main container with shadow -->
  <g filter="url(#shadow-${modelSlug})">
    <!-- Container body -->
    <rect x="${containerX}" y="${containerY}" width="${containerWidth}" height="${containerHeight}" 
          fill="url(#container-${modelSlug})" stroke="${colors.slate[600]}" stroke-width="4" rx="6"/>
    
    <!-- Corrugated texture -->
    ${Array.from({ length: Math.floor(containerWidth / 35) }, (_, i) => `
    <line x1="${containerX + 20 + i * 35}" y1="${containerY}" x2="${containerX + 20 + i * 35}" y2="${containerY + containerHeight}" 
          stroke="${colors.slate[600]}" stroke-width="2" opacity="0.4"/>
    `).join('')}
    
    <!-- Vestibule -->
    <rect x="${containerX - 80}" y="${containerY + 50}" width="80" height="140" 
          fill="${colors.forest}" stroke="${colors.slate[900]}" stroke-width="3" rx="4"/>
    <rect x="${containerX - 75}" y="${containerY + 55}" width="70" height="130" 
          fill="${colors.forest}" opacity="0.3"/>
    
    <!-- Entry door -->
    <rect x="${containerX - 65}" y="${containerY + 80}" width="50" height="100" 
          fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2" rx="3"/>
    <circle cx="${containerX - 25}" cy="${containerY + 130}" r="4" fill="${colors.emerald}"/>
    <line x1="${containerX - 40}" y1="${containerY + 80}" x2="${containerX - 40}" y2="${containerY + 180}" 
          stroke="${colors.slate[700]}" stroke-width="1"/>
    
    <!-- Windows -->
    ${features.windows.map((win, idx) => `
    <g>
      <rect x="${containerX + win.x}" y="${containerY + 70}" width="${win.width}" height="90" 
            fill="${colors.sky}" opacity="0.4" stroke="${colors.slate[900]}" stroke-width="3" rx="3"/>
      <line x1="${containerX + win.x + win.width/2}" y1="${containerY + 70}" x2="${containerX + win.x + win.width/2}" y2="${containerY + 160}" 
            stroke="${colors.slate[900]}" stroke-width="2"/>
      <line x1="${containerX + win.x}" y1="${containerY + 115}" x2="${containerX + win.x + win.width}" y2="${containerY + 115}" 
            stroke="${colors.slate[900]}" stroke-width="2"/>
      <!-- Window reflection -->
      <rect x="${containerX + win.x + 5}" y="${containerY + 75}" width="${win.width - 10}" height="30" 
            fill="white" opacity="0.3"/>
    </g>
    `).join('')}
    
    <!-- Accent stripe -->
    <rect x="${containerX}" y="${containerY + containerHeight - 40}" width="${containerWidth}" height="12" 
          fill="${colors.emerald}" opacity="0.9"/>
    
    <!-- Roof vents/solar prep -->
    <rect x="${containerX + containerWidth - 200}" y="${containerY - 15}" width="80" height="15" 
          fill="${colors.slate[700]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2"/>
    <rect x="${containerX + containerWidth - 350}" y="${containerY - 15}" width="80" height="15" 
          fill="${colors.slate[700]}" stroke="${colors.slate[900]}" stroke-width="2" rx="2"/>
  </g>
  
  <!-- Model label -->
  <g>
    <rect x="${width/2 - 200}" y="40" width="400" height="80" fill="${colors.slate[900]}" opacity="0.8" rx="8"/>
    <text x="${width/2}" y="75" font-family="system-ui, -apple-system, sans-serif" 
          font-size="36" font-weight="700" fill="white" text-anchor="middle">
      ${modelName}
    </text>
    <text x="${width/2}" y="105" font-family="system-ui, -apple-system, sans-serif" 
          font-size="16" font-weight="500" fill="${colors.emerald}" text-anchor="middle" letter-spacing="3">
      ${lengthFt}' HIGH-CUBE CONTAINER CABIN
    </text>
  </g>
  
  <!-- Feature callouts -->
  ${features.callouts.map((callout, idx) => `
  <g>
    <circle cx="${callout.x}" cy="${callout.y}" r="8" fill="${colors.emerald}" opacity="0.9"/>
    <circle cx="${callout.x}" cy="${callout.y}" r="12" fill="none" stroke="${colors.emerald}" stroke-width="2" opacity="0.6"/>
    <line x1="${callout.x}" y1="${callout.y}" x2="${callout.labelX}" y2="${callout.labelY}" 
          stroke="${colors.emerald}" stroke-width="2" opacity="0.8"/>
    <rect x="${callout.labelX - 5}" y="${callout.labelY - 25}" width="${callout.label.length * 8 + 20}" height="30" 
          fill="${colors.slate[900]}" opacity="0.9" rx="4"/>
    <text x="${callout.labelX + 5}" y="${callout.labelY - 5}" font-family="system-ui" 
          font-size="12" font-weight="600" fill="white">
      ${callout.label}
    </text>
  </g>
  `).join('')}
</svg>`;
}

/**
 * Generate detailed interior cutaway view
 */
function generateDetailedInterior(modelSlug, modelName, lengthFt, zones) {
  const width = 1400;
  const height = 700;
  const scale = (width - 100) / lengthFt;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wall-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[50]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="floor-${modelSlug}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[600]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
    </linearGradient>
    <pattern id="wood-floor" x="0" y="0" width="120" height="20" patternUnits="userSpaceOnUse">
      <rect width="120" height="20" fill="${colors.slate[700]}"/>
      <line x1="0" y1="0" x2="120" y2="0" stroke="${colors.slate[900]}" stroke-width="1"/>
      <line x1="60" y1="0" x2="60" y2="20" stroke="${colors.slate[900]}" stroke-width="1" opacity="0.3"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${colors.slate[800]}"/>
  
  <!-- Title -->
  <text x="${width/2}" y="50" font-family="system-ui, -apple-system, sans-serif" 
        font-size="32" font-weight="700" fill="white" text-anchor="middle">
    ${modelName} Interior Layout
  </text>
  <text x="${width/2}" y="80" font-family="system-ui, -apple-system, sans-serif" 
        font-size="14" font-weight="500" fill="${colors.emerald}" text-anchor="middle" letter-spacing="2">
    CUTAWAY VIEW • ${lengthFt}' × 8'
  </text>
  
  <!-- Container shell outline -->
  <rect x="50" y="120" width="${width - 100}" height="480" 
        fill="none" stroke="${colors.slate[600]}" stroke-width="4" rx="6"/>
  
  <!-- Floor -->
  <rect x="50" y="500" width="${width - 100}" height="100" fill="url(#wood-floor)"/>
  
  <!-- Back wall -->
  <rect x="50" y="120" width="${width - 100}" height="380" fill="url(#wall-${modelSlug})"/>
  
  <!-- Zones -->
  ${zones.map((zone, idx) => {
    const zoneWidth = (zone.lengthFt / lengthFt) * (width - 100);
    const zoneX = 50 + zones.slice(0, idx).reduce((sum, z) => sum + (z.lengthFt / lengthFt) * (width - 100), 0);
    
    return `
    <g>
      <!-- Zone divider -->
      ${idx > 0 ? `<line x1="${zoneX}" y1="120" x2="${zoneX}" y2="600" stroke="${colors.slate[400]}" stroke-width="2" stroke-dasharray="8 4"/>` : ''}
      
      <!-- Zone color overlay -->
      <rect x="${zoneX}" y="500" width="${zoneWidth}" height="100" fill="${zone.color}" opacity="0.3"/>
      
      <!-- Zone furniture/fixtures -->
      ${zone.items.map(item => {
        const itemX = zoneX + (item.x / zone.lengthFt) * zoneWidth;
        const itemY = 500 - item.height;
        return `
        <rect x="${itemX}" y="${itemY}" width="${item.width}" height="${item.height}" 
              fill="${item.fill}" stroke="${colors.slate[900]}" stroke-width="2" rx="4"/>
        ${item.label ? `
        <text x="${itemX + item.width/2}" y="${itemY + item.height/2 + 5}" 
              font-family="system-ui" font-size="11" font-weight="600" 
              fill="${colors.slate[100]}" text-anchor="middle">
          ${item.label}
        </text>
        ` : ''}
        `;
      }).join('')}
      
      <!-- Zone label -->
      <text x="${zoneX + zoneWidth/2}" y="640" font-family="system-ui" 
            font-size="14" font-weight="600" fill="white" text-anchor="middle">
        ${zone.name}
      </text>
      <text x="${zoneX + zoneWidth/2}" y="660" font-family="system-ui" 
            font-size="12" fill="${colors.slate[400]}" text-anchor="middle">
        ${zone.lengthFt}'
      </text>
    </g>
    `;
  }).join('')}
  
  <!-- Windows on back wall -->
  <rect x="250" y="180" width="140" height="180" fill="${colors.sky}" opacity="0.3" stroke="${colors.slate[700]}" stroke-width="3" rx="4"/>
  <line x1="320" y1="180" x2="320" y2="360" stroke="${colors.slate[700]}" stroke-width="2"/>
  <line x1="250" y1="270" x2="390" y2="270" stroke="${colors.slate[700]}" stroke-width="2"/>
  
  ${lengthFt === 40 ? `
  <rect x="900" y="180" width="140" height="180" fill="${colors.sky}" opacity="0.3" stroke="${colors.slate[700]}" stroke-width="3" rx="4"/>
  <line x1="970" y1="180" x2="970" y2="360" stroke="${colors.slate[700]}" stroke-width="2"/>
  <line x1="900" y1="270" x2="1040" y2="270" stroke="${colors.slate[700]}" stroke-width="2"/>
  ` : ''}
</svg>`;
}

// Model configurations
const models = [
  {
    slug: 'standard',
    name: 'Standard',
    lengthFt: 40,
    exterior: {
      windows: [
        { x: 200, width: 140 },
        { x: 450, width: 120 },
        { x: 700, width: 140 }
      ],
      callouts: [
        { x: 300, y: 380, labelX: 200, labelY: 320, label: 'Secure Entry' },
        { x: 550, y: 320, labelX: 650, labelY: 270, label: 'Living Windows' },
        { x: 850, y: 320, labelX: 950, labelY: 270, label: 'Bunk Egress' },
        { x: 1050, y: 450, labelX: 1150, labelY: 500, label: 'Solar Ready Roof' }
      ]
    },
    interior: {
      zones: [
        {
          name: 'Vestibule',
          lengthFt: 3,
          color: colors.slate[800],
          items: [
            { x: 0.5, width: 40, height: 90, fill: colors.slate[700], label: 'Coats' }
          ]
        },
        {
          name: 'Living / Kitchen',
          lengthFt: 17,
          color: colors.forest,
          items: [
            { x: 1, width: 180, height: 80, fill: colors.forest, label: 'L-Shape Galley' },
            { x: 8, width: 120, height: 70, fill: colors.slate[700], label: 'Dining' },
            { x: 13, width: 80, height: 80, fill: colors.slate[600], label: 'Sofa' }
          ]
        },
        {
          name: 'Hall + Bath',
          lengthFt: 7,
          color: colors.cyan,
          items: [
            { x: 0.5, width: 60, height: 70, fill: colors.slate[100], label: 'Vanity' },
            { x: 3.5, width: 70, height: 80, fill: colors.slate[100], label: 'Shower' },
            { x: 5.5, width: 50, height: 60, fill: colors.slate[100], label: 'WC' }
          ]
        },
        {
          name: '4-Bunk Cabin',
          lengthFt: 13,
          color: colors.sky,
          items: [
            { x: 1, width: 80, height: 50, fill: colors.slate[800], label: 'Bunk 1' },
            { x: 1, width: 80, height: 50, fill: colors.slate[800], label: 'Bunk 2' },
            { x: 6, width: 80, height: 50, fill: colors.slate[800], label: 'Bunk 3' },
            { x: 6, width: 80, height: 50, fill: colors.slate[800], label: 'Bunk 4' },
            { x: 10, width: 60, height: 100, fill: colors.slate[700], label: 'Lockers' }
          ]
        }
      ]
    }
  },
  {
    slug: 'deluxe',
    name: 'Deluxe',
    lengthFt: 40,
    exterior: {
      windows: [
        { x: 180, width: 140 },
        { x: 420, width: 140 },
        { x: 680, width: 120 }
      ],
      callouts: [
        { x: 280, y: 380, labelX: 180, labelY: 320, label: 'Gear Vestibule' },
        { x: 500, y: 320, labelX: 600, labelY: 270, label: 'Extended Galley' },
        { x: 800, y: 320, labelX: 900, labelY: 270, label: '6-Bunk Layout' },
        { x: 1050, y: 280, labelX: 1150, labelY: 230, label: 'Observation Deck Prep' }
      ]
    },
    interior: {
      zones: [
        {
          name: 'Gear Vestibule',
          lengthFt: 4,
          color: colors.slate[800],
          items: [
            { x: 0.5, width: 60, height: 100, fill: colors.slate[700], label: 'Gear Wall' },
            { x: 2.5, width: 40, height: 80, fill: colors.slate[600], label: 'Boots' }
          ]
        },
        {
          name: 'Extended Galley',
          lengthFt: 16,
          color: colors.forest,
          items: [
            { x: 1, width: 200, height: 85, fill: colors.forest, label: 'Extended Counter' },
            { x: 8, width: 140, height: 75, fill: colors.slate[700], label: 'Dining Table' },
            { x: 13, width: 70, height: 70, fill: colors.slate[600], label: 'Seating' }
          ]
        },
        {
          name: 'Full Bath',
          lengthFt: 6,
          color: colors.cyan,
          items: [
            { x: 0.5, width: 70, height: 75, fill: colors.slate[100], label: 'Vanity' },
            { x: 3, width: 60, height: 60, fill: colors.slate[100], label: 'WC' },
            { x: 4.5, width: 50, height: 85, fill: colors.slate[100], label: 'Shower' }
          ]
        },
        {
          name: '6-Bunk Bay',
          lengthFt: 14,
          color: colors.sky,
          items: [
            { x: 1, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 1' },
            { x: 1, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 2' },
            { x: 5, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 3' },
            { x: 5, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 4' },
            { x: 9, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 5' },
            { x: 9, width: 75, height: 45, fill: colors.slate[800], label: 'Bunk 6' },
            { x: 12, width: 50, height: 110, fill: colors.slate[700], label: 'Firearms' }
          ]
        }
      ]
    }
  }
];

// Generate all images
console.log('Generating enhanced model detail images...\n');

models.forEach(model => {
  // Exterior
  const exteriorSvg = generateDetailedExterior(
    model.slug,
    model.name,
    model.lengthFt,
    model.exterior
  );
  const exteriorPath = path.join('public', 'images', 'models', `${model.slug}-exterior.svg`);
  fs.writeFileSync(exteriorPath, exteriorSvg);
  console.log(`✓ Generated ${exteriorPath}`);
  
  // Interior (for both models)
  if (model.slug === 'standard' || model.slug === 'deluxe') {
    const interiorSvg = generateDetailedInterior(
      model.slug,
      model.name,
      model.lengthFt,
      model.interior.zones
    );
    const interiorPath = path.join('public', 'images', 'models', `${model.slug}-interior.svg`);
    fs.writeFileSync(interiorPath, interiorSvg);
    console.log(`✓ Generated ${interiorPath}`);
  }
  
  console.log('');
});

console.log('✅ All enhanced model detail images generated successfully!');


