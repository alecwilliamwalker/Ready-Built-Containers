/**
 * Generate SVG images for the process page
 * Run with: node scripts/generate-process-images.js
 */

const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = 'public/images';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

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
 * Step 1: Choose your model - Show floor plan layouts
 */
function generateModelsImage() {
  const width = 800;
  const height = 400;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-models" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[50]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-models)"/>
  
  <!-- Three floor plan cards -->
  <!-- Basecamp 20 -->
  <g transform="translate(40, 80)">
    <rect width="200" height="240" fill="white" stroke="${colors.slate[300]}" stroke-width="2" rx="8"/>
    <text x="100" y="30" font-family="system-ui" font-size="14" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">Basecamp 20</text>
    
    <!-- Mini floor plan -->
    <rect x="20" y="50" width="160" height="140" fill="${colors.slate[100]}" rx="4"/>
    <rect x="25" y="55" width="30" height="130" fill="${colors.slate[800]}" opacity="0.3" rx="2"/>
    <rect x="60" y="55" width="60" height="130" fill="${colors.forest}" opacity="0.3" rx="2"/>
    <rect x="125" y="55" width="30" height="130" fill="${colors.cyan}" opacity="0.3" rx="2"/>
    <rect x="160" y="55" width="15" height="130" fill="${colors.sky}" opacity="0.3" rx="2"/>
    
    <text x="100" y="215" font-family="system-ui" font-size="11" fill="${colors.slate[600]}" text-anchor="middle">20' Compact</text>
  </g>
  
  <!-- Basecamp 40 -->
  <g transform="translate(280, 80)">
    <rect width="200" height="240" fill="white" stroke="${colors.emerald}" stroke-width="3" rx="8"/>
    <text x="100" y="30" font-family="system-ui" font-size="14" font-weight="600" fill="${colors.forest}" text-anchor="middle">Basecamp 40</text>
    
    <!-- Mini floor plan -->
    <rect x="20" y="50" width="160" height="140" fill="${colors.slate[100]}" rx="4"/>
    <rect x="25" y="55" width="15" height="130" fill="${colors.slate[800]}" opacity="0.3" rx="2"/>
    <rect x="45" y="55" width="60" height="130" fill="${colors.forest}" opacity="0.3" rx="2"/>
    <rect x="110" y="55" width="30" height="130" fill="${colors.cyan}" opacity="0.3" rx="2"/>
    <rect x="145" y="55" width="30" height="130" fill="${colors.sky}" opacity="0.3" rx="2"/>
    
    <text x="100" y="215" font-family="system-ui" font-size="11" fill="${colors.forest}" text-anchor="middle">40' Flagship</text>
    <circle cx="100" cy="230" r="3" fill="${colors.emerald}"/>
  </g>
  
  <!-- Outfitter 40 Plus -->
  <g transform="translate(520, 80)">
    <rect width="200" height="240" fill="white" stroke="${colors.slate[300]}" stroke-width="2" rx="8"/>
    <text x="100" y="30" font-family="system-ui" font-size="14" font-weight="600" fill="${colors.slate[900]}" text-anchor="middle">Outfitter 40+</text>
    
    <!-- Mini floor plan -->
    <rect x="20" y="50" width="160" height="140" fill="${colors.slate[100]}" rx="4"/>
    <rect x="25" y="55" width="20" height="130" fill="${colors.slate[800]}" opacity="0.3" rx="2"/>
    <rect x="50" y="55" width="55" height="130" fill="${colors.forest}" opacity="0.3" rx="2"/>
    <rect x="110" y="55" width="25" height="130" fill="${colors.cyan}" opacity="0.3" rx="2"/>
    <rect x="140" y="55" width="35" height="130" fill="${colors.sky}" opacity="0.3" rx="2"/>
    
    <text x="100" y="215" font-family="system-ui" font-size="11" fill="${colors.slate[600]}" text-anchor="middle">40' Outfitter</text>
  </g>
</svg>`;
}

/**
 * Step 2: Site & permits - Show documents and site plan
 */
function generatePermitsImage() {
  const width = 800;
  const height = 400;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-permits" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[50]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-permits)"/>
  
  <!-- Document stack -->
  <g transform="translate(100, 60)">
    <!-- Back document -->
    <rect x="20" y="20" width="280" height="280" fill="white" stroke="${colors.slate[300]}" stroke-width="2" rx="4"/>
    
    <!-- Front document -->
    <rect x="0" y="0" width="280" height="280" fill="white" stroke="${colors.slate[400]}" stroke-width="2" rx="4"/>
    
    <!-- Document header -->
    <rect x="20" y="20" width="240" height="40" fill="${colors.emerald}" opacity="0.1" rx="2"/>
    <text x="140" y="45" font-family="system-ui" font-size="16" font-weight="600" fill="${colors.forest}" text-anchor="middle">STAMPED DRAWINGS</text>
    
    <!-- Document lines -->
    ${Array.from({ length: 8 }, (_, i) => `
    <line x1="30" y1="${80 + i * 22}" x2="250" y2="${80 + i * 22}" stroke="${colors.slate[300]}" stroke-width="2"/>
    `).join('')}
    
    <!-- Stamp -->
    <circle cx="220" cy="220" r="30" fill="none" stroke="${colors.emerald}" stroke-width="3"/>
    <text x="220" y="218" font-family="system-ui" font-size="10" font-weight="700" fill="${colors.emerald}" text-anchor="middle">APPROVED</text>
    <text x="220" y="230" font-family="system-ui" font-size="8" fill="${colors.emerald}" text-anchor="middle">ENGINEER</text>
  </g>
  
  <!-- Site plan sketch -->
  <g transform="translate(440, 60)">
    <rect width="280" height="280" fill="white" stroke="${colors.slate[400]}" stroke-width="2" rx="4"/>
    
    <!-- Site elements -->
    <text x="140" y="30" font-family="system-ui" font-size="14" font-weight="600" fill="${colors.slate[700]}" text-anchor="middle">Site Plan</text>
    
    <!-- Property boundary -->
    <rect x="30" y="50" width="220" height="200" fill="none" stroke="${colors.slate[400]}" stroke-width="2" stroke-dasharray="8 4"/>
    
    <!-- Access road -->
    <rect x="30" y="140" width="60" height="40" fill="${colors.slate[300]}" opacity="0.5"/>
    <text x="60" y="165" font-family="system-ui" font-size="9" fill="${colors.slate[600]}" text-anchor="middle">Road</text>
    
    <!-- Container cabin -->
    <rect x="120" y="110" width="100" height="40" fill="${colors.forest}" opacity="0.7" stroke="${colors.forest}" stroke-width="2" rx="2"/>
    <text x="170" y="135" font-family="system-ui" font-size="10" font-weight="600" fill="white" text-anchor="middle">Cabin</text>
    
    <!-- Utilities -->
    <circle cx="180" cy="180" r="4" fill="${colors.cyan}"/>
    <text x="195" y="185" font-family="system-ui" font-size="8" fill="${colors.slate[600]}">Water</text>
    
    <circle cx="180" cy="200" r="4" fill="${colors.amber}"/>
    <text x="195" y="205" font-family="system-ui" font-size="8" fill="${colors.slate[600]}">Power</text>
  </g>
</svg>`;
}

/**
 * Step 3: Build & spec - Show shop fabrication
 */
function generateShopImage() {
  const width = 800;
  const height = 400;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-shop" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[800]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="container-shop" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.slate[600]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[600]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-shop)"/>
  
  <!-- Shop floor -->
  <rect x="0" y="300" width="${width}" height="100" fill="${colors.slate[900]}" opacity="0.5"/>
  
  <!-- Container being fabricated -->
  <g>
    <!-- Main container body -->
    <rect x="150" y="120" width="500" height="180" fill="url(#container-shop)" stroke="${colors.slate[500]}" stroke-width="3" rx="4"/>
    
    <!-- Corrugation lines -->
    ${Array.from({ length: 16 }, (_, i) => `
    <line x1="${180 + i * 30}" y1="120" x2="${180 + i * 30}" y2="300" stroke="${colors.slate[500]}" stroke-width="1" opacity="0.3"/>
    `).join('')}
    
    <!-- Door opening (cut out) -->
    <rect x="200" y="160" width="80" height="120" fill="${colors.amber}" opacity="0.3" stroke="${colors.amber}" stroke-width="2"/>
    <text x="240" y="230" font-family="system-ui" font-size="11" font-weight="600" fill="${colors.amber}" text-anchor="middle">DOOR</text>
    
    <!-- Window opening -->
    <rect x="380" y="160" width="100" height="80" fill="${colors.cyan}" opacity="0.3" stroke="${colors.cyan}" stroke-width="2"/>
    <text x="430" y="205" font-family="system-ui" font-size="11" font-weight="600" fill="${colors.cyan}" text-anchor="middle">WINDOW</text>
    
    <!-- Insulation spray (foam) -->
    <circle cx="550" cy="200" r="8" fill="${colors.emerald}" opacity="0.6"/>
    <circle cx="565" cy="190" r="6" fill="${colors.emerald}" opacity="0.5"/>
    <circle cx="570" cy="210" r="7" fill="${colors.emerald}" opacity="0.4"/>
    <text x="590" y="205" font-family="system-ui" font-size="10" fill="${colors.emerald}">Foam</text>
  </g>
  
  <!-- Welding sparks effect -->
  <g opacity="0.8">
    <circle cx="290" cy="280" r="2" fill="${colors.amber}"/>
    <circle cx="295" cy="275" r="1.5" fill="${colors.amber}"/>
    <circle cx="285" cy="285" r="1" fill="${colors.amber}"/>
    <line x1="290" y1="280" x2="295" y2="270" stroke="${colors.amber}" stroke-width="1"/>
    <line x1="290" y1="280" x2="280" y2="290" stroke="${colors.amber}" stroke-width="1"/>
  </g>
  
  <!-- Tools on ground -->
  <rect x="50" y="320" width="60" height="40" fill="${colors.slate[600]}" rx="2"/>
  <text x="80" y="345" font-family="system-ui" font-size="9" fill="${colors.slate[300]}" text-anchor="middle">Tools</text>
</svg>`;
}

/**
 * Step 4: Delivery - Show truck with container
 */
function generateDeliveryImage() {
  const width = 800;
  const height = 400;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-delivery" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.sky};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${colors.slate[100]};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="container-delivery" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${colors.slate[800]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${colors.slate[700]};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg-delivery)"/>
  
  <!-- Ground/road -->
  <rect x="0" y="280" width="${width}" height="120" fill="${colors.slate[700]}" opacity="0.3"/>
  <line x1="0" y1="300" x2="${width}" y2="300" stroke="${colors.slate[400]}" stroke-width="2" stroke-dasharray="20 15"/>
  
  <!-- Delivery truck -->
  <g transform="translate(100, 180)">
    <!-- Truck cab -->
    <rect x="0" y="60" width="100" height="80" fill="${colors.emerald}" stroke="${colors.forest}" stroke-width="2" rx="4"/>
    <rect x="10" y="70" width="35" height="30" fill="${colors.slate[100]}" opacity="0.7" rx="2"/>
    <rect x="55" y="70" width="35" height="30" fill="${colors.slate[100]}" opacity="0.7" rx="2"/>
    
    <!-- Truck bed/flatbed -->
    <rect x="100" y="80" width="400" height="60" fill="${colors.slate[600]}" stroke="${colors.slate[700]}" stroke-width="2" rx="2"/>
    
    <!-- Container on truck -->
    <rect x="120" y="20" width="360" height="100" fill="url(#container-delivery)" stroke="${colors.slate[600]}" stroke-width="3" rx="4"/>
    
    <!-- Corrugation lines on container -->
    ${Array.from({ length: 12 }, (_, i) => `
    <line x1="${150 + i * 30}" y1="20" x2="${150 + i * 30}" y2="120" stroke="${colors.slate[600]}" stroke-width="1" opacity="0.4"/>
    `).join('')}
    
    <!-- Accent stripe -->
    <rect x="120" y="90" width="360" height="8" fill="${colors.emerald}" opacity="0.8"/>
    
    <!-- Wheels -->
    <circle cx="40" cy="150" r="15" fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2"/>
    <circle cx="40" cy="150" r="8" fill="${colors.slate[700]}"/>
    
    <circle cx="90" cy="150" r="15" fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2"/>
    <circle cx="90" cy="150" r="8" fill="${colors.slate[700]}"/>
    
    <circle cx="450" cy="150" r="15" fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2"/>
    <circle cx="450" cy="150" r="8" fill="${colors.slate[700]}"/>
    
    <circle cx="490" cy="150" r="15" fill="${colors.slate[900]}" stroke="${colors.slate[700]}" stroke-width="2"/>
    <circle cx="490" cy="150" r="8" fill="${colors.slate[700]}"/>
  </g>
  
  <!-- Motion lines -->
  <line x1="20" y1="250" x2="60" y2="250" stroke="${colors.slate[400]}" stroke-width="2" opacity="0.5"/>
  <line x1="30" y1="270" x2="70" y2="270" stroke="${colors.slate[400]}" stroke-width="2" opacity="0.5"/>
</svg>`;
}

// Generate all process images
console.log('Generating process page images...\n');

const images = [
  { name: 'process-1-models.svg', generator: generateModelsImage },
  { name: 'process-2-permits.svg', generator: generatePermitsImage },
  { name: 'process-3-shop.svg', generator: generateShopImage },
  { name: 'process-4-delivery.svg', generator: generateDeliveryImage }
];

images.forEach(({ name, generator }) => {
  const svg = generator();
  const filePath = path.join(outputDir, name);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated ${filePath}`);
});

console.log('\n✅ All process images generated successfully!');


