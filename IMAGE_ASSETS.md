# Image Assets Documentation

## Overview
This document catalogs all placeholder images generated for the Ready Built Containers cabin models.

## Generated Placeholder Images

### Basecamp 20
- **Exterior**: `/public/images/models/basecamp-20-exterior.svg`
  - 1200×600px SVG
  - Features: Compact 20' container with vestibule, windows, emerald accent stripe
  - Color scheme: Slate gray body, emerald accents
  
- **Floorplan**: `/public/images/floorplans/basecamp-20-plan.svg`
  - 1200×400px SVG
  - Zones: Vestibule (3'), Living/Kitchen (9'), Optional Bath (4'), Bunks (4')
  - Color-coded zones with dimension labels

### Basecamp 40
- **Exterior**: `/public/images/models/basecamp-40-exterior.svg`
  - 1200×600px SVG
  - Features: Full 40' container with vestibule, 3 windows, emerald accent stripe
  - Color scheme: Slate gray body, emerald accents
  
- **Interior**: `/public/images/models/basecamp-40-interior.svg`
  - 1200×600px SVG
  - Features: Interior perspective showing kitchen counter, table, bunk beds
  - Color scheme: Light walls, dark wood floors, forest green accents
  
- **Floorplan**: `/public/images/floorplans/basecamp-40-plan.svg`
  - 1200×400px SVG
  - Zones: Vestibule (3'), Living/Kitchen (17'), Hall+Bath (7'), 4-Bunk Cabin (13')
  - Color-coded zones with dimension labels

### Outfitter 40 Plus
- **Exterior**: `/public/images/models/outfitter-40-plus-exterior.svg`
  - 1200×600px SVG
  - Features: 40' container with gear vestibule, 3 windows, amber accent stripe
  - Color scheme: Slate gray body, amber accents (distinguishes from Basecamp 40)
  
- **Floorplan**: `/public/images/floorplans/outfitter-40-plus-plan.svg`
  - 1200×400px SVG
  - Zones: Gear Vestibule (4'), Extended Galley (16'), Full Bath (6'), 6-Bunk Bay (14')
  - Color-coded zones with dimension labels

### Process Page Images

**Step 1 - Choose your model**: `/public/images/process-1-models.svg`
- 800×400px SVG
- Features: Three floor plan cards showing Basecamp 20, Basecamp 40, and Outfitter 40+
- Color scheme: White cards with color-coded zone previews

**Step 2 - Site & permits**: `/public/images/process-2-permits.svg`
- 800×400px SVG
- Features: Stamped engineering drawings and site plan sketch
- Color scheme: Document white with emerald approval stamp

**Step 3 - Build & spec confirmation**: `/public/images/process-3-shop.svg`
- 800×400px SVG
- Features: Container in fabrication shop with door/window cutouts and foam insulation
- Color scheme: Dark shop background with amber/cyan highlights

**Step 4 - Delivery & set**: `/public/images/process-4-delivery.svg`
- 800×400px SVG
- Features: Flatbed truck carrying completed container cabin
- Color scheme: Sky blue background with emerald truck cab

## Color Palette

### Brand Colors
- **Forest**: `#314c3a` - Primary brand color, used for living areas
- **Emerald**: `#10b981` - Accent color for Basecamp models
- **Amber**: `#f59e0b` - Accent color for Outfitter model
- **Cyan**: `#06b6d4` - Bathroom zones
- **Sky**: `#0ea5e9` - Bunk areas
- **Slate 800**: `#1e293b` - Vestibule/entry zones
- **Slate 900**: `#0f172a` - Container body

## Usage in Codebase

### Components Using Images
1. **ModelCard** (`src/components/ModelCard.tsx`)
   - Displays floorplan via ModelPlanThumb
   
2. **ModelPlanThumb** (`src/components/ModelPlanThumb.tsx`)
   - Shows floorplan thumbnails in dark container
   
3. **PlansGallery** (`src/components/PlansGallery.tsx`)
   - Large floorplan display with filtering
   - Uses FloorplanDiagram for dynamic rendering
   
4. **Gallery** (`src/components/Gallery.tsx`)
   - Exterior/interior image carousel
   - Used on individual model detail pages
   
5. **ModelDetail** (`src/components/ModelDetail.tsx`)
   - Full model showcase with image gallery

### Database References
Images are seeded via `prisma/seed.ts`:
- Model images stored in `ModelImage` table
- Floorplans stored in `Floorplan` table
- Linked to parent `Model` records

## Regenerating Images

To regenerate all placeholder images:

**Model and floorplan images:**
```bash
node scripts/generate-placeholder-images.js
```

This will overwrite existing SVG files in:
- `public/images/models/`
- `public/images/floorplans/`

**Process page images:**
```bash
node scripts/generate-process-images.js
```

This will overwrite existing SVG files in:
- `public/images/process-*.svg`

## Future Enhancements

### Recommended Improvements
1. Add interior views for Basecamp 20 and Outfitter 40 Plus
2. Create seasonal/environmental variants (snow, forest, desert)
3. Add night/lit versions showing interior lighting
4. Generate different perspective angles (3/4 view, aerial)
5. Add detail shots (door hardware, window details, solar panels)

### Professional Photography Checklist
When replacing with real photos:
- [ ] Exterior shots at golden hour
- [ ] Interior shots with proper lighting
- [ ] Detail shots of key features
- [ ] Lifestyle shots with people/context
- [ ] Drone aerial views
- [ ] Construction/fabrication process shots
- [ ] Maintain consistent 1200px width for web optimization

